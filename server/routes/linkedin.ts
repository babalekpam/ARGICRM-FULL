import type { Express } from "express";
import { db } from "../db.js";
import { 
  linkedinActions, 
  contacts,
  insertLinkedinActionSchema
} from "../../shared/schema.js";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";

export function registerLinkedinRoutes(app: Express) {
  
  // GET /api/linkedin/actions - Get all LinkedIn actions for tenant
  app.get('/api/linkedin/actions', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { status, actionType, limit = 50, offset = 0 } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      let query = db.select({
        action: linkedinActions,
        contact: contacts
      })
        .from(linkedinActions)
        .leftJoin(contacts, eq(linkedinActions.contactId, contacts.id))
        .where(eq(linkedinActions.tenantId, tenantId))
        .orderBy(desc(linkedinActions.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const actions = await query;

      const formattedActions = actions.map(a => ({
        ...a.action,
        contact: a.contact
      }));

      res.json({
        success: true,
        actions: formattedActions,
        total: formattedActions.length
      });
    } catch (error: any) {
      console.error("Error fetching LinkedIn actions:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/linkedin/actions - Create new LinkedIn action
  app.post('/api/linkedin/actions', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const validatedData = insertLinkedinActionSchema.parse({
        ...req.body,
        tenantId,
        userId,
      });

      const [newAction] = await db.insert(linkedinActions)
        .values(validatedData)
        .returning();

      res.json({
        success: true,
        action: newAction,
        message: "LinkedIn action created successfully"
      });
    } catch (error: any) {
      console.error("Error creating LinkedIn action:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/linkedin/actions/:id - Get action details
  app.get('/api/linkedin/actions/:id', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [result] = await db.select({
        action: linkedinActions,
        contact: contacts
      })
        .from(linkedinActions)
        .leftJoin(contacts, eq(linkedinActions.contactId, contacts.id))
        .where(and(
          eq(linkedinActions.id, id),
          eq(linkedinActions.tenantId, tenantId)
        ));

      if (!result) {
        return res.status(404).json({ success: false, error: "Action not found" });
      }

      res.json({
        success: true,
        action: {
          ...result.action,
          contact: result.contact
        }
      });
    } catch (error: any) {
      console.error("Error fetching LinkedIn action:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/linkedin/actions/:id - Update action status
  app.put('/api/linkedin/actions/:id', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existing] = await db.select()
        .from(linkedinActions)
        .where(and(
          eq(linkedinActions.id, id),
          eq(linkedinActions.tenantId, tenantId)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Action not found" });
      }

      const { status, response, errorMessage, messageContent, connectionNote } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (response) updateData.response = response;
      if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
      if (messageContent !== undefined) updateData.messageContent = messageContent;
      if (connectionNote !== undefined) updateData.connectionNote = connectionNote;

      const [updated] = await db.update(linkedinActions)
        .set(updateData)
        .where(eq(linkedinActions.id, id))
        .returning();

      res.json({
        success: true,
        action: updated,
        message: "Action updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating LinkedIn action:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/linkedin/actions/:id/complete - Mark action as completed
  app.post('/api/linkedin/actions/:id/complete', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { response } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existing] = await db.select()
        .from(linkedinActions)
        .where(and(
          eq(linkedinActions.id, id),
          eq(linkedinActions.tenantId, tenantId)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Action not found" });
      }

      const [updated] = await db.update(linkedinActions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          response: response || null
        })
        .where(eq(linkedinActions.id, id))
        .returning();

      res.json({
        success: true,
        action: updated,
        message: "Action marked as completed"
      });
    } catch (error: any) {
      console.error("Error completing LinkedIn action:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/linkedin/tasks - Get pending LinkedIn tasks for user
  app.get('/api/linkedin/tasks', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { actionType, limit = 50 } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      let conditions = [
        eq(linkedinActions.tenantId, tenantId),
        eq(linkedinActions.status, 'pending')
      ];

      if (userId) {
        conditions.push(eq(linkedinActions.userId, userId));
      }

      const tasks = await db.select({
        action: linkedinActions,
        contact: contacts
      })
        .from(linkedinActions)
        .leftJoin(contacts, eq(linkedinActions.contactId, contacts.id))
        .where(and(...conditions))
        .orderBy(linkedinActions.scheduledFor, desc(linkedinActions.createdAt))
        .limit(Number(limit));

      const formattedTasks = tasks.map(t => ({
        ...t.action,
        contact: t.contact
      }));

      res.json({
        success: true,
        tasks: formattedTasks,
        total: formattedTasks.length
      });
    } catch (error: any) {
      console.error("Error fetching LinkedIn tasks:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/linkedin/stats - Get LinkedIn activity stats
  app.get('/api/linkedin/stats', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Get overall stats
      const [overallStats] = await db.select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${linkedinActions.status} = 'pending')`,
        completed: sql<number>`count(*) filter (where ${linkedinActions.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${linkedinActions.status} = 'failed')`,
        rateLimited: sql<number>`count(*) filter (where ${linkedinActions.status} = 'rate_limited')`,
      })
      .from(linkedinActions)
      .where(eq(linkedinActions.tenantId, tenantId));

      // Get stats by action type
      const [actionTypeStats] = await db.select({
        profileViews: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'profile_view')`,
        profileViewsCompleted: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'profile_view' and ${linkedinActions.status} = 'completed')`,
        connectRequests: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'connect_request')`,
        connectRequestsCompleted: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'connect_request' and ${linkedinActions.status} = 'completed')`,
        connectRequestsAccepted: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'connect_request' and ${linkedinActions.response} = 'accepted')`,
        messages: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'message')`,
        messagesCompleted: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'message' and ${linkedinActions.status} = 'completed')`,
        messagesReplied: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'message' and ${linkedinActions.response} = 'replied')`,
        postLikes: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'post_like')`,
        postComments: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'post_comment')`,
        inmails: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'inmail')`,
        inmailsReplied: sql<number>`count(*) filter (where ${linkedinActions.actionType} = 'inmail' and ${linkedinActions.response} = 'replied')`,
      })
      .from(linkedinActions)
      .where(eq(linkedinActions.tenantId, tenantId));

      // Calculate rates
      const connectionAcceptRate = Number(actionTypeStats?.connectRequestsCompleted) > 0 
        ? ((Number(actionTypeStats?.connectRequestsAccepted) / Number(actionTypeStats?.connectRequestsCompleted)) * 100).toFixed(1)
        : '0.0';
      
      const messageReplyRate = Number(actionTypeStats?.messagesCompleted) > 0
        ? ((Number(actionTypeStats?.messagesReplied) / Number(actionTypeStats?.messagesCompleted)) * 100).toFixed(1)
        : '0.0';

      const inmailReplyRate = Number(actionTypeStats?.inmails) > 0
        ? ((Number(actionTypeStats?.inmailsReplied) / Number(actionTypeStats?.inmails)) * 100).toFixed(1)
        : '0.0';

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [weeklyStats] = await db.select({
        completedThisWeek: sql<number>`count(*) filter (where ${linkedinActions.completedAt} >= ${sevenDaysAgo})`,
      })
      .from(linkedinActions)
      .where(eq(linkedinActions.tenantId, tenantId));

      res.json({
        success: true,
        stats: {
          overall: {
            total: Number(overallStats?.total || 0),
            pending: Number(overallStats?.pending || 0),
            completed: Number(overallStats?.completed || 0),
            failed: Number(overallStats?.failed || 0),
            rateLimited: Number(overallStats?.rateLimited || 0),
          },
          byType: {
            profileViews: {
              total: Number(actionTypeStats?.profileViews || 0),
              completed: Number(actionTypeStats?.profileViewsCompleted || 0),
            },
            connectRequests: {
              total: Number(actionTypeStats?.connectRequests || 0),
              completed: Number(actionTypeStats?.connectRequestsCompleted || 0),
              accepted: Number(actionTypeStats?.connectRequestsAccepted || 0),
              acceptRate: connectionAcceptRate,
            },
            messages: {
              total: Number(actionTypeStats?.messages || 0),
              completed: Number(actionTypeStats?.messagesCompleted || 0),
              replied: Number(actionTypeStats?.messagesReplied || 0),
              replyRate: messageReplyRate,
            },
            postLikes: {
              total: Number(actionTypeStats?.postLikes || 0),
            },
            postComments: {
              total: Number(actionTypeStats?.postComments || 0),
            },
            inmails: {
              total: Number(actionTypeStats?.inmails || 0),
              replied: Number(actionTypeStats?.inmailsReplied || 0),
              replyRate: inmailReplyRate,
            },
          },
          weekly: {
            completedThisWeek: Number(weeklyStats?.completedThisWeek || 0),
          }
        }
      });
    } catch (error: any) {
      console.error("Error fetching LinkedIn stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/linkedin/history - Get completed LinkedIn actions history
  app.get('/api/linkedin/history', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { limit = 50, offset = 0 } = req.query;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const history = await db.select({
        action: linkedinActions,
        contact: contacts
      })
        .from(linkedinActions)
        .leftJoin(contacts, eq(linkedinActions.contactId, contacts.id))
        .where(and(
          eq(linkedinActions.tenantId, tenantId),
          eq(linkedinActions.status, 'completed')
        ))
        .orderBy(desc(linkedinActions.completedAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const formattedHistory = history.map(h => ({
        ...h.action,
        contact: h.contact
      }));

      res.json({
        success: true,
        history: formattedHistory,
        total: formattedHistory.length
      });
    } catch (error: any) {
      console.error("Error fetching LinkedIn history:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
