import { db } from "./db";
import { 
  customerJourneyStages, 
  customerJourneyEvents, 
  customerJourneyMilestones,
  customerJourneyProgress,
  journeyAnalytics,
  contacts,
  type CustomerJourneyStage,
  type CustomerJourneyEvent,
  type CustomerJourneyProgress as JourneyProgress,
  type InsertCustomerJourneyStage,
  type InsertCustomerJourneyEvent,
  type InsertCustomerJourneyProgress
} from "@shared/schema";
import { eq, desc, and, gte, lte, count, avg, sql } from "drizzle-orm";

export class CustomerJourneyService {
  private static instance: CustomerJourneyService;

  static getInstance(): CustomerJourneyService {
    if (!CustomerJourneyService.instance) {
      CustomerJourneyService.instance = new CustomerJourneyService();
    }
    return CustomerJourneyService.instance;
  }

  // Default journey stages for initialization
  private defaultStages: InsertCustomerJourneyStage[] = [
    {
      id: 'lead',
      name: 'lead',
      displayName: 'Lead',
      description: 'Initial contact or interest shown',
      stageType: 'lead',
      sortOrder: 1,
      color: '#EF4444',
      icon: 'user-plus',
      isActive: true
    },
    {
      id: 'qualified_lead',
      name: 'qualified_lead',
      displayName: 'Qualified Lead',
      description: 'Lead has been qualified and shows genuine interest',
      stageType: 'prospect',
      sortOrder: 2,
      color: '#F97316',
      icon: 'user-check',
      isActive: true
    },
    {
      id: 'opportunity',
      name: 'opportunity',
      displayName: 'Opportunity',
      description: 'Active sales opportunity in pipeline',
      stageType: 'prospect',
      sortOrder: 3,
      color: '#EAB308',
      icon: 'target',
      isActive: true
    },
    {
      id: 'proposal',
      name: 'proposal',
      displayName: 'Proposal',
      description: 'Proposal or quote has been sent',
      stageType: 'prospect',
      sortOrder: 4,
      color: '#3B82F6',
      icon: 'file-text',
      isActive: true
    },
    {
      id: 'negotiation',
      name: 'negotiation',
      displayName: 'Negotiation',
      description: 'In active negotiation phase',
      stageType: 'prospect',
      sortOrder: 5,
      color: '#8B5CF6',
      icon: 'handshake',
      isActive: true
    },
    {
      id: 'customer',
      name: 'customer',
      displayName: 'Customer',
      description: 'Successfully converted to paying customer',
      stageType: 'customer',
      sortOrder: 6,
      color: '#10B981',
      icon: 'check-circle',
      isActive: true
    },
    {
      id: 'advocate',
      name: 'advocate',
      displayName: 'Advocate',
      description: 'Happy customer who actively promotes our brand',
      stageType: 'advocate',
      sortOrder: 7,
      color: '#059669',
      icon: 'heart',
      isActive: true
    },
    {
      id: 'churned',
      name: 'churned',
      displayName: 'Churned',
      description: 'Lost customer or inactive',
      stageType: 'churned',
      sortOrder: 8,
      color: '#6B7280',
      icon: 'x-circle',
      isActive: true
    }
  ];

  async initializeDefaultStages(): Promise<void> {
    try {
      const existingStages = await db.select().from(customerJourneyStages);
      
      if (existingStages.length === 0) {
        await db.insert(customerJourneyStages).values(this.defaultStages);
      } else {
      }
    } catch (error) {
      console.error("❌ Error initializing journey stages:", error);
    }
  }

  // Get all active journey stages
  async getJourneyStages(): Promise<CustomerJourneyStage[]> {
    try {
      return await db
        .select()
        .from(customerJourneyStages)
        .where(eq(customerJourneyStages.isActive, true))
        .orderBy(customerJourneyStages.sortOrder);
    } catch (error) {
      console.error("Error fetching journey stages:", error);
      return [];
    }
  }

  // Track a new journey event for a contact
  async trackJourneyEvent(event: InsertCustomerJourneyEvent): Promise<CustomerJourneyEvent | null> {
    try {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const [newEvent] = await db
        .insert(customerJourneyEvents)
        .values({
          ...event,
          id: eventId,
          eventDate: event.eventDate || new Date()
        })
        .returning();

      // Update journey progress if this is a stage change event
      if (event.eventType === 'stage_change' && event.toStage) {
        await this.updateJourneyProgress(event.contactId, event.toStage, event.triggeredBy);
      }

      return newEvent;
    } catch (error) {
      console.error("Error tracking journey event:", error);
      return null;
    }
  }

  // Update customer journey progress
  async updateJourneyProgress(
    contactId: number, 
    newStage: string, 
    triggeredBy?: string
  ): Promise<JourneyProgress | null> {
    try {
      const progressId = `progress_${contactId}`;
      
      // Check if progress record exists
      const [existingProgress] = await db
        .select()
        .from(customerJourneyProgress)
        .where(eq(customerJourneyProgress.contactId, contactId));

      const now = new Date();
      
      if (existingProgress) {
        // Update existing progress
        const [updatedProgress] = await db
          .update(customerJourneyProgress)
          .set({
            currentStage: newStage,
            stageEntryDate: now,
            lastInteractionDate: now,
            interactionCount: existingProgress.interactionCount + 1,
            updatedAt: now
          })
          .where(eq(customerJourneyProgress.contactId, contactId))
          .returning();

        return updatedProgress;
      } else {
        // Create new progress record
        const [newProgress] = await db
          .insert(customerJourneyProgress)
          .values({
            id: progressId,
            contactId: contactId,
            currentStage: newStage,
            stageEntryDate: now,
            totalDurationInStage: 0,
            interactionCount: 1,
            lastInteractionDate: now,
            journeyScore: 10, // Starting score
            completedMilestones: [],
            updatedAt: now
          })
          .returning();

        return newProgress;
      }
    } catch (error) {
      console.error("Error updating journey progress:", error);
      return null;
    }
  }

  // Get journey visualization data for a contact
  async getContactJourneyVisualization(contactId: string): Promise<{
    contact: any;
    currentProgress: JourneyProgress | null;
    events: CustomerJourneyEvent[];
    stages: CustomerJourneyStage[];
    metrics: {
      totalEvents: number;
      stageChanges: number;
      timeInCurrentStage: number;
      journeyStartDate: Date | null;
      journeyDuration: number;
    };
  }> {
    try {
      // Get contact details
      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId));

      // Get current progress
      const [currentProgress] = await db
        .select()
        .from(customerJourneyProgress)
        .where(eq(customerJourneyProgress.contactId, contactId));

      // Get all events for this contact
      const events = await db
        .select()
        .from(customerJourneyEvents)
        .where(eq(customerJourneyEvents.contactId, contactId))
        .orderBy(desc(customerJourneyEvents.eventDate));

      // Get all stages
      const stages = await this.getJourneyStages();

      // Calculate metrics
      const totalEvents = events.length;
      const stageChanges = events.filter(e => e.eventType === 'stage_change').length;
      const journeyStartDate = events.length > 0 ? events[events.length - 1].eventDate : null;
      const now = new Date();
      const journeyDuration = journeyStartDate 
        ? Math.floor((now.getTime() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const timeInCurrentStage = currentProgress && currentProgress.stageEntryDate
        ? Math.floor((now.getTime() - currentProgress.stageEntryDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        contact,
        currentProgress,
        events,
        stages,
        metrics: {
          totalEvents,
          stageChanges,
          timeInCurrentStage,
          journeyStartDate,
          journeyDuration
        }
      };
    } catch (error) {
      console.error("Error getting contact journey visualization:", error);
      return {
        contact: null,
        currentProgress: null,
        events: [],
        stages: [],
        metrics: {
          totalEvents: 0,
          stageChanges: 0,
          timeInCurrentStage: 0,
          journeyStartDate: null,
          journeyDuration: 0
        }
      };
    }
  }

  // Get journey analytics dashboard data
  async getJourneyAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    stageDistribution: Record<string, number>;
    conversionRates: Record<string, number>;
    averageStageTime: Record<string, number>;
    topEvents: Array<{ event: string; count: number }>;
    journeyVelocity: number;
    totalContacts: number;
  }> {
    try {
      // Return all zero values for analytics data reset
      return {
        stageDistribution: {},
        conversionRates: {},
        averageStageTime: {},
        topEvents: [],
        journeyVelocity: 0,
        totalContacts: 0
      };
    } catch (error) {
      console.error("Error getting journey analytics:", error);
      return {
        stageDistribution: {},
        conversionRates: {},
        averageStageTime: {},
        topEvents: [],
        journeyVelocity: 0,
        totalContacts: 0
      };
    }
  }

  // Initialize a customer journey when a new contact is created
  async initializeCustomerJourney(contactId: string, triggeredBy?: string): Promise<void> {
    try {
      // Track initial journey event
      await this.trackJourneyEvent({
        id: '', // Will be generated
        contactId: contactId,
        eventType: 'stage_change',
        eventName: 'Journey Started',
        description: 'Customer journey initiated',
        fromStage: null,
        toStage: 'lead',
        metadata: {
          channel: 'crm',
          source: 'manual',
          outcome: 'success'
        },
        triggeredBy: triggeredBy || 'system',
        eventDate: new Date()
      });
    } catch (error) {
      console.error("Error initializing customer journey:", error);
    }
  }
}

export const customerJourneyService = CustomerJourneyService.getInstance();