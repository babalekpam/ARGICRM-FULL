import { Router, type Request, type Response } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import {
  TRACKING_PIXEL, embedTracking, logEmailEvent, detectForward,
  getContactEmailTimeline, getEmailAnalytics,
} from "../services/email-tracking.js";
import { sendWithTenantSmtp } from "../services/email.js";

const router = Router();

// ────────────────────────────────────────────────────────────────
// PUBLIC — no auth — called by email clients
// ────────────────────────────────────────────────────────────────

// Open tracking pixel
router.get("/open/:trackingId.gif", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  const ua = req.headers["user-agent"] || "";

  try {
    // Detect if this looks like a bot / Apple MPP pre-fetch
    const isBotOrProxy = /bot|crawl|spider|preload|preview|AppleProxy|Googlebot/i.test(ua);
    if (!isBotOrProxy) {
      const isForward = await detectForward(trackingId, ip);
      // Get tenantId from send record
      const [send] = (await db.execute<{ tenant_id: string }>(
        sql`SELECT tenant_id FROM email_sends WHERE tracking_id = ${trackingId}::uuid LIMIT 1`
      )).rows;
      if (send) {
        await logEmailEvent({
          tenantId: send.tenant_id,
          trackingId,
          eventType: isForward ? "forward" : "open",
          ip,
          userAgent: ua,
          isForward,
        });
      }
    }
  } catch { /* always return pixel */ }

  res.set({
    "Content-Type": "image/gif",
    "Content-Length": String(TRACKING_PIXEL.length),
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  res.end(TRACKING_PIXEL);
});

// Click tracking redirect
router.get("/click/:trackingId/:linkId", async (req: Request, res: Response) => {
  const { trackingId, linkId } = req.params;
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
  const ua = req.headers["user-agent"] || "";

  let destination = "/";
  try {
    const [send] = (await db.execute<{ tenant_id: string; link_map: any }>(
      sql`SELECT tenant_id, link_map FROM email_sends WHERE tracking_id = ${trackingId}::uuid LIMIT 1`
    )).rows;
    if (send) {
      const linkMap = send.link_map || {};
      destination = linkMap[linkId] || "/";
      await logEmailEvent({
        tenantId: send.tenant_id,
        trackingId,
        eventType: "click",
        ip,
        userAgent: ua,
        url: destination,
        isForward: false,
      });
    }
  } catch { /* redirect anyway */ }

  res.redirect(302, destination);
});

// ────────────────────────────────────────────────────────────────
// AUTHENTICATED API
// ────────────────────────────────────────────────────────────────

// Send a tracked email
router.post("/send", authenticate, async (req: AuthRequest, res) => {
  const { contactId, leadId, toEmail, toName, subject, html } = req.body;
  if (!toEmail || !subject || !html) {
    return res.status(400).json({ error: "toEmail, subject, html are required" });
  }

  const tenantId = req.user!.tenantId;

  // Get tenant SMTP config
  const { db: database } = await import("../db.js");
  const [tenant] = (await database.execute<any>(
    sql`SELECT settings FROM tenants WHERE id = ${tenantId} LIMIT 1`
  )).rows;
  const smtp = (tenant?.settings as any)?.smtp;
  if (!smtp?.host || !smtp?.user || !smtp?.pass) {
    return res.status(400).json({ error: "SMTP not configured. Go to Settings → SMTP to set it up." });
  }

  // Generate tracking ID and link map
  const [{ tracking_id }] = (await database.execute<{ tracking_id: string }>(
    sql`SELECT gen_random_uuid()::text AS tracking_id`
  )).rows;
  const linkMap: Record<string, string> = {};
  const trackedHtml = embedTracking(html, tracking_id, linkMap);

  // Save send record
  await database.execute(sql`
    INSERT INTO email_sends (tenant_id, contact_id, lead_id, tracking_id, from_email, from_name, to_email, subject, html, link_map)
    VALUES (
      ${tenantId}, ${contactId || null}, ${leadId || null}, ${tracking_id}::uuid,
      ${smtp.senderEmail || smtp.user}, ${smtp.senderName || ""},
      ${toEmail}, ${subject}, ${trackedHtml},
      ${JSON.stringify(linkMap)}::jsonb
    )
  `);

  // Send the email
  await sendWithTenantSmtp(smtp, toEmail, subject, trackedHtml);

  res.json({ success: true, trackingId: tracking_id, message: `Email sent to ${toEmail} with tracking enabled` });
});

// Get analytics overview
router.get("/analytics", authenticate, async (req: AuthRequest, res) => {
  const data = await getEmailAnalytics(req.user!.tenantId);
  res.json(data);
});

// Get per-contact email timeline
router.get("/contact/:contactId", authenticate, async (req: AuthRequest, res) => {
  const timeline = await getContactEmailTimeline(req.params.contactId, req.user!.tenantId);
  res.json(timeline);
});

// List all sent emails for tenant
router.get("/sends", authenticate, async (req: AuthRequest, res) => {
  const sends = await db.execute<any>(sql`
    SELECT es.*, c.first_name, c.last_name, c.name AS contact_name, c.company,
      (SELECT COUNT(*) FROM email_events ee WHERE ee.email_send_id = es.id AND ee.event_type = 'open') AS open_count,
      (SELECT COUNT(*) FROM email_events ee WHERE ee.email_send_id = es.id AND ee.event_type = 'click') AS click_count,
      (SELECT COUNT(*) FROM email_events ee WHERE ee.email_send_id = es.id AND ee.is_forward = true) AS forward_count
    FROM email_sends es
    LEFT JOIN contacts c ON c.id = es.contact_id
    WHERE es.tenant_id = ${req.user!.tenantId}
    ORDER BY es.sent_at DESC
    LIMIT 100
  `);
  res.json(sends);
});

export default router;
