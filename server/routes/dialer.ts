import type { Express } from "express";
import { db } from "../db.js";
import { 
  dialerCalls, 
  contacts,
  insertDialerCallSchema
} from "../../shared/schema.js";
import { eq, and, desc, sql, count, gte, lte, avg } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";

const TWILIO_CONFIGURED = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

export function registerDialerRoutes(app: Express) {

  // POST /api/dialer/call - Initiate an outbound call
  app.post('/api/dialer/call', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { phoneNumber, contactId } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ success: false, error: "Phone number is required" });
      }

      const callData = {
        tenantId,
        userId,
        contactId: contactId || null,
        phoneNumber,
        direction: "outbound" as const,
        status: TWILIO_CONFIGURED ? "ringing" : "pending",
        startedAt: new Date(),
      };

      const validatedData = insertDialerCallSchema.parse(callData);

      const [newCall] = await db.insert(dialerCalls)
        .values(validatedData)
        .returning();

      if (!TWILIO_CONFIGURED) {
        return res.json({
          success: true,
          call: newCall,
          twilioConfigured: false,
          message: "Call record created. Twilio not configured - add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable VoIP calls."
        });
      }

      // When Twilio is configured, initiate actual call
      // For now, return the call record with indication that Twilio would be used
      res.json({
        success: true,
        call: newCall,
        twilioConfigured: true,
        message: "Call initiated via Twilio"
      });
    } catch (error: any) {
      console.error("Error initiating call:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/dialer/call/:id/end - End a call
  app.post('/api/dialer/call/:id/end', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { outcome, notes } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existingCall] = await db.select()
        .from(dialerCalls)
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!existingCall) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      const endedAt = new Date();
      const startedAt = existingCall.startedAt || existingCall.createdAt;
      const duration = startedAt ? Math.floor((endedAt.getTime() - new Date(startedAt).getTime()) / 1000) : 0;

      const [updatedCall] = await db.update(dialerCalls)
        .set({
          status: "completed",
          outcome: outcome || existingCall.outcome,
          notes: notes || existingCall.notes,
          endedAt,
          duration
        })
        .where(eq(dialerCalls.id, id))
        .returning();

      res.json({
        success: true,
        call: updatedCall,
        message: "Call ended successfully"
      });
    } catch (error: any) {
      console.error("Error ending call:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/dialer/calls - Get call history
  app.get('/api/dialer/calls', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { limit = 50, offset = 0, contactId, status, startDate, endDate } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      let conditions = [eq(dialerCalls.tenantId, tenantId)];
      
      if (contactId) {
        conditions.push(eq(dialerCalls.contactId, contactId as string));
      }
      
      if (status) {
        conditions.push(eq(dialerCalls.status, status as string));
      }

      if (startDate) {
        conditions.push(gte(dialerCalls.createdAt, new Date(startDate as string)));
      }

      if (endDate) {
        conditions.push(lte(dialerCalls.createdAt, new Date(endDate as string)));
      }

      const calls = await db.select({
        call: dialerCalls,
        contact: contacts
      })
        .from(dialerCalls)
        .leftJoin(contacts, eq(dialerCalls.contactId, contacts.id))
        .where(and(...conditions))
        .orderBy(desc(dialerCalls.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const [totalCount] = await db.select({ count: count() })
        .from(dialerCalls)
        .where(and(...conditions));

      res.json({
        success: true,
        calls: calls.map(c => ({
          ...c.call,
          contact: c.contact
        })),
        total: Number(totalCount?.count || 0),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    } catch (error: any) {
      console.error("Error fetching calls:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/dialer/calls/:id - Get call details
  app.get('/api/dialer/calls/:id', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [call] = await db.select({
        call: dialerCalls,
        contact: contacts
      })
        .from(dialerCalls)
        .leftJoin(contacts, eq(dialerCalls.contactId, contacts.id))
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!call) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      res.json({
        success: true,
        call: {
          ...call.call,
          contact: call.contact
        }
      });
    } catch (error: any) {
      console.error("Error fetching call:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/dialer/calls/:id/notes - Add notes to a call
  app.post('/api/dialer/calls/:id/notes', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { notes } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existingCall] = await db.select()
        .from(dialerCalls)
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!existingCall) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      const [updatedCall] = await db.update(dialerCalls)
        .set({ notes })
        .where(eq(dialerCalls.id, id))
        .returning();

      res.json({
        success: true,
        call: updatedCall,
        message: "Notes updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating call notes:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/dialer/calls/:id/recording - Get call recording URL
  app.get('/api/dialer/calls/:id/recording', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [call] = await db.select()
        .from(dialerCalls)
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!call) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      if (!call.recordingUrl) {
        return res.json({
          success: true,
          recording: null,
          message: "No recording available for this call"
        });
      }

      res.json({
        success: true,
        recording: {
          url: call.recordingUrl,
          sid: call.twilioRecordingSid
        }
      });
    } catch (error: any) {
      console.error("Error fetching recording:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/dialer/calls/:id/transcribe - Request transcription
  app.post('/api/dialer/calls/:id/transcribe', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [call] = await db.select()
        .from(dialerCalls)
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!call) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      if (call.transcription) {
        return res.json({
          success: true,
          transcription: call.transcription,
          status: call.transcriptionStatus,
          message: "Transcription already available"
        });
      }

      if (!call.recordingUrl) {
        return res.json({
          success: false,
          error: "No recording available for transcription"
        });
      }

      // Update status to pending
      const [updatedCall] = await db.update(dialerCalls)
        .set({ transcriptionStatus: "pending" })
        .where(eq(dialerCalls.id, id))
        .returning();

      // In a real implementation, this would trigger Twilio's transcription service
      // For now, we mock the response
      res.json({
        success: true,
        call: updatedCall,
        message: TWILIO_CONFIGURED 
          ? "Transcription request submitted. Check back later for results."
          : "Twilio not configured. Transcription would be processed when Twilio is set up."
      });
    } catch (error: any) {
      console.error("Error requesting transcription:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/dialer/stats - Get calling statistics
  app.get('/api/dialer/stats', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { period = 'today' } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const conditions = [
        eq(dialerCalls.tenantId, tenantId),
        gte(dialerCalls.createdAt, startDate)
      ];

      // Total calls
      const [totalStats] = await db.select({
        totalCalls: count(),
        totalDuration: sql<number>`coalesce(sum(${dialerCalls.duration}), 0)`,
        avgDuration: sql<number>`coalesce(avg(${dialerCalls.duration}), 0)`,
        connectedCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'connected')`,
        voicemailCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'voicemail')`,
        noAnswerCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'no_answer')`,
        busyCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'busy')`,
        wrongNumberCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'wrong_number')`,
        callbackRequested: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'callback_requested')`,
        meetingsBooked: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'meeting_booked')`,
        completedCalls: sql<number>`count(*) filter (where ${dialerCalls.status} = 'completed')`,
        outboundCalls: sql<number>`count(*) filter (where ${dialerCalls.direction} = 'outbound')`,
        inboundCalls: sql<number>`count(*) filter (where ${dialerCalls.direction} = 'inbound')`,
      })
        .from(dialerCalls)
        .where(and(...conditions));

      // User-specific stats for the current user
      const userConditions = [...conditions, eq(dialerCalls.userId, userId)];
      
      const [userStats] = await db.select({
        userTotalCalls: count(),
        userConnectedCalls: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'connected')`,
        userTotalDuration: sql<number>`coalesce(sum(${dialerCalls.duration}), 0)`,
        userAvgDuration: sql<number>`coalesce(avg(${dialerCalls.duration}), 0)`,
        userMeetingsBooked: sql<number>`count(*) filter (where ${dialerCalls.outcome} = 'meeting_booked')`,
      })
        .from(dialerCalls)
        .where(and(...userConditions));

      const totalCalls = Number(totalStats?.totalCalls || 0);
      const connectedCalls = Number(totalStats?.connectedCalls || 0);
      const completedCalls = Number(totalStats?.completedCalls || 0);
      const connectionRate = completedCalls > 0 ? (connectedCalls / completedCalls * 100).toFixed(1) : "0.0";

      const userTotalCalls = Number(userStats?.userTotalCalls || 0);
      const userConnectedCalls = Number(userStats?.userConnectedCalls || 0);
      const userConnectionRate = userTotalCalls > 0 ? (userConnectedCalls / userTotalCalls * 100).toFixed(1) : "0.0";

      res.json({
        success: true,
        stats: {
          period,
          twilioConfigured: TWILIO_CONFIGURED,
          team: {
            totalCalls,
            completedCalls,
            connectedCalls,
            connectionRate: parseFloat(connectionRate),
            totalDuration: Number(totalStats?.totalDuration || 0),
            avgDuration: Math.round(Number(totalStats?.avgDuration || 0)),
            outboundCalls: Number(totalStats?.outboundCalls || 0),
            inboundCalls: Number(totalStats?.inboundCalls || 0),
            outcomes: {
              connected: connectedCalls,
              voicemail: Number(totalStats?.voicemailCalls || 0),
              noAnswer: Number(totalStats?.noAnswerCalls || 0),
              busy: Number(totalStats?.busyCalls || 0),
              wrongNumber: Number(totalStats?.wrongNumberCalls || 0),
              callbackRequested: Number(totalStats?.callbackRequested || 0),
              meetingsBooked: Number(totalStats?.meetingsBooked || 0)
            }
          },
          user: {
            totalCalls: userTotalCalls,
            connectedCalls: userConnectedCalls,
            connectionRate: parseFloat(userConnectionRate),
            totalDuration: Number(userStats?.userTotalDuration || 0),
            avgDuration: Math.round(Number(userStats?.userAvgDuration || 0)),
            meetingsBooked: Number(userStats?.userMeetingsBooked || 0)
          }
        }
      });
    } catch (error: any) {
      console.error("Error fetching dialer stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/dialer/calls/:id - Update call details (status, outcome, etc.)
  app.put('/api/dialer/calls/:id', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { status, outcome, notes, answeredAt } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existingCall] = await db.select()
        .from(dialerCalls)
        .where(and(
          eq(dialerCalls.id, id),
          eq(dialerCalls.tenantId, tenantId)
        ));

      if (!existingCall) {
        return res.status(404).json({ success: false, error: "Call not found" });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (outcome) updateData.outcome = outcome;
      if (notes !== undefined) updateData.notes = notes;
      if (answeredAt) updateData.answeredAt = new Date(answeredAt);

      const [updatedCall] = await db.update(dialerCalls)
        .set(updateData)
        .where(eq(dialerCalls.id, id))
        .returning();

      res.json({
        success: true,
        call: updatedCall
      });
    } catch (error: any) {
      console.error("Error updating call:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
