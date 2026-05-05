/**
 * Outbound webhook dispatcher (§8.6).
 *
 * Signs every payload with HMAC-SHA256 using the per-endpoint secret and
 * sends as `X-Argilette-Signature: sha256=<hex>`. Retries up to 4 times
 * with exponential backoff via p-retry. Each attempt updates the
 * webhook_deliveries row with status_code + response (truncated).
 *
 * Endpoints with 5+ consecutive failures are auto-deactivated until the
 * tenant re-enables them.
 */
import crypto from "node:crypto";
import pRetry, { AbortError } from "p-retry";
import axios from "axios";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

export function signPayload(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function findActiveEndpoints(tenantId: string, event: string) {
  const r = await db.execute(sql`
    SELECT id, url, secret, events
    FROM webhook_endpoints
    WHERE tenant_id = ${tenantId}
      AND is_active = true
      AND (cardinality(events) = 0 OR ${event} = ANY(events))
  `);
  return r.rows as Array<{ id: string; url: string; secret: string; events: string[] }>;
}

export interface DispatchOpts {
  tenantId: string;
  event: string;             // e.g. 'contact.created', 'deal.won'
  payload: any;
}

/**
 * Fan-out an event to all matching active endpoints for a tenant.
 * Each endpoint gets its own webhook_deliveries row + retry loop.
 * Errors are swallowed — webhooks should never block an inbound request.
 */
export async function dispatchEvent(opts: DispatchOpts): Promise<void> {
  try {
    const endpoints = await findActiveEndpoints(opts.tenantId, opts.event);
    if (endpoints.length === 0) return;

    await Promise.all(endpoints.map(ep => deliverToEndpoint(opts, ep)));
  } catch (e: any) {
    console.warn("[WEBHOOKS] dispatch error:", String(e?.message || e).slice(0, 200));
  }
}

async function deliverToEndpoint(
  opts: DispatchOpts,
  ep: { id: string; url: string; secret: string },
) {
  const body = JSON.stringify({
    event: opts.event,
    tenant_id: opts.tenantId,
    sent_at: new Date().toISOString(),
    data: opts.payload,
  });
  const signature = signPayload(ep.secret, body);

  const dr = await db.execute(sql`
    INSERT INTO webhook_deliveries (tenant_id, endpoint_id, event, payload, status, attempts)
    VALUES (${opts.tenantId}, ${ep.id}, ${opts.event}, ${JSON.parse(body)}::jsonb, 'pending', 0)
    RETURNING id
  `);
  const deliveryId = (dr.rows[0] as any)?.id;

  let lastStatus = 0;
  let lastBody = "";

  try {
    await pRetry(async (attempt) => {
      try {
        const res = await axios.post(ep.url, body, {
          headers: {
            "Content-Type": "application/json",
            "X-Argilette-Signature": signature,
            "X-Argilette-Event": opts.event,
            "X-Argilette-Delivery": deliveryId,
          },
          timeout: 10_000,
          validateStatus: () => true, // we'll decide based on status
        });
        lastStatus = res.status;
        lastBody = String(res.data || "").slice(0, 1000);

        if (res.status >= 500 || res.status === 429) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (res.status >= 400) {
          // 4xx — don't retry, the request is malformed from the receiver's view.
          throw new AbortError(`HTTP ${res.status}`);
        }
      } catch (err: any) {
        lastStatus = lastStatus || 0;
        lastBody = String(err?.message || err).slice(0, 1000);
        // Update delivery row mid-retry so it's visible in the UI.
        if (deliveryId) {
          await db.execute(sql`
            UPDATE webhook_deliveries
            SET attempts = ${attempt}, last_status_code = ${lastStatus},
                last_response = ${lastBody}, last_attempt_at = now()
            WHERE id = ${deliveryId}
          `).catch(() => {});
        }
        throw err;
      }
    }, {
      retries: 4,
      minTimeout: 1_000,
      factor: 2, // 1s, 2s, 4s, 8s, 16s
      onFailedAttempt: (e) => {
        console.warn(`[WEBHOOKS] attempt ${e.attemptNumber} failed for ${ep.url}: ${e.message}`);
      },
    });

    if (deliveryId) {
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET status = 'delivered', delivered_at = now(),
            last_status_code = ${lastStatus}, last_response = ${lastBody},
            last_attempt_at = now()
        WHERE id = ${deliveryId}
      `).catch(() => {});
      await db.execute(sql`
        UPDATE webhook_endpoints SET last_success_at = now(), failure_count = 0
        WHERE id = ${ep.id}
      `).catch(() => {});
    }
  } catch (err) {
    if (deliveryId) {
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET status = 'failed', last_status_code = ${lastStatus}, last_response = ${lastBody},
            last_attempt_at = now()
        WHERE id = ${deliveryId}
      `).catch(() => {});
    }
    // Bump endpoint failure_count; auto-deactivate after 5 in a row.
    const upd = await db.execute(sql`
      UPDATE webhook_endpoints
      SET failure_count = failure_count + 1, last_failure_at = now()
      WHERE id = ${ep.id}
      RETURNING failure_count
    `).catch(() => null);
    const fc = Number((upd?.rows[0] as any)?.failure_count || 0);
    if (fc >= 5) {
      await db.execute(sql`
        UPDATE webhook_endpoints SET is_active = false WHERE id = ${ep.id}
      `).catch(() => {});
      console.warn(`[WEBHOOKS] endpoint ${ep.id} auto-deactivated after ${fc} failures`);
    }
  }
}

export function generateWebhookSecret(): string {
  return "whsec_" + crypto.randomBytes(32).toString("base64url");
}
