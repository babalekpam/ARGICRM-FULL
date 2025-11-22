/**
 * AI Employee Webhook Endpoints
 * Handles incoming emails and chat messages for autonomous AI processing
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { 
  contacts, 
  deals, 
  emailThreads, 
  chatSessions, 
  activities, 
  aiOperations 
} from "../../shared/schema.js";
import { AIEmployeeService } from "../services/ai-employee.js";
import { eq, and } from "drizzle-orm";
import { TenantRequest } from "../middleware/tenant.js";
import { createTransporter } from "../email-transporter.js";

// Initialize AI Employee Service
const aiEmployee = new AIEmployeeService();

// Request validation schemas
const emailWebhookSchema = z.object({
  from_addr: z.string().email(),
  name: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  thread_id: z.string().optional(),
});

const chatWebhookSchema = z.object({
  session_id: z.string(),
  message: z.string(),
});

/**
 * POST /api/webhooks/email
 * Handles incoming emails from external email service (SendGrid Inbound Parse, etc.)
 */
async function handleEmailWebhook(req: TenantRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate request body
    const validatedData = emailWebhookSchema.parse(req.body);
    const { from_addr, name, subject, body, thread_id } = validatedData;

    // Start AI operation tracking
    const [aiOp] = await db.insert(aiOperations).values({
      tenantId,
      operationType: "email_reply",
      status: "processing",
      input: { from_addr, subject, body },
    }).returning();

    const startTime = Date.now();

    try {
      // Step 1: Use AI to classify and generate response
      const aiResult = await aiEmployee.classifyAndRespondToEmail({
        emailBody: body,
        contactName: name,
      });

      const { classification, response: aiResponse } = aiResult;

      // Step 2: Find or create contact
      let contact = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.tenantId, tenantId),
          eq(contacts.email, from_addr)
        ),
      });

      if (!contact) {
        const [newContact] = await db.insert(contacts).values({
          tenantId,
          email: from_addr,
          name: name || from_addr.split('@')[0],
          leadScore: classification.score || 50,
          lastIntent: classification.intent,
          lastChannel: 'email',
          optIn: true,
          status: 'prospect',
        }).returning();
        contact = newContact;
      } else {
        // Update existing contact
        await db.update(contacts)
          .set({
            leadScore: classification.score || contact.leadScore,
            lastIntent: classification.intent,
            lastChannel: 'email',
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, contact.id));
      }

      // Step 3: Create or update deal
      let deal = await db.query.deals.findFirst({
        where: and(
          eq(deals.tenantId, tenantId),
          eq(deals.contactId, contact.id)
        ),
      });

      if (!deal && classification.intent !== 'unsubscribe' && classification.intent !== 'bounce') {
        const [newDeal] = await db.insert(deals).values({
          tenantId,
          contactId: contact.id,
          name: `Deal - ${contact.name}`,
          stage: classification.nextStage || 'qualification',
          status: 'open',
          source: 'email',
          score: classification.score || 0,
          nextBestAction: classification.nextAction,
          lastTouch: new Date(),
        }).returning();
        deal = newDeal;
      } else if (deal) {
        // Update existing deal
        await db.update(deals)
          .set({
            stage: classification.nextStage || deal.stage,
            score: classification.score || deal.score,
            nextBestAction: classification.nextAction,
            lastTouch: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(deals.id, deal.id));
      }

      // Step 4: Save email to email_threads
      await db.insert(emailThreads).values({
        tenantId,
        contactId: contact.id,
        dealId: deal?.id?.toString(),
        subject,
        fromEmail: from_addr,
        toEmail: process.env.SMTP_FROM_EMAIL || 'no-reply@argilette.org',
        body,
        direction: 'inbound',
        intent: classification.intent,
        sentiment: classification.sentiment,
        aiProcessed: true,
        aiResponse: aiResponse || null,
        threadId: thread_id,
      });

      // Step 5: Log activity
      await db.insert(activities).values({
        tenantId,
        contactId: contact.id,
        dealId: deal?.id?.toString(),
        type: 'email',
        channel: 'email',
        direction: 'inbound',
        content: body,
        meta: {
          subject,
          intent: classification.intent,
          sentiment: classification.sentiment,
          threadId: thread_id,
        },
      });

      // Step 6: Send AI response if appropriate
      let emailSent = false;
      if (aiResponse && !['unsubscribe', 'ooo', 'bounce'].includes(classification.intent.toLowerCase())) {
        try {
          const transporter = await createTransporter();
          if (transporter) {
            const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@argilette.org';
            await transporter.sendMail({
              from: `"ARGILETTE AI" <${fromEmail}>`,
              to: from_addr,
              subject: `Re: ${subject}`,
              text: aiResponse,
              html: `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`,
            });
            emailSent = true;

            // Log outbound email activity
            await db.insert(activities).values({
              tenantId,
              contactId: contact.id,
              dealId: deal?.id?.toString(),
              type: 'email',
              channel: 'email',
              direction: 'outbound',
              content: aiResponse,
              meta: {
                subject: `Re: ${subject}`,
                aiGenerated: true,
              },
            });

            // Save outbound email to threads
            await db.insert(emailThreads).values({
              tenantId,
              contactId: contact.id,
              dealId: deal?.id?.toString(),
              subject: `Re: ${subject}`,
              fromEmail: fromEmail,
              toEmail: from_addr,
              body: aiResponse,
              direction: 'outbound',
              intent: classification.intent,
              sentiment: 'positive',
              aiProcessed: true,
              threadId: thread_id,
            });
          }
        } catch (emailError) {
          console.error('Failed to send AI response email:', emailError);
        }
      }

      // Update AI operation with success
      const processingTime = Date.now() - startTime;
      await db.update(aiOperations)
        .set({
          status: 'completed',
          output: {
            intent: classification.intent,
            score: classification.score,
            emailSent,
          },
          processingTime,
          completedAt: new Date(),
        })
        .where(eq(aiOperations.id, aiOp.id));

      return res.json({
        ok: true,
        intent: classification.intent,
        response: emailSent ? aiResponse : undefined,
        contactId: contact.id,
        dealId: deal?.id,
      });

    } catch (error) {
      // Update AI operation with error
      await db.update(aiOperations)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(aiOperations.id, aiOp.id));
      
      throw error;
    }

  } catch (error) {
    console.error('Email webhook error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }

    return res.status(500).json({ 
      error: "Failed to process email",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/webhooks/chat
 * Handles incoming chat messages from website widget
 */
async function handleChatWebhook(req: TenantRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate request body
    const validatedData = chatWebhookSchema.parse(req.body);
    const { session_id, message } = validatedData;

    // Start AI operation tracking
    const [aiOp] = await db.insert(aiOperations).values({
      tenantId,
      operationType: "chat_response",
      status: "processing",
      input: { session_id, message },
    }).returning();

    const startTime = Date.now();

    try {
      // Step 1: Find or create chat session
      let session = await db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.tenantId, tenantId),
          eq(chatSessions.sessionId, session_id)
        ),
      });

      if (!session) {
        const [newSession] = await db.insert(chatSessions).values({
          tenantId,
          sessionId: session_id,
          status: 'active',
          leadQuality: 0,
          messages: [],
          qualificationData: {},
        }).returning();
        session = newSession;
      }

      // Step 2: Generate AI response
      const aiResult = await aiEmployee.generateChatResponse({
        userMessage: message,
        conversationHistory: session.messages as Array<{ role: 'user' | 'bot'; content: string }>,
        qualificationData: session.qualificationData,
      });

      const { response: botReply, qualificationUpdates, isQualified } = aiResult;

      // Step 3: Update chat session with new message and bot response
      const updatedMessages = [
        ...(session.messages as any[] || []),
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'bot', content: botReply, timestamp: new Date().toISOString() },
      ];

      const updatedQualificationData = {
        ...(session.qualificationData || {}),
        ...(qualificationUpdates || {}),
      };

      // Calculate lead quality score (0-100)
      let leadQuality = session.leadQuality || 0;
      if (qualificationUpdates) {
        const signals = Object.keys(qualificationUpdates).length;
        leadQuality = Math.min(100, leadQuality + (signals * 20));
      }

      await db.update(chatSessions)
        .set({
          messages: updatedMessages,
          qualificationData: updatedQualificationData,
          leadQuality,
          status: isQualified ? 'qualified' : session.status,
          lastMessageAt: new Date(),
        })
        .where(eq(chatSessions.id, session.id));

      // Step 4: Create contact if qualified
      let contactCreated = false;
      let contactId = session.contactId;

      if (isQualified && !session.contactId) {
        // Extract email from qualification data if available
        const email = (updatedQualificationData as any).email || `chat_${session_id}@temp.argilette.org`;
        const name = (updatedQualificationData as any).name || `Chat User ${session_id.slice(0, 8)}`;

        const [newContact] = await db.insert(contacts).values({
          tenantId,
          email,
          name,
          leadScore: leadQuality,
          lastIntent: 'positive',
          lastChannel: 'chat',
          optIn: true,
          status: 'prospect',
        }).returning();

        contactId = newContact.id;
        contactCreated = true;

        // Update session with contact reference
        await db.update(chatSessions)
          .set({ 
            contactId: newContact.id,
            status: 'converted',
          })
          .where(eq(chatSessions.id, session.id));

        // Create deal for qualified lead
        await db.insert(deals).values({
          tenantId,
          contactId: newContact.id,
          name: `Chat Lead - ${name}`,
          stage: 'qualification',
          status: 'open',
          source: 'chat',
          score: leadQuality,
          nextBestAction: 'Schedule demo call',
          lastTouch: new Date(),
        });

        // Log activity
        await db.insert(activities).values({
          tenantId,
          contactId: newContact.id,
          type: 'chat',
          channel: 'chat',
          direction: 'inbound',
          content: `Chat conversation qualified - ${updatedMessages.length} messages`,
          meta: {
            sessionId: session_id,
            qualificationData: updatedQualificationData,
            leadQuality,
          },
        });
      }

      // Update AI operation with success
      const processingTime = Date.now() - startTime;
      await db.update(aiOperations)
        .set({
          status: 'completed',
          output: {
            reply: botReply,
            isQualified,
            contactCreated,
            leadQuality,
          },
          processingTime,
          completedAt: new Date(),
        })
        .where(eq(aiOperations.id, aiOp.id));

      return res.json({
        reply: botReply,
        isQualified,
        contactCreated,
        contactId,
        leadQuality,
      });

    } catch (error) {
      // Update AI operation with error
      await db.update(aiOperations)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(aiOperations.id, aiOp.id));
      
      throw error;
    }

  } catch (error) {
    console.error('Chat webhook error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: error.errors 
      });
    }

    return res.status(500).json({ 
      error: "Failed to process chat message",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Register webhook routes
 */
export function registerWebhookRoutes(app: Express) {
  app.post("/api/webhooks/email", handleEmailWebhook as any);
  app.post("/api/webhooks/chat", handleChatWebhook as any);
  
  console.log("✅ AI Employee webhook routes registered:");
  console.log("   POST /api/webhooks/email");
  console.log("   POST /api/webhooks/chat");
}
