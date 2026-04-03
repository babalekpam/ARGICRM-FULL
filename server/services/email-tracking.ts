import { db } from "../db.js";
import { sql } from "drizzle-orm";

const TRACKING_BASE = process.env.APP_URL || "https://argilette.org";

// ── 1x1 transparent GIF ──────────────────────────────────────────
export const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// ── Wrap all links in email HTML with click-tracking redirects ───
export function embedTracking(
  html: string,
  trackingId: string,
  linkMap: Record<string, string>
): string {
  let linkIndex = 0;
  const wrapped = html.replace(/href="(https?:\/\/[^"]+)"/gi, (_, url) => {
    const linkId = `l${linkIndex++}`;
    linkMap[linkId] = url;
    return `href="${TRACKING_BASE}/track/click/${trackingId}/${linkId}"`;
  });

  const pixel = `<img src="${TRACKING_BASE}/track/open/${trackingId}.gif" width="1" height="1" style="display:none;border:0;width:1px;height:1px;" alt="" />`;
  return wrapped.replace(/<\/body>/i, `${pixel}</body>`) + (wrapped.includes("</body>") ? "" : pixel);
}

// ── Log an email event and update contact scores ─────────────────
export async function logEmailEvent(opts: {
  tenantId: string;
  trackingId: string;
  eventType: "open" | "click" | "forward";
  ip?: string;
  userAgent?: string;
  url?: string;
  isForward?: boolean;
}) {
  const { tenantId, trackingId, eventType, ip, userAgent, url, isForward } = opts;

  // Find email send record
  const [send] = await db.execute<{
    id: string; contact_id: string | null; first_opener_ip: string | null; first_opened_at: string | null;
  }>(sql`SELECT id, contact_id, first_opener_ip, first_opened_at FROM email_sends WHERE tracking_id = ${trackingId}::uuid LIMIT 1`);

  if (!send) return null;

  // Insert event
  await db.execute(sql`
    INSERT INTO email_events (tenant_id, email_send_id, contact_id, tracking_id, event_type, ip, user_agent, url, is_forward)
    VALUES (${tenantId}, ${send.id}::uuid, ${send.contact_id}, ${trackingId}::uuid, ${eventType}, ${ip || null}, ${userAgent || null}, ${url || null}, ${isForward || false})
  `);

  // Mark first open
  if (eventType === "open" && !send.first_opened_at) {
    await db.execute(sql`
      UPDATE email_sends SET first_opener_ip = ${ip || null}, first_opener_ua = ${userAgent || null}, first_opened_at = now(), status = 'opened'
      WHERE id = ${send.id}::uuid
    `);
  }

  // Update contact engagement if we have a contact_id
  if (send.contact_id) {
    const points = eventType === "open" ? 5 : eventType === "click" ? 15 : 25;
    const col = eventType === "open" ? "email_opens" : eventType === "click" ? "email_clicks" : "email_forwards";
    await db.execute(sql`
      UPDATE contacts SET
        engagement_score = LEAST(100, COALESCE(engagement_score, 0) + ${points}),
        ${sql.raw(col)} = COALESCE(${sql.raw(col)}, 0) + 1,
        last_engaged_at = now()
      WHERE id = ${send.contact_id}
    `);
  }

  return send;
}

// ── Detect forward: same tracking_id opened from different IP ───
export async function detectForward(
  trackingId: string,
  currentIp: string
): Promise<boolean> {
  const [send] = await db.execute<{ first_opener_ip: string | null }>(
    sql`SELECT first_opener_ip FROM email_sends WHERE tracking_id = ${trackingId}::uuid LIMIT 1`
  );
  if (!send) return false;
  if (!send.first_opener_ip) return false;
  // Different IP = likely a forward
  return send.first_opener_ip !== currentIp;
}

// ── Get per-contact email timeline ───────────────────────────────
export async function getContactEmailTimeline(contactId: string, tenantId: string) {
  const sends = await db.execute<any>(sql`
    SELECT
      es.id, es.tracking_id, es.subject, es.to_email, es.from_name, es.sent_at, es.status,
      COALESCE(json_agg(ee ORDER BY ee.occurred_at DESC) FILTER (WHERE ee.id IS NOT NULL), '[]') AS events
    FROM email_sends es
    LEFT JOIN email_events ee ON ee.email_send_id = es.id
    WHERE es.contact_id = ${contactId} AND es.tenant_id = ${tenantId}
    GROUP BY es.id
    ORDER BY es.sent_at DESC
    LIMIT 50
  `);
  return sends;
}

// ── Analytics overview for tenant ─────────────────────────────────
export async function getEmailAnalytics(tenantId: string) {
  const [totals] = await db.execute<any>(sql`
    SELECT
      COUNT(DISTINCT es.id) AS total_sent,
      COUNT(DISTINCT CASE WHEN es.status = 'opened' THEN es.id END) AS total_opened,
      COUNT(DISTINCT CASE WHEN ee.event_type = 'click' THEN es.id END) AS total_clicked,
      COUNT(DISTINCT CASE WHEN ee.is_forward = true THEN es.id END) AS total_forwarded,
      ROUND(
        COUNT(DISTINCT CASE WHEN es.status = 'opened' THEN es.id END)::numeric /
        NULLIF(COUNT(DISTINCT es.id), 0) * 100, 1
      ) AS open_rate,
      ROUND(
        COUNT(DISTINCT CASE WHEN ee.event_type = 'click' THEN es.id END)::numeric /
        NULLIF(COUNT(DISTINCT es.id), 0) * 100, 1
      ) AS click_rate
    FROM email_sends es
    LEFT JOIN email_events ee ON ee.email_send_id = es.id
    WHERE es.tenant_id = ${tenantId}
  `);

  const hotLeads = await db.execute<any>(sql`
    SELECT c.id, c.first_name, c.last_name, c.name, c.email, c.company, c.job_title,
           c.engagement_score, c.email_opens, c.email_clicks, c.email_forwards, c.last_engaged_at
    FROM contacts c
    WHERE c.tenant_id = ${tenantId} AND c.engagement_score > 0
    ORDER BY c.engagement_score DESC
    LIMIT 20
  `);

  const recentEvents = await db.execute<any>(sql`
    SELECT ee.event_type, ee.occurred_at, ee.is_forward, ee.ip,
           es.subject, es.to_email,
           c.first_name, c.last_name, c.name AS contact_name, c.company
    FROM email_events ee
    JOIN email_sends es ON es.id = ee.email_send_id
    LEFT JOIN contacts c ON c.id = es.contact_id
    WHERE ee.tenant_id = ${tenantId}
    ORDER BY ee.occurred_at DESC
    LIMIT 50
  `);

  return { totals, hotLeads, recentEvents };
}
