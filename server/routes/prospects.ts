import express, { Request, Response } from 'express';
import { db } from '../db.js';
import { prospectDatabase, savedFilters, contacts, insertProspectSchema, insertSavedFilterSchema } from '../../shared/schema.js';
import { eq, and, or, ilike, sql, desc, asc, inArray, gte, lte, isNotNull, isNull } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Filter schema for validation
const prospectFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  emailVerified: z.boolean().optional(),
  title: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  department: z.array(z.string()).optional(),
  companyName: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  subIndustry: z.array(z.string()).optional(),
  employeeRange: z.array(z.string()).optional(),
  revenueRange: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  city: z.array(z.string()).optional(),
  state: z.array(z.string()).optional(),
  country: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasLinkedin: z.boolean().optional(),
  leadScoreMin: z.number().optional(),
  leadScoreMax: z.number().optional(),
  intentScoreMin: z.number().optional(),
  intentScoreMax: z.number().optional(),
  importedToCrm: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(25),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/prospects - Search prospects with filters
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const queryParams = {
      name: req.query.name as string | undefined,
      email: req.query.email as string | undefined,
      emailVerified: req.query.emailVerified === 'true' ? true : req.query.emailVerified === 'false' ? false : undefined,
      title: req.query.title ? (Array.isArray(req.query.title) ? req.query.title as string[] : [req.query.title as string]) : undefined,
      seniority: req.query.seniority ? (Array.isArray(req.query.seniority) ? req.query.seniority as string[] : [req.query.seniority as string]) : undefined,
      department: req.query.department ? (Array.isArray(req.query.department) ? req.query.department as string[] : [req.query.department as string]) : undefined,
      companyName: req.query.companyName ? (Array.isArray(req.query.companyName) ? req.query.companyName as string[] : [req.query.companyName as string]) : undefined,
      industry: req.query.industry ? (Array.isArray(req.query.industry) ? req.query.industry as string[] : [req.query.industry as string]) : undefined,
      employeeRange: req.query.employeeRange ? (Array.isArray(req.query.employeeRange) ? req.query.employeeRange as string[] : [req.query.employeeRange as string]) : undefined,
      revenueRange: req.query.revenueRange ? (Array.isArray(req.query.revenueRange) ? req.query.revenueRange as string[] : [req.query.revenueRange as string]) : undefined,
      technologies: req.query.technologies ? (Array.isArray(req.query.technologies) ? req.query.technologies as string[] : [req.query.technologies as string]) : undefined,
      city: req.query.city ? (Array.isArray(req.query.city) ? req.query.city as string[] : [req.query.city as string]) : undefined,
      state: req.query.state ? (Array.isArray(req.query.state) ? req.query.state as string[] : [req.query.state as string]) : undefined,
      country: req.query.country ? (Array.isArray(req.query.country) ? req.query.country as string[] : [req.query.country as string]) : undefined,
      region: req.query.region ? (Array.isArray(req.query.region) ? req.query.region as string[] : [req.query.region as string]) : undefined,
      hasEmail: req.query.hasEmail === 'true' ? true : req.query.hasEmail === 'false' ? false : undefined,
      hasPhone: req.query.hasPhone === 'true' ? true : req.query.hasPhone === 'false' ? false : undefined,
      hasLinkedin: req.query.hasLinkedin === 'true' ? true : req.query.hasLinkedin === 'false' ? false : undefined,
      importedToCrm: req.query.importedToCrm === 'true' ? true : req.query.importedToCrm === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 25, 100),
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: ((req.query.sortOrder as string) || 'desc') as 'asc' | 'desc',
    };

    const filters = prospectFilterSchema.parse(queryParams);
    const conditions: any[] = [eq(prospectDatabase.tenantId, user.tenantId)];

    if (filters.name) {
      conditions.push(
        or(
          ilike(prospectDatabase.firstName, `%${filters.name}%`),
          ilike(prospectDatabase.lastName, `%${filters.name}%`),
          ilike(prospectDatabase.fullName, `%${filters.name}%`)
        )
      );
    }

    if (filters.email) {
      conditions.push(ilike(prospectDatabase.email, `%${filters.email}%`));
    }

    if (filters.emailVerified !== undefined) {
      conditions.push(eq(prospectDatabase.emailVerified, filters.emailVerified));
    }

    if (filters.seniority?.length) {
      conditions.push(inArray(prospectDatabase.seniority, filters.seniority));
    }

    if (filters.department?.length) {
      conditions.push(inArray(prospectDatabase.department, filters.department));
    }

    if (filters.industry?.length) {
      conditions.push(inArray(prospectDatabase.industry, filters.industry));
    }

    if (filters.employeeRange?.length) {
      conditions.push(inArray(prospectDatabase.employeeRange, filters.employeeRange));
    }

    if (filters.revenueRange?.length) {
      conditions.push(inArray(prospectDatabase.revenueRange, filters.revenueRange));
    }

    if (filters.city?.length) {
      conditions.push(inArray(prospectDatabase.city, filters.city));
    }

    if (filters.state?.length) {
      conditions.push(inArray(prospectDatabase.state, filters.state));
    }

    if (filters.country?.length) {
      conditions.push(inArray(prospectDatabase.country, filters.country));
    }

    if (filters.hasEmail === true) {
      conditions.push(isNotNull(prospectDatabase.email));
    } else if (filters.hasEmail === false) {
      conditions.push(isNull(prospectDatabase.email));
    }

    if (filters.hasPhone === true) {
      conditions.push(or(isNotNull(prospectDatabase.phone), isNotNull(prospectDatabase.directDial)));
    }

    if (filters.hasLinkedin === true) {
      conditions.push(isNotNull(prospectDatabase.linkedinUrl));
    }

    if (filters.importedToCrm !== undefined) {
      conditions.push(eq(prospectDatabase.importedToCrm, filters.importedToCrm));
    }

    const offset = (filters.page - 1) * filters.limit;

    const sortColumn = prospectDatabase[filters.sortBy as keyof typeof prospectDatabase] || prospectDatabase.createdAt;
    const orderFn = filters.sortOrder === 'asc' ? asc : desc;

    const [prospects, countResult] = await Promise.all([
      db.select()
        .from(prospectDatabase)
        .where(and(...conditions))
        .orderBy(orderFn(sortColumn as any))
        .limit(filters.limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(prospectDatabase)
        .where(and(...conditions))
    ]);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / filters.limit);

    res.json({
      prospects,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// GET /api/prospects/:id - Get prospect details
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const [prospect] = await db.select()
      .from(prospectDatabase)
      .where(and(
        eq(prospectDatabase.id, id),
        eq(prospectDatabase.tenantId, user.tenantId)
      ));

    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json(prospect);
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

// POST /api/prospects/import - Import prospects to CRM as contacts
router.post('/import', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prospectIds } = req.body;

    if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
      return res.status(400).json({ error: 'Prospect IDs are required' });
    }

    const prospects = await db.select()
      .from(prospectDatabase)
      .where(and(
        inArray(prospectDatabase.id, prospectIds),
        eq(prospectDatabase.tenantId, user.tenantId),
        eq(prospectDatabase.importedToCrm, false)
      ));

    if (prospects.length === 0) {
      return res.status(400).json({ error: 'No valid prospects to import' });
    }

    const importedContacts = [];
    const errors = [];

    for (const prospect of prospects) {
      try {
        const contactData = {
          tenantId: user.tenantId,
          firstName: prospect.firstName || '',
          lastName: prospect.lastName || '',
          email: prospect.email || '',
          phone: prospect.phone || prospect.directDial || '',
          company: prospect.companyName || '',
          title: prospect.title || '',
          source: 'prospect_database',
          status: 'active',
          linkedinUrl: prospect.linkedinUrl || '',
          industry: prospect.industry || '',
          tags: ['imported_prospect'],
          createdBy: user.id,
        };

        const [newContact] = await db.insert(contacts).values(contactData).returning();

        await db.update(prospectDatabase)
          .set({ 
            importedToCrm: true, 
            crmContactId: newContact.id,
            updatedAt: new Date()
          })
          .where(eq(prospectDatabase.id, prospect.id));

        importedContacts.push(newContact);
      } catch (err) {
        errors.push({ prospectId: prospect.id, error: (err as Error).message });
      }
    }

    res.json({
      success: true,
      imported: importedContacts.length,
      errors: errors.length,
      contacts: importedContacts,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Error importing prospects:', error);
    res.status(500).json({ error: 'Failed to import prospects' });
  }
});

// GET /api/prospects/filters/saved - Get saved filters
router.get('/filters/saved', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = await db.select()
      .from(savedFilters)
      .where(and(
        eq(savedFilters.tenantId, user.tenantId),
        eq(savedFilters.filterType, 'prospect')
      ))
      .orderBy(desc(savedFilters.createdAt));

    res.json(filters);
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    res.status(500).json({ error: 'Failed to fetch saved filters' });
  }
});

// POST /api/prospects/filters/saved - Save a filter
router.post('/filters/saved', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, filters: filterData, isDefault } = req.body;

    if (!name || !filterData) {
      return res.status(400).json({ error: 'Name and filters are required' });
    }

    if (isDefault) {
      await db.update(savedFilters)
        .set({ isDefault: false })
        .where(and(
          eq(savedFilters.tenantId, user.tenantId),
          eq(savedFilters.filterType, 'prospect')
        ));
    }

    const [savedFilter] = await db.insert(savedFilters)
      .values({
        tenantId: user.tenantId,
        name,
        filterType: 'prospect',
        filters: filterData,
        isDefault: isDefault || false,
        createdBy: user.id,
      })
      .returning();

    res.status(201).json(savedFilter);
  } catch (error) {
    console.error('Error saving filter:', error);
    res.status(500).json({ error: 'Failed to save filter' });
  }
});

// DELETE /api/prospects/filters/saved/:id - Delete saved filter
router.delete('/filters/saved/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const [deleted] = await db.delete(savedFilters)
      .where(and(
        eq(savedFilters.id, id),
        eq(savedFilters.tenantId, user.tenantId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Filter not found' });
    }

    res.json({ success: true, message: 'Filter deleted successfully' });
  } catch (error) {
    console.error('Error deleting filter:', error);
    res.status(500).json({ error: 'Failed to delete filter' });
  }
});

// POST /api/prospects/search - Advanced search with DataForSEO integration
router.post('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query, filters: searchFilters } = req.body;

    const conditions: any[] = [eq(prospectDatabase.tenantId, user.tenantId)];

    if (query) {
      conditions.push(
        or(
          ilike(prospectDatabase.fullName, `%${query}%`),
          ilike(prospectDatabase.email, `%${query}%`),
          ilike(prospectDatabase.companyName, `%${query}%`),
          ilike(prospectDatabase.title, `%${query}%`)
        )
      );
    }

    if (searchFilters) {
      if (searchFilters.seniority?.length) {
        conditions.push(inArray(prospectDatabase.seniority, searchFilters.seniority));
      }
      if (searchFilters.department?.length) {
        conditions.push(inArray(prospectDatabase.department, searchFilters.department));
      }
      if (searchFilters.industry?.length) {
        conditions.push(inArray(prospectDatabase.industry, searchFilters.industry));
      }
      if (searchFilters.employeeRange?.length) {
        conditions.push(inArray(prospectDatabase.employeeRange, searchFilters.employeeRange));
      }
      if (searchFilters.country?.length) {
        conditions.push(inArray(prospectDatabase.country, searchFilters.country));
      }
    }

    const prospects = await db.select()
      .from(prospectDatabase)
      .where(and(...conditions))
      .orderBy(desc(prospectDatabase.createdAt))
      .limit(100);

    res.json({
      results: prospects,
      totalCount: prospects.length,
      source: 'database',
    });
  } catch (error) {
    console.error('Error searching prospects:', error);
    res.status(500).json({ error: 'Failed to search prospects' });
  }
});

// Get filter options (unique values for dropdowns)
router.get('/filters/options', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [industries, countries, cities] = await Promise.all([
      db.selectDistinct({ value: prospectDatabase.industry })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          isNotNull(prospectDatabase.industry)
        )),
      db.selectDistinct({ value: prospectDatabase.country })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          isNotNull(prospectDatabase.country)
        )),
      db.selectDistinct({ value: prospectDatabase.city })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          isNotNull(prospectDatabase.city)
        )),
    ]);

    res.json({
      industries: industries.map(i => i.value).filter(Boolean),
      countries: countries.map(c => c.value).filter(Boolean),
      cities: cities.map(c => c.value).filter(Boolean),
      seniorityLevels: ['c_level', 'vp', 'director', 'manager', 'senior', 'entry'],
      departments: ['sales', 'marketing', 'engineering', 'hr', 'finance', 'operations', 'product', 'design', 'legal', 'executive'],
      employeeRanges: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
      revenueRanges: ['0-1M', '1M-10M', '10M-50M', '50M-100M', '100M-500M', '500M-1B', '1B+'],
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Get prospect statistics
router.get('/stats/overview', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [total, withEmail, withPhone, imported] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(prospectDatabase)
        .where(eq(prospectDatabase.tenantId, user.tenantId)),
      db.select({ count: sql<number>`count(*)` })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          isNotNull(prospectDatabase.email)
        )),
      db.select({ count: sql<number>`count(*)` })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          or(isNotNull(prospectDatabase.phone), isNotNull(prospectDatabase.directDial))
        )),
      db.select({ count: sql<number>`count(*)` })
        .from(prospectDatabase)
        .where(and(
          eq(prospectDatabase.tenantId, user.tenantId),
          eq(prospectDatabase.importedToCrm, true)
        )),
    ]);

    res.json({
      total: Number(total[0]?.count || 0),
      withEmail: Number(withEmail[0]?.count || 0),
      withPhone: Number(withPhone[0]?.count || 0),
      imported: Number(imported[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching prospect stats:', error);
    res.status(500).json({ error: 'Failed to fetch prospect statistics' });
  }
});

export default router;
