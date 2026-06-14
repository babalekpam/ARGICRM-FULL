/**
 * Outbound webhook dispatch + delivery worker.
 *
 * emitEvent() fans an event out to every active subscription for the tenant and
 * records a `webhook_deliveries` row. A background worker (startWebhookWorker)
 * delivers pending rows with HMAC-signed payloads and exponential-backoff retry
 * — mirroring the existing startWorkflowScheduler pattern in routes/workflows.ts.
 */
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { createHmac } from "crypto";

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [0, 60_000, 300_000, 1_800_000, 7_200_000]; // 0s,1m,5m,30m,2h

export const WEBHOOK_RESOURCES = [
  "contact",
  "lead",
  "deal",
  "task",
  "account",
  "campaign",
  "invoice",
] as const;

export const WEBHOOK_EVENTS: string[] = WEBHOOK_RESOURCES.flatMap((r) => [
  `${r}.created`,
  `${r}.updated`,
  `${r}.deleted`,
]);

/** Queue an event for delivery to all matching webhook subscriptions. */
export async function emitEvent(tenantId: string, event: string, data: any): Promise<void> {
  try {
    const hooks = await db.execute(sql`
      SELECT id FROM webhooks
      WHERE tenant_id = ${tenantId} AND is_active = true AND ${event} = ANY(events)
    `);
    const rows = hooks.rows as any[];
    if (!rows.length) return;

    const payload = { event, data, timestamp: new Date().toISOString() };
    for (const h of rows) {
      await db.execute(sql`
        INSERT INTO webhook_deliveries (webhook_id, tenant_id, event, payload, status, next_retry_at)
        VALUES (${h.id}, ${tenantId}, ${event}, ${JSON.stringify(payload)}::jsonb, 'pending', now())
      `);
    }
    void deliverPending().catch(() => {});
  } catch (err) {
    console.error("[webhooks] emit error:", (err as Error).message);
  }
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverOne(d: any): Promise<void> {
  const hook = (
    await db.execute(sql`SELECT url, secret, is_active FROM webhooks WHERE id = ${d.webhook_id} LIMIT 1`)
  ).rows[0] as any;

  if (!hook || !hook.is_active) {
    await db.execute(sql`UPDATE webhook_deliveries SET status = 'cancelled' WHERE id = ${d.id}`);
    return;
  }

  const body = typeof d.payload === "string" ? d.payload : JSON.stringify(d.payload);
  const attempt = (d.attempts ?? 0) + 1;

  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Argicrm-Event": d.event,
        "X-Argicrm-Signature": sign(hook.secret, body),
        "X-Argicrm-Delivery": d.id,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET status = 'delivered', attempts = ${attempt}, response_status = ${res.status},
            delivered_at = now(), next_retry_at = NULL
        WHERE id = ${d.id}
      `);
    } else {
      await scheduleRetry(d.id, attempt, res.status, (await res.text().catch(() => "")).slice(0, 500));
    }
  } catch (err) {
    await scheduleRetry(d.id, attempt, null, (err as Error).message.slice(0, 500));
  }
}

async function scheduleRetry(id: string, attempt: number, status: number | null, bodyText: string) {
  if (attempt >= MAX_ATTEMPTS) {
    await db.execute(sql`
      UPDATE webhook_deliveries
      SET status = 'failed', attempts = ${attempt}, response_status = ${status}, response_body = ${bodyText}, next_retry_at = NULL
      WHERE id = ${id}
    `);
    return;
  }
  const delayMs = BACKOFF_MS[attempt] ?? 7_200_000;
  await db.execute(sql`
    UPDATE webhook_deliveries
    SET status = 'pending', attempts = ${attempt}, response_status = ${status}, response_body = ${bodyText},
        next_retry_at = now() + (${delayMs} || ' milliseconds')::interval
    WHERE id = ${id}
  `);
}

let delivering = false;
async function deliverPending(): Promise<void> {
  if (delivering) return;
  delivering = true;
  try {
    const due = await db.execute(sql`
      SELECT id, webhook_id, tenant_id, event, payload, attempts
      FROM webhook_deliveries
      WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= now())
      ORDER BY created_at ASC
      LIMIT 25
    `);
    for (const d of due.rows as any[]) {
      await deliverOne(d);
    }
  } finally {
    delivering = false;
  }
}

export function startWebhookWorker(): void {
  setInterval(() => void deliverPending().catch(() => {}), 30_000);
  console.log("[webhooks] delivery worker started (30s tick)");
}
