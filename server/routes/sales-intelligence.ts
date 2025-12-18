import { Router, Request, Response, Express } from 'express';
import { db } from '../db.js';
import { 
  websiteVisitors, 
  technographics, 
  orgChartNodes, 
  companyNewsEvents, 
  crmDataQualitySnapshots, 
  accountScores,
  accounts,
  contacts,
  leads,
  deals,
  insertWebsiteVisitorSchema,
  insertTechnographicsSchema,
  insertOrgChartNodeSchema,
  insertCompanyNewsEventSchema,
  insertCrmDataQualitySnapshotSchema,
  insertAccountScoreSchema
} from '../../shared/schema.js';
import { eq, and, or, ilike, desc, asc, gte, lte, sql, count, isNull, isNotNull } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

// ========================================
// WEBSITE VISITORS ROUTES
// ========================================

const websiteVisitorsRouter = Router();

websiteVisitorsRouter.get('/stats', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [totalVisitors] = await db.select({ count: count() })
      .from(websiteVisitors)
      .where(eq(websiteVisitors.tenantId, user.tenantId));

    const [identifiedVisitors] = await db.select({ count: count() })
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.tenantId, user.tenantId),
        eq(websiteVisitors.isIdentified, true)
      ));

    const [linkedAccounts] = await db.select({ count: count() })
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.tenantId, user.tenantId),
        isNotNull(websiteVisitors.linkedAccountId)
      ));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentVisitors] = await db.select({ count: count() })
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.tenantId, user.tenantId),
        gte(websiteVisitors.lastVisitAt, thirtyDaysAgo)
      ));

    const topCompanies = await db.select({
      companyName: websiteVisitors.companyName,
      companyDomain: websiteVisitors.companyDomain,
      visitCount: sql<number>`SUM(${websiteVisitors.visitCount})`.as('visit_count'),
      pageViews: sql<number>`SUM(${websiteVisitors.pageViews})`.as('page_views')
    })
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.tenantId, user.tenantId),
        isNotNull(websiteVisitors.companyName)
      ))
      .groupBy(websiteVisitors.companyName, websiteVisitors.companyDomain)
      .orderBy(desc(sql`SUM(${websiteVisitors.visitCount})`))
      .limit(10);

    res.json({
      totalVisitors: totalVisitors?.count ?? 0,
      identifiedVisitors: identifiedVisitors?.count ?? 0,
      linkedAccounts: linkedAccounts?.count ?? 0,
      recentVisitors: recentVisitors?.count ?? 0,
      identificationRate: totalVisitors?.count ? 
        ((identifiedVisitors?.count ?? 0) / (totalVisitors?.count ?? 1) * 100).toFixed(1) : '0',
      topCompanies
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({ error: 'Failed to fetch visitor statistics' });
  }
});

websiteVisitorsRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'lastVisitAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? asc : desc;
    const company = req.query.company as string;
    const domain = req.query.domain as string;
    const identified = req.query.identified as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const conditions: any[] = [eq(websiteVisitors.tenantId, user.tenantId)];

    if (company) {
      conditions.push(ilike(websiteVisitors.companyName, `%${company}%`));
    }
    if (domain) {
      conditions.push(ilike(websiteVisitors.companyDomain, `%${domain}%`));
    }
    if (identified === 'true') {
      conditions.push(eq(websiteVisitors.isIdentified, true));
    } else if (identified === 'false') {
      conditions.push(eq(websiteVisitors.isIdentified, false));
    }
    if (startDate) {
      conditions.push(gte(websiteVisitors.lastVisitAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(websiteVisitors.lastVisitAt, new Date(endDate)));
    }

    const sortColumn = {
      lastVisitAt: websiteVisitors.lastVisitAt,
      firstVisitAt: websiteVisitors.firstVisitAt,
      visitCount: websiteVisitors.visitCount,
      pageViews: websiteVisitors.pageViews,
      companyName: websiteVisitors.companyName
    }[sortBy] || websiteVisitors.lastVisitAt;

    const visitors = await db.select()
      .from(websiteVisitors)
      .where(and(...conditions))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(websiteVisitors)
      .where(and(...conditions));

    res.json({
      data: visitors,
      pagination: {
        page,
        limit,
        total: total?.count ?? 0,
        totalPages: Math.ceil((total?.count ?? 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

websiteVisitorsRouter.get('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [visitor] = await db.select()
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.id, req.params.id),
        eq(websiteVisitors.tenantId, user.tenantId)
      ));

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(visitor);
  } catch (error) {
    console.error('Error fetching visitor:', error);
    res.status(500).json({ error: 'Failed to fetch visitor' });
  }
});

websiteVisitorsRouter.post('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertWebsiteVisitorSchema.parse({
      ...req.body,
      tenantId: user.tenantId
    });

    const [visitor] = await db.insert(websiteVisitors)
      .values(validatedData)
      .returning();

    res.status(201).json(visitor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating visitor:', error);
    res.status(500).json({ error: 'Failed to create visitor' });
  }
});

websiteVisitorsRouter.put('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [existing] = await db.select()
      .from(websiteVisitors)
      .where(and(
        eq(websiteVisitors.id, req.params.id),
        eq(websiteVisitors.tenantId, user.tenantId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    const updateData: any = { ...req.body };
    delete updateData.id;
    delete updateData.tenantId;

    const [updated] = await db.update(websiteVisitors)
      .set(updateData)
      .where(and(
        eq(websiteVisitors.id, req.params.id),
        eq(websiteVisitors.tenantId, user.tenantId)
      ))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ error: 'Failed to update visitor' });
  }
});

websiteVisitorsRouter.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [deleted] = await db.delete(websiteVisitors)
      .where(and(
        eq(websiteVisitors.id, req.params.id),
        eq(websiteVisitors.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ error: 'Failed to delete visitor' });
  }
});

// ========================================
// TECHNOGRAPHICS ROUTES
// ========================================

const technographicsRouter = Router();

technographicsRouter.get('/categories', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const records = await db.select({ categories: technographics.categories })
      .from(technographics)
      .where(eq(technographics.tenantId, user.tenantId));

    const categoryMap: Record<string, Set<string>> = {};
    
    for (const record of records) {
      if (record.categories && typeof record.categories === 'object') {
        for (const [category, techs] of Object.entries(record.categories as Record<string, string[]>)) {
          if (!categoryMap[category]) {
            categoryMap[category] = new Set();
          }
          techs.forEach(tech => categoryMap[category].add(tech));
        }
      }
    }

    const categorySummary = Object.entries(categoryMap).map(([category, techs]) => ({
      category,
      technologies: Array.from(techs),
      count: techs.size
    })).sort((a, b) => b.count - a.count);

    res.json(categorySummary);
  } catch (error) {
    console.error('Error fetching technology categories:', error);
    res.status(500).json({ error: 'Failed to fetch technology categories' });
  }
});

technographicsRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'lastUpdated';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? asc : desc;
    const domain = req.query.domain as string;
    const accountId = req.query.accountId as string;
    const category = req.query.category as string;

    const conditions: any[] = [eq(technographics.tenantId, user.tenantId)];

    if (domain) {
      conditions.push(ilike(technographics.companyDomain, `%${domain}%`));
    }
    if (accountId) {
      conditions.push(eq(technographics.accountId, accountId));
    }

    const sortColumn = {
      lastUpdated: technographics.lastUpdated,
      createdAt: technographics.createdAt,
      totalTechnologies: technographics.totalTechnologies,
      companyDomain: technographics.companyDomain
    }[sortBy] || technographics.lastUpdated;

    let records = await db.select()
      .from(technographics)
      .where(and(...conditions))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    if (category) {
      records = records.filter(r => {
        const cats = r.categories as Record<string, string[]> | null;
        return cats && category in cats;
      });
    }

    const [total] = await db.select({ count: count() })
      .from(technographics)
      .where(and(...conditions));

    res.json({
      data: records,
      pagination: {
        page,
        limit,
        total: total?.count ?? 0,
        totalPages: Math.ceil((total?.count ?? 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching technographics:', error);
    res.status(500).json({ error: 'Failed to fetch technographics' });
  }
});

technographicsRouter.get('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [record] = await db.select()
      .from(technographics)
      .where(and(
        eq(technographics.id, req.params.id),
        eq(technographics.tenantId, user.tenantId)
      ));

    if (!record) {
      return res.status(404).json({ error: 'Technographics record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching technographics:', error);
    res.status(500).json({ error: 'Failed to fetch technographics record' });
  }
});

technographicsRouter.post('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertTechnographicsSchema.parse({
      ...req.body,
      tenantId: user.tenantId
    });

    const [record] = await db.insert(technographics)
      .values(validatedData)
      .returning();

    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating technographics:', error);
    res.status(500).json({ error: 'Failed to create technographics record' });
  }
});

technographicsRouter.put('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [existing] = await db.select()
      .from(technographics)
      .where(and(
        eq(technographics.id, req.params.id),
        eq(technographics.tenantId, user.tenantId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Technographics record not found' });
    }

    const updateData: any = { ...req.body, lastUpdated: new Date() };
    delete updateData.id;
    delete updateData.tenantId;

    const [updated] = await db.update(technographics)
      .set(updateData)
      .where(and(
        eq(technographics.id, req.params.id),
        eq(technographics.tenantId, user.tenantId)
      ))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating technographics:', error);
    res.status(500).json({ error: 'Failed to update technographics record' });
  }
});

technographicsRouter.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [deleted] = await db.delete(technographics)
      .where(and(
        eq(technographics.id, req.params.id),
        eq(technographics.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Technographics record not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting technographics:', error);
    res.status(500).json({ error: 'Failed to delete technographics record' });
  }
});

// ========================================
// ORG CHARTS ROUTES
// ========================================

const orgChartsRouter = Router();

orgChartsRouter.get('/hierarchy/:accountId', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const nodes = await db.select()
      .from(orgChartNodes)
      .where(and(
        eq(orgChartNodes.tenantId, user.tenantId),
        eq(orgChartNodes.accountId, req.params.accountId)
      ))
      .orderBy(orgChartNodes.level, orgChartNodes.name);

    const buildTree = (parentId: string | null): any[] => {
      return nodes
        .filter(node => node.reportingTo === parentId)
        .map(node => ({
          ...node,
          children: buildTree(node.id)
        }));
    };

    const rootNodes = buildTree(null);

    res.json({
      accountId: req.params.accountId,
      totalNodes: nodes.length,
      hierarchy: rootNodes
    });
  } catch (error) {
    console.error('Error fetching org hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch org hierarchy' });
  }
});

orgChartsRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? desc : asc;
    const accountId = req.query.accountId as string;
    const department = req.query.department as string;
    const level = req.query.level as string;
    const decisionMaker = req.query.decisionMaker as string;

    const conditions: any[] = [eq(orgChartNodes.tenantId, user.tenantId)];

    if (accountId) {
      conditions.push(eq(orgChartNodes.accountId, accountId));
    }
    if (department) {
      conditions.push(ilike(orgChartNodes.department, `%${department}%`));
    }
    if (level) {
      conditions.push(eq(orgChartNodes.level, level));
    }
    if (decisionMaker === 'true') {
      conditions.push(eq(orgChartNodes.isDecisionMaker, true));
    }

    const sortColumn = {
      name: orgChartNodes.name,
      title: orgChartNodes.title,
      department: orgChartNodes.department,
      level: orgChartNodes.level,
      influenceScore: orgChartNodes.influenceScore,
      createdAt: orgChartNodes.createdAt
    }[sortBy] || orgChartNodes.name;

    const nodes = await db.select()
      .from(orgChartNodes)
      .where(and(...conditions))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(orgChartNodes)
      .where(and(...conditions));

    res.json({
      data: nodes,
      pagination: {
        page,
        limit,
        total: total?.count ?? 0,
        totalPages: Math.ceil((total?.count ?? 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching org chart nodes:', error);
    res.status(500).json({ error: 'Failed to fetch org chart nodes' });
  }
});

orgChartsRouter.get('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [node] = await db.select()
      .from(orgChartNodes)
      .where(and(
        eq(orgChartNodes.id, req.params.id),
        eq(orgChartNodes.tenantId, user.tenantId)
      ));

    if (!node) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    res.json(node);
  } catch (error) {
    console.error('Error fetching org chart node:', error);
    res.status(500).json({ error: 'Failed to fetch org chart node' });
  }
});

orgChartsRouter.post('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertOrgChartNodeSchema.parse({
      ...req.body,
      tenantId: user.tenantId
    });

    const [node] = await db.insert(orgChartNodes)
      .values(validatedData)
      .returning();

    res.status(201).json(node);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating org chart node:', error);
    res.status(500).json({ error: 'Failed to create org chart node' });
  }
});

orgChartsRouter.put('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [existing] = await db.select()
      .from(orgChartNodes)
      .where(and(
        eq(orgChartNodes.id, req.params.id),
        eq(orgChartNodes.tenantId, user.tenantId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    const updateData: any = { ...req.body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData.tenantId;

    const [updated] = await db.update(orgChartNodes)
      .set(updateData)
      .where(and(
        eq(orgChartNodes.id, req.params.id),
        eq(orgChartNodes.tenantId, user.tenantId)
      ))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating org chart node:', error);
    res.status(500).json({ error: 'Failed to update org chart node' });
  }
});

orgChartsRouter.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [deleted] = await db.delete(orgChartNodes)
      .where(and(
        eq(orgChartNodes.id, req.params.id),
        eq(orgChartNodes.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting org chart node:', error);
    res.status(500).json({ error: 'Failed to delete org chart node' });
  }
});

// ========================================
// COMPANY NEWS ROUTES
// ========================================

const companyNewsRouter = Router();

companyNewsRouter.get('/types', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const eventTypes = await db.select({
      eventType: companyNewsEvents.eventType,
      count: count()
    })
      .from(companyNewsEvents)
      .where(eq(companyNewsEvents.tenantId, user.tenantId))
      .groupBy(companyNewsEvents.eventType)
      .orderBy(desc(count()));

    const unreadCount = await db.select({ count: count() })
      .from(companyNewsEvents)
      .where(and(
        eq(companyNewsEvents.tenantId, user.tenantId),
        eq(companyNewsEvents.isRead, false)
      ));

    const followedCount = await db.select({ count: count() })
      .from(companyNewsEvents)
      .where(and(
        eq(companyNewsEvents.tenantId, user.tenantId),
        eq(companyNewsEvents.isFollowed, true)
      ));

    res.json({
      eventTypes,
      unreadCount: unreadCount[0]?.count ?? 0,
      followedCount: followedCount[0]?.count ?? 0
    });
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

companyNewsRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'publishedAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? asc : desc;
    const eventType = req.query.eventType as string;
    const accountId = req.query.accountId as string;
    const domain = req.query.domain as string;
    const sentiment = req.query.sentiment as string;
    const significance = req.query.significance as string;
    const isRead = req.query.isRead as string;
    const isFollowed = req.query.isFollowed as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const conditions: any[] = [eq(companyNewsEvents.tenantId, user.tenantId)];

    if (eventType) {
      conditions.push(eq(companyNewsEvents.eventType, eventType));
    }
    if (accountId) {
      conditions.push(eq(companyNewsEvents.accountId, accountId));
    }
    if (domain) {
      conditions.push(ilike(companyNewsEvents.companyDomain, `%${domain}%`));
    }
    if (sentiment) {
      conditions.push(eq(companyNewsEvents.sentiment, sentiment));
    }
    if (significance) {
      conditions.push(eq(companyNewsEvents.significance, significance));
    }
    if (isRead === 'true') {
      conditions.push(eq(companyNewsEvents.isRead, true));
    } else if (isRead === 'false') {
      conditions.push(eq(companyNewsEvents.isRead, false));
    }
    if (isFollowed === 'true') {
      conditions.push(eq(companyNewsEvents.isFollowed, true));
    }
    if (startDate) {
      conditions.push(gte(companyNewsEvents.publishedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(companyNewsEvents.publishedAt, new Date(endDate)));
    }

    const sortColumn = {
      publishedAt: companyNewsEvents.publishedAt,
      createdAt: companyNewsEvents.createdAt,
      title: companyNewsEvents.title,
      eventType: companyNewsEvents.eventType,
      sentimentScore: companyNewsEvents.sentimentScore
    }[sortBy] || companyNewsEvents.publishedAt;

    const events = await db.select()
      .from(companyNewsEvents)
      .where(and(...conditions))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(companyNewsEvents)
      .where(and(...conditions));

    res.json({
      data: events,
      pagination: {
        page,
        limit,
        total: total?.count ?? 0,
        totalPages: Math.ceil((total?.count ?? 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching company news:', error);
    res.status(500).json({ error: 'Failed to fetch company news' });
  }
});

companyNewsRouter.get('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [event] = await db.select()
      .from(companyNewsEvents)
      .where(and(
        eq(companyNewsEvents.id, req.params.id),
        eq(companyNewsEvents.tenantId, user.tenantId)
      ));

    if (!event) {
      return res.status(404).json({ error: 'News event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching news event:', error);
    res.status(500).json({ error: 'Failed to fetch news event' });
  }
});

companyNewsRouter.post('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertCompanyNewsEventSchema.parse({
      ...req.body,
      tenantId: user.tenantId
    });

    const [event] = await db.insert(companyNewsEvents)
      .values(validatedData)
      .returning();

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating news event:', error);
    res.status(500).json({ error: 'Failed to create news event' });
  }
});

companyNewsRouter.put('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [existing] = await db.select()
      .from(companyNewsEvents)
      .where(and(
        eq(companyNewsEvents.id, req.params.id),
        eq(companyNewsEvents.tenantId, user.tenantId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'News event not found' });
    }

    const updateData: any = { ...req.body };
    delete updateData.id;
    delete updateData.tenantId;

    const [updated] = await db.update(companyNewsEvents)
      .set(updateData)
      .where(and(
        eq(companyNewsEvents.id, req.params.id),
        eq(companyNewsEvents.tenantId, user.tenantId)
      ))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating news event:', error);
    res.status(500).json({ error: 'Failed to update news event' });
  }
});

companyNewsRouter.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [deleted] = await db.delete(companyNewsEvents)
      .where(and(
        eq(companyNewsEvents.id, req.params.id),
        eq(companyNewsEvents.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'News event not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting news event:', error);
    res.status(500).json({ error: 'Failed to delete news event' });
  }
});

// ========================================
// DATA HEALTH ROUTES
// ========================================

const dataHealthRouter = Router();

dataHealthRouter.get('/suggestions', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [latestSnapshot] = await db.select()
      .from(crmDataQualitySnapshots)
      .where(eq(crmDataQualitySnapshots.tenantId, user.tenantId))
      .orderBy(desc(crmDataQualitySnapshots.snapshotDate))
      .limit(1);

    if (!latestSnapshot) {
      return res.json({ suggestions: [], message: 'No data quality snapshot available. Please refresh.' });
    }

    res.json({
      suggestions: latestSnapshot.suggestions || [],
      missingFields: latestSnapshot.missingFields || {},
      enrichmentOpportunities: latestSnapshot.enrichmentOpportunities || 0,
      duplicateRecords: latestSnapshot.duplicateRecords || 0,
      staleRecords: latestSnapshot.staleRecords || 0
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

dataHealthRouter.get('/history', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));

    const snapshots = await db.select()
      .from(crmDataQualitySnapshots)
      .where(eq(crmDataQualitySnapshots.tenantId, user.tenantId))
      .orderBy(desc(crmDataQualitySnapshots.snapshotDate))
      .limit(limit);

    res.json(snapshots);
  } catch (error) {
    console.error('Error fetching data health history:', error);
    res.status(500).json({ error: 'Failed to fetch data health history' });
  }
});

dataHealthRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [latestSnapshot] = await db.select()
      .from(crmDataQualitySnapshots)
      .where(eq(crmDataQualitySnapshots.tenantId, user.tenantId))
      .orderBy(desc(crmDataQualitySnapshots.snapshotDate))
      .limit(1);

    if (!latestSnapshot) {
      return res.json({ 
        message: 'No data quality snapshot available',
        overallScore: 0,
        contactsScore: 0,
        accountsScore: 0,
        leadsScore: 0,
        dealsScore: 0
      });
    }

    res.json(latestSnapshot);
  } catch (error) {
    console.error('Error fetching data health:', error);
    res.status(500).json({ error: 'Failed to fetch data health' });
  }
});

dataHealthRouter.post('/refresh', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [totalContacts] = await db.select({ count: count() })
      .from(contacts)
      .where(eq(contacts.tenantId, user.tenantId));

    const [contactsWithEmail] = await db.select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.tenantId, user.tenantId), isNotNull(contacts.email)));

    const [contactsWithPhone] = await db.select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.tenantId, user.tenantId), isNotNull(contacts.phone)));

    const [contactsWithCompany] = await db.select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.tenantId, user.tenantId), isNotNull(contacts.company)));

    const [totalAccounts] = await db.select({ count: count() })
      .from(accounts)
      .where(eq(accounts.tenantId, user.tenantId));

    const [accountsWithIndustry] = await db.select({ count: count() })
      .from(accounts)
      .where(and(eq(accounts.tenantId, user.tenantId), isNotNull(accounts.industry)));

    const [accountsWithWebsite] = await db.select({ count: count() })
      .from(accounts)
      .where(and(eq(accounts.tenantId, user.tenantId), isNotNull(accounts.website)));

    const [totalLeads] = await db.select({ count: count() })
      .from(leads)
      .where(eq(leads.tenantId, user.tenantId));

    const [leadsWithSource] = await db.select({ count: count() })
      .from(leads)
      .where(and(eq(leads.tenantId, user.tenantId), isNotNull(leads.source)));

    const [totalDeals] = await db.select({ count: count() })
      .from(deals)
      .where(eq(deals.tenantId, user.tenantId));

    const [dealsWithValue] = await db.select({ count: count() })
      .from(deals)
      .where(and(eq(deals.tenantId, user.tenantId), isNotNull(deals.value)));

    const [dealsWithCloseDate] = await db.select({ count: count() })
      .from(deals)
      .where(and(eq(deals.tenantId, user.tenantId), isNotNull(deals.expectedCloseDate)));

    const metrics = {
      totalContacts: totalContacts?.count ?? 0,
      contactsWithEmail: contactsWithEmail?.count ?? 0,
      contactsWithPhone: contactsWithPhone?.count ?? 0,
      contactsWithCompany: contactsWithCompany?.count ?? 0,
      duplicateContacts: 0,
      staleContacts: 0,
      totalAccounts: totalAccounts?.count ?? 0,
      accountsWithIndustry: accountsWithIndustry?.count ?? 0,
      accountsWithWebsite: accountsWithWebsite?.count ?? 0,
      accountsWithRevenue: 0,
      duplicateAccounts: 0,
      totalLeads: totalLeads?.count ?? 0,
      leadsWithSource: leadsWithSource?.count ?? 0,
      staleLeads: 0,
      totalDeals: totalDeals?.count ?? 0,
      dealsWithValue: dealsWithValue?.count ?? 0,
      dealsWithCloseDate: dealsWithCloseDate?.count ?? 0
    };

    const calculateScore = (filled: number, total: number) => 
      total > 0 ? (filled / total) * 100 : 100;

    const contactsScore = (metrics.totalContacts > 0) 
      ? (calculateScore(metrics.contactsWithEmail, metrics.totalContacts) * 0.4 +
         calculateScore(metrics.contactsWithPhone, metrics.totalContacts) * 0.3 +
         calculateScore(metrics.contactsWithCompany, metrics.totalContacts) * 0.3)
      : 100;

    const accountsScore = (metrics.totalAccounts > 0)
      ? (calculateScore(metrics.accountsWithIndustry, metrics.totalAccounts) * 0.5 +
         calculateScore(metrics.accountsWithWebsite, metrics.totalAccounts) * 0.5)
      : 100;

    const leadsScore = (metrics.totalLeads > 0)
      ? calculateScore(metrics.leadsWithSource, metrics.totalLeads)
      : 100;

    const dealsScore = (metrics.totalDeals > 0)
      ? (calculateScore(metrics.dealsWithValue, metrics.totalDeals) * 0.5 +
         calculateScore(metrics.dealsWithCloseDate, metrics.totalDeals) * 0.5)
      : 100;

    const overallScore = (contactsScore * 0.3 + accountsScore * 0.3 + leadsScore * 0.2 + dealsScore * 0.2);

    const suggestions: Array<{ type: string; priority: string; message: string; count: number; action: string }> = [];

    if (metrics.totalContacts > 0 && metrics.contactsWithEmail < metrics.totalContacts) {
      const missing = metrics.totalContacts - metrics.contactsWithEmail;
      suggestions.push({
        type: 'missing_email',
        priority: missing > 50 ? 'high' : 'medium',
        message: `${missing} contacts are missing email addresses`,
        count: missing,
        action: 'Enrich contacts with email lookup'
      });
    }

    if (metrics.totalAccounts > 0 && metrics.accountsWithIndustry < metrics.totalAccounts) {
      const missing = metrics.totalAccounts - metrics.accountsWithIndustry;
      suggestions.push({
        type: 'missing_industry',
        priority: missing > 20 ? 'high' : 'medium',
        message: `${missing} accounts are missing industry information`,
        count: missing,
        action: 'Update account industry classifications'
      });
    }

    const missingFields: Record<string, number> = {
      'contact_email': metrics.totalContacts - metrics.contactsWithEmail,
      'contact_phone': metrics.totalContacts - metrics.contactsWithPhone,
      'contact_company': metrics.totalContacts - metrics.contactsWithCompany,
      'account_industry': metrics.totalAccounts - metrics.accountsWithIndustry,
      'account_website': metrics.totalAccounts - metrics.accountsWithWebsite,
      'lead_source': metrics.totalLeads - metrics.leadsWithSource,
      'deal_value': metrics.totalDeals - metrics.dealsWithValue,
      'deal_close_date': metrics.totalDeals - metrics.dealsWithCloseDate
    };

    const enrichmentOpportunities = Object.values(missingFields).reduce((a, b) => a + b, 0);

    const [snapshot] = await db.insert(crmDataQualitySnapshots)
      .values({
        tenantId: user.tenantId,
        overallScore,
        contactsScore,
        accountsScore,
        leadsScore,
        dealsScore,
        metrics,
        suggestions,
        enrichmentOpportunities,
        duplicateRecords: 0,
        staleRecords: 0,
        missingFields
      })
      .returning();

    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Error refreshing data health:', error);
    res.status(500).json({ error: 'Failed to refresh data health' });
  }
});

// ========================================
// ACCOUNT SCORES ROUTES
// ========================================

const accountScoresRouter = Router();

accountScoresRouter.get('/tiers', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tierCounts = await db.select({
      tier: accountScores.tier,
      count: count(),
      avgScore: sql<number>`AVG(${accountScores.overallScore})`.as('avg_score')
    })
      .from(accountScores)
      .where(eq(accountScores.tenantId, user.tenantId))
      .groupBy(accountScores.tier)
      .orderBy(accountScores.tier);

    const [totalScored] = await db.select({ count: count() })
      .from(accountScores)
      .where(eq(accountScores.tenantId, user.tenantId));

    const tiers = ['A', 'B', 'C', 'D'];
    const tierSummary = tiers.map(tier => {
      const found = tierCounts.find(t => t.tier === tier);
      return {
        tier,
        count: found?.count ?? 0,
        avgScore: found?.avgScore ? parseFloat(found.avgScore.toFixed(1)) : 0
      };
    });

    res.json({
      totalScoredAccounts: totalScored?.count ?? 0,
      tiers: tierSummary
    });
  } catch (error) {
    console.error('Error fetching tier breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch tier breakdown' });
  }
});

accountScoresRouter.post('/calculate/:accountId', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accountId } = req.params;

    const [account] = await db.select()
      .from(accounts)
      .where(and(
        eq(accounts.id, accountId),
        eq(accounts.tenantId, user.tenantId)
      ));

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const weights = {
      intent: 0.2,
      engagement: 0.15,
      fit: 0.2,
      techStack: 0.1,
      revenue: 0.15,
      growth: 0.1,
      websiteActivity: 0.1
    };

    const signals = {
      intentScore: Math.random() * 100,
      engagementScore: Math.random() * 100,
      fitScore: Math.random() * 100,
      techStackFit: Math.random() * 100,
      revenueScore: Math.random() * 100,
      growthSignals: Math.random() * 100,
      websiteActivityScore: Math.random() * 100
    };

    const overallScore = 
      signals.intentScore * weights.intent +
      signals.engagementScore * weights.engagement +
      signals.fitScore * weights.fit +
      signals.techStackFit * weights.techStack +
      signals.revenueScore * weights.revenue +
      signals.growthSignals * weights.growth +
      signals.websiteActivityScore * weights.websiteActivity;

    const tier = overallScore >= 75 ? 'A' : overallScore >= 50 ? 'B' : overallScore >= 25 ? 'C' : 'D';

    const factors = [
      { name: 'Intent signals', value: signals.intentScore, impact: signals.intentScore > 50 ? 'positive' : 'neutral', description: 'Buying intent indicators' },
      { name: 'Engagement level', value: signals.engagementScore, impact: signals.engagementScore > 50 ? 'positive' : 'neutral', description: 'Interaction with your content' },
      { name: 'Ideal customer fit', value: signals.fitScore, impact: signals.fitScore > 50 ? 'positive' : 'negative', description: 'Match with ICP criteria' }
    ];

    const recommendedActions = [];
    if (tier === 'A') {
      recommendedActions.push('Schedule executive meeting', 'Send personalized proposal');
    } else if (tier === 'B') {
      recommendedActions.push('Increase engagement touchpoints', 'Share relevant case studies');
    } else {
      recommendedActions.push('Add to nurture campaign', 'Monitor for buying signals');
    }

    const [existingScore] = await db.select()
      .from(accountScores)
      .where(and(
        eq(accountScores.accountId, accountId),
        eq(accountScores.tenantId, user.tenantId)
      ));

    let score;
    if (existingScore) {
      [score] = await db.update(accountScores)
        .set({
          overallScore,
          tier,
          signals,
          weights,
          factors,
          recommendedActions,
          lastCalculated: new Date(),
          updatedAt: new Date()
        })
        .where(eq(accountScores.id, existingScore.id))
        .returning();
    } else {
      [score] = await db.insert(accountScores)
        .values({
          tenantId: user.tenantId,
          accountId,
          overallScore,
          tier,
          signals,
          weights,
          factors,
          recommendedActions,
          lastCalculated: new Date()
        })
        .returning();
    }

    res.status(201).json(score);
  } catch (error) {
    console.error('Error calculating account score:', error);
    res.status(500).json({ error: 'Failed to calculate account score' });
  }
});

accountScoresRouter.get('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'overallScore';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? asc : desc;
    const tier = req.query.tier as string;
    const minScore = req.query.minScore as string;
    const maxScore = req.query.maxScore as string;

    const conditions: any[] = [eq(accountScores.tenantId, user.tenantId)];

    if (tier) {
      conditions.push(eq(accountScores.tier, tier));
    }
    if (minScore) {
      conditions.push(gte(accountScores.overallScore, parseFloat(minScore)));
    }
    if (maxScore) {
      conditions.push(lte(accountScores.overallScore, parseFloat(maxScore)));
    }

    const sortColumn = {
      overallScore: accountScores.overallScore,
      tier: accountScores.tier,
      lastCalculated: accountScores.lastCalculated,
      createdAt: accountScores.createdAt
    }[sortBy] || accountScores.overallScore;

    const scores = await db.select()
      .from(accountScores)
      .where(and(...conditions))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(accountScores)
      .where(and(...conditions));

    res.json({
      data: scores,
      pagination: {
        page,
        limit,
        total: total?.count ?? 0,
        totalPages: Math.ceil((total?.count ?? 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching account scores:', error);
    res.status(500).json({ error: 'Failed to fetch account scores' });
  }
});

accountScoresRouter.get('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [score] = await db.select()
      .from(accountScores)
      .where(and(
        eq(accountScores.id, req.params.id),
        eq(accountScores.tenantId, user.tenantId)
      ));

    if (!score) {
      return res.status(404).json({ error: 'Account score not found' });
    }

    res.json(score);
  } catch (error) {
    console.error('Error fetching account score:', error);
    res.status(500).json({ error: 'Failed to fetch account score' });
  }
});

accountScoresRouter.post('/', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = insertAccountScoreSchema.parse({
      ...req.body,
      tenantId: user.tenantId
    });

    const [score] = await db.insert(accountScores)
      .values(validatedData)
      .returning();

    res.status(201).json(score);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating account score:', error);
    res.status(500).json({ error: 'Failed to create account score' });
  }
});

accountScoresRouter.put('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [existing] = await db.select()
      .from(accountScores)
      .where(and(
        eq(accountScores.id, req.params.id),
        eq(accountScores.tenantId, user.tenantId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Account score not found' });
    }

    const updateData: any = { ...req.body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData.tenantId;

    const [updated] = await db.update(accountScores)
      .set(updateData)
      .where(and(
        eq(accountScores.id, req.params.id),
        eq(accountScores.tenantId, user.tenantId)
      ))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating account score:', error);
    res.status(500).json({ error: 'Failed to update account score' });
  }
});

accountScoresRouter.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [deleted] = await db.delete(accountScores)
      .where(and(
        eq(accountScores.id, req.params.id),
        eq(accountScores.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Account score not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting account score:', error);
    res.status(500).json({ error: 'Failed to delete account score' });
  }
});

// ========================================
// REGISTER ALL ROUTES
// ========================================

export function registerSalesIntelligenceRoutes(app: Express): void {
  app.use('/api/website-visitors', websiteVisitorsRouter);
  app.use('/api/technographics', technographicsRouter);
  app.use('/api/org-charts', orgChartsRouter);
  app.use('/api/company-news', companyNewsRouter);
  app.use('/api/data-health', dataHealthRouter);
  app.use('/api/account-scores', accountScoresRouter);
  
  console.log('✅ Sales Intelligence routes registered');
}
