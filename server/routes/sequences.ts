import type { Express } from "express";
import { db } from "../db.js";
import { 
  sequenceTemplates, 
  sequenceSteps, 
  sequenceEnrollments, 
  sequenceEvents,
  contacts,
  insertSequenceTemplateSchema,
  insertSequenceStepSchema,
  insertSequenceEnrollmentSchema,
  insertSequenceEventSchema
} from "../../shared/schema.js";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";

export function registerSequenceRoutes(app: Express) {
  
  // POST /api/sequences - Create new sequence template
  app.post('/api/sequences', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const validatedData = insertSequenceTemplateSchema.parse({
        ...req.body,
        tenantId,
        createdBy: userId,
      });

      const [newSequence] = await db.insert(sequenceTemplates)
        .values(validatedData)
        .returning();

      res.json({
        success: true,
        sequence: newSequence,
        message: "Sequence created successfully"
      });
    } catch (error: any) {
      console.error("Error creating sequence:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/sequences - List all sequences for tenant
  app.get('/api/sequences', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const sequences = await db.select()
        .from(sequenceTemplates)
        .where(eq(sequenceTemplates.tenantId, tenantId))
        .orderBy(desc(sequenceTemplates.createdAt));

      // Get enrollment counts for each sequence
      const sequencesWithStats = await Promise.all(
        sequences.map(async (seq) => {
          const [enrollmentStats] = await db.select({
            total: count(),
            active: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'active')`,
            completed: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'completed')`,
            paused: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'paused')`,
          })
          .from(sequenceEnrollments)
          .where(eq(sequenceEnrollments.sequenceId, seq.id));

          const [stepCount] = await db.select({ count: count() })
            .from(sequenceSteps)
            .where(eq(sequenceSteps.sequenceId, seq.id));

          return {
            ...seq,
            enrollmentStats: {
              total: Number(enrollmentStats?.total || 0),
              active: Number(enrollmentStats?.active || 0),
              completed: Number(enrollmentStats?.completed || 0),
              paused: Number(enrollmentStats?.paused || 0),
            },
            stepCount: Number(stepCount?.count || 0),
          };
        })
      );

      res.json({
        success: true,
        sequences: sequencesWithStats,
        total: sequencesWithStats.length
      });
    } catch (error: any) {
      console.error("Error fetching sequences:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/sequences/:id - Get sequence with steps
  app.get('/api/sequences/:id', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      const steps = await db.select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id))
        .orderBy(asc(sequenceSteps.stepNumber));

      const enrollments = await db.select({
        enrollment: sequenceEnrollments,
        contact: contacts
      })
        .from(sequenceEnrollments)
        .leftJoin(contacts, eq(sequenceEnrollments.contactId, contacts.id))
        .where(eq(sequenceEnrollments.sequenceId, id))
        .orderBy(desc(sequenceEnrollments.enrolledAt))
        .limit(100);

      res.json({
        success: true,
        sequence: {
          ...sequence,
          steps,
          enrollments: enrollments.map(e => ({
            ...e.enrollment,
            contact: e.contact
          }))
        }
      });
    } catch (error: any) {
      console.error("Error fetching sequence:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/sequences/:id - Update sequence
  app.put('/api/sequences/:id', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existing] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      const { name, description, category, isActive, settings } = req.body;

      const [updated] = await db.update(sequenceTemplates)
        .set({
          name: name ?? existing.name,
          description: description ?? existing.description,
          category: category ?? existing.category,
          isActive: isActive ?? existing.isActive,
          settings: settings ?? existing.settings,
          updatedAt: new Date()
        })
        .where(eq(sequenceTemplates.id, id))
        .returning();

      res.json({
        success: true,
        sequence: updated,
        message: "Sequence updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating sequence:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/sequences/:id - Delete sequence
  app.delete('/api/sequences/:id', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [existing] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      // Delete all related records in order
      await db.delete(sequenceEvents)
        .where(sql`${sequenceEvents.enrollmentId} IN (
          SELECT id FROM ${sequenceEnrollments} WHERE ${sequenceEnrollments.sequenceId} = ${id}
        )`);

      await db.delete(sequenceEnrollments)
        .where(eq(sequenceEnrollments.sequenceId, id));

      await db.delete(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id));

      await db.delete(sequenceTemplates)
        .where(eq(sequenceTemplates.id, id));

      res.json({
        success: true,
        message: "Sequence deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting sequence:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sequences/:id/steps - Add step to sequence
  app.post('/api/sequences/:id/steps', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      // Get the next step number
      const [maxStep] = await db.select({ max: sql<number>`COALESCE(MAX(${sequenceSteps.stepNumber}), 0)` })
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id));

      const nextStepNumber = (maxStep?.max || 0) + 1;

      const validatedData = insertSequenceStepSchema.parse({
        ...req.body,
        sequenceId: id,
        stepNumber: req.body.stepNumber || nextStepNumber,
      });

      const [newStep] = await db.insert(sequenceSteps)
        .values(validatedData)
        .returning();

      res.json({
        success: true,
        step: newStep,
        message: "Step added successfully"
      });
    } catch (error: any) {
      console.error("Error adding step:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/sequences/:id/steps/:stepId - Update step
  app.put('/api/sequences/:id/steps/:stepId', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id, stepId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      const [existing] = await db.select()
        .from(sequenceSteps)
        .where(and(
          eq(sequenceSteps.id, stepId),
          eq(sequenceSteps.sequenceId, id)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Step not found" });
      }

      const [updated] = await db.update(sequenceSteps)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(sequenceSteps.id, stepId))
        .returning();

      res.json({
        success: true,
        step: updated,
        message: "Step updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating step:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE /api/sequences/:id/steps/:stepId - Delete step
  app.delete('/api/sequences/:id/steps/:stepId', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id, stepId } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      const [existing] = await db.select()
        .from(sequenceSteps)
        .where(and(
          eq(sequenceSteps.id, stepId),
          eq(sequenceSteps.sequenceId, id)
        ));

      if (!existing) {
        return res.status(404).json({ success: false, error: "Step not found" });
      }

      await db.delete(sequenceSteps)
        .where(eq(sequenceSteps.id, stepId));

      // Reorder remaining steps
      const remainingSteps = await db.select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id))
        .orderBy(asc(sequenceSteps.stepNumber));

      for (let i = 0; i < remainingSteps.length; i++) {
        await db.update(sequenceSteps)
          .set({ stepNumber: i + 1 })
          .where(eq(sequenceSteps.id, remainingSteps[i].id));
      }

      res.json({
        success: true,
        message: "Step deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting step:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sequences/:id/enroll - Enroll contacts in sequence
  app.post('/api/sequences/:id/enroll', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { id } = req.params;
      const { contactIds } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ success: false, error: "Contact IDs required" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      // Get first step
      const [firstStep] = await db.select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id))
        .orderBy(asc(sequenceSteps.stepNumber))
        .limit(1);

      const enrollments = [];
      const skipped = [];

      for (const contactId of contactIds) {
        // Check if already enrolled
        const [existing] = await db.select()
          .from(sequenceEnrollments)
          .where(and(
            eq(sequenceEnrollments.sequenceId, id),
            eq(sequenceEnrollments.contactId, contactId),
            eq(sequenceEnrollments.status, 'active')
          ));

        if (existing) {
          skipped.push(contactId);
          continue;
        }

        // Calculate next action time based on first step delay
        const nextActionAt = new Date();
        if (firstStep) {
          nextActionAt.setDate(nextActionAt.getDate() + (firstStep.delayDays || 0));
          nextActionAt.setHours(nextActionAt.getHours() + (firstStep.delayHours || 0));
        }

        const [enrollment] = await db.insert(sequenceEnrollments)
          .values({
            tenantId,
            sequenceId: id,
            contactId,
            status: 'active',
            currentStepId: firstStep?.id || null,
            currentStepNumber: 1,
            nextActionAt,
            enrolledBy: userId,
            stats: { emailsSent: 0, opens: 0, clicks: 0, replies: 0, bounces: 0 }
          })
          .returning();

        enrollments.push(enrollment);
      }

      // Update sequence stats
      await db.update(sequenceTemplates)
        .set({
          stats: sql`jsonb_set(
            COALESCE(${sequenceTemplates.stats}, '{}'),
            '{totalEnrolled}',
            to_jsonb(COALESCE((${sequenceTemplates.stats}->>'totalEnrolled')::int, 0) + ${enrollments.length})
          )`,
          updatedAt: new Date()
        })
        .where(eq(sequenceTemplates.id, id));

      res.json({
        success: true,
        enrolled: enrollments.length,
        skipped: skipped.length,
        enrollments,
        message: `${enrollments.length} contacts enrolled successfully`
      });
    } catch (error: any) {
      console.error("Error enrolling contacts:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sequences/:id/pause - Pause enrollment
  app.post('/api/sequences/:id/pause', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { enrollmentIds, reason } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      let whereClause = and(
        eq(sequenceEnrollments.sequenceId, id),
        eq(sequenceEnrollments.status, 'active')
      );

      if (enrollmentIds && Array.isArray(enrollmentIds) && enrollmentIds.length > 0) {
        whereClause = and(
          whereClause,
          sql`${sequenceEnrollments.id} IN (${sql.join(enrollmentIds.map(id => sql`${id}`), sql`, `)})`
        );
      }

      const updated = await db.update(sequenceEnrollments)
        .set({
          status: 'paused',
          pausedAt: new Date(),
          pauseReason: reason || 'Manually paused',
          updatedAt: new Date()
        })
        .where(whereClause!)
        .returning();

      res.json({
        success: true,
        paused: updated.length,
        message: `${updated.length} enrollments paused`
      });
    } catch (error: any) {
      console.error("Error pausing enrollments:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sequences/:id/resume - Resume enrollment
  app.post('/api/sequences/:id/resume', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { enrollmentIds } = req.body;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      let whereClause = and(
        eq(sequenceEnrollments.sequenceId, id),
        eq(sequenceEnrollments.status, 'paused')
      );

      if (enrollmentIds && Array.isArray(enrollmentIds) && enrollmentIds.length > 0) {
        whereClause = and(
          whereClause,
          sql`${sequenceEnrollments.id} IN (${sql.join(enrollmentIds.map(id => sql`${id}`), sql`, `)})`
        );
      }

      // Calculate new next action time (resume immediately or with delay)
      const nextActionAt = new Date();
      nextActionAt.setHours(nextActionAt.getHours() + 1); // Resume in 1 hour

      const updated = await db.update(sequenceEnrollments)
        .set({
          status: 'active',
          pausedAt: null,
          pauseReason: null,
          nextActionAt,
          updatedAt: new Date()
        })
        .where(whereClause!)
        .returning();

      res.json({
        success: true,
        resumed: updated.length,
        message: `${updated.length} enrollments resumed`
      });
    } catch (error: any) {
      console.error("Error resuming enrollments:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/sequences/:id/stats - Get sequence statistics
  app.get('/api/sequences/:id/stats', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      // Get enrollment statistics
      const [enrollmentStats] = await db.select({
        total: count(),
        active: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'active')`,
        paused: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'paused')`,
        completed: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'completed')`,
        bounced: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'bounced')`,
        replied: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'replied')`,
        unsubscribed: sql<number>`count(*) filter (where ${sequenceEnrollments.status} = 'unsubscribed')`,
      })
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.sequenceId, id));

      // Get event statistics
      const [eventStats] = await db.select({
        emailsSent: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_sent')`,
        emailsOpened: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_opened')`,
        emailsClicked: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_clicked')`,
        emailsReplied: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_replied')`,
        emailsBounced: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_bounced')`,
      })
      .from(sequenceEvents)
      .where(sql`${sequenceEvents.enrollmentId} IN (
        SELECT id FROM ${sequenceEnrollments} WHERE ${sequenceEnrollments.sequenceId} = ${id}
      )`);

      // Get step performance
      const steps = await db.select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id))
        .orderBy(asc(sequenceSteps.stepNumber));

      const stepPerformance = await Promise.all(
        steps.map(async (step) => {
          const [stats] = await db.select({
            sent: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_sent')`,
            opened: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_opened')`,
            clicked: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_clicked')`,
            replied: sql<number>`count(*) filter (where ${sequenceEvents.eventType} = 'email_replied')`,
          })
          .from(sequenceEvents)
          .where(eq(sequenceEvents.stepId, step.id));

          const sent = Number(stats?.sent || 0);
          const opened = Number(stats?.opened || 0);
          const clicked = Number(stats?.clicked || 0);
          const replied = Number(stats?.replied || 0);

          return {
            stepId: step.id,
            stepNumber: step.stepNumber,
            stepType: step.stepType,
            name: step.name,
            sent,
            opened,
            clicked,
            replied,
            openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
            clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
            replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
          };
        })
      );

      const totalSent = Number(eventStats?.emailsSent || 0);
      const totalOpened = Number(eventStats?.emailsOpened || 0);
      const totalClicked = Number(eventStats?.emailsClicked || 0);
      const totalReplied = Number(eventStats?.emailsReplied || 0);

      res.json({
        success: true,
        stats: {
          enrollments: {
            total: Number(enrollmentStats?.total || 0),
            active: Number(enrollmentStats?.active || 0),
            paused: Number(enrollmentStats?.paused || 0),
            completed: Number(enrollmentStats?.completed || 0),
            bounced: Number(enrollmentStats?.bounced || 0),
            replied: Number(enrollmentStats?.replied || 0),
            unsubscribed: Number(enrollmentStats?.unsubscribed || 0),
          },
          emails: {
            sent: totalSent,
            opened: totalOpened,
            clicked: totalClicked,
            replied: totalReplied,
            bounced: Number(eventStats?.emailsBounced || 0),
            openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
            clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0',
            replyRate: totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0',
          },
          stepPerformance,
        }
      });
    } catch (error: any) {
      console.error("Error fetching sequence stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/sequences/:id/steps/reorder - Reorder steps
  app.put('/api/sequences/:id/steps/reorder', authenticate, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const { stepOrder } = req.body; // Array of step IDs in new order
      
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Verify sequence exists and belongs to tenant
      const [sequence] = await db.select()
        .from(sequenceTemplates)
        .where(and(
          eq(sequenceTemplates.id, id),
          eq(sequenceTemplates.tenantId, tenantId)
        ));

      if (!sequence) {
        return res.status(404).json({ success: false, error: "Sequence not found" });
      }

      // Update step numbers based on new order
      for (let i = 0; i < stepOrder.length; i++) {
        await db.update(sequenceSteps)
          .set({ stepNumber: i + 1, updatedAt: new Date() })
          .where(and(
            eq(sequenceSteps.id, stepOrder[i]),
            eq(sequenceSteps.sequenceId, id)
          ));
      }

      const steps = await db.select()
        .from(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id))
        .orderBy(asc(sequenceSteps.stepNumber));

      res.json({
        success: true,
        steps,
        message: "Steps reordered successfully"
      });
    } catch (error: any) {
      console.error("Error reordering steps:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
