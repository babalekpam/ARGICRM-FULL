import { db } from "../db";
import { contacts, deals, ecommerceOrders, ecommerceProducts, orderItems, stores } from "@shared/schema";
import { keywords, keywordRankHistory, trafficData } from "../argilette/seo-schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface CRMMetrics {
  totalContacts: number;
  totalDeals: number;
  totalDealValue: number;
  conversionRate: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

export interface EcommerceMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; totalSold: number; revenue: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

export interface SEOMetrics {
  totalKeywords: number;
  averageRanking: number;
  topKeywords: Array<{ keyword: string; position: number; searchVolume: number }>;
  estimatedTraffic: number;
  rankingTrend: Array<{ date: string; avgPosition: number }>;
}

export interface UnifiedAnalyticsData {
  crm: CRMMetrics;
  ecommerce: EcommerceMetrics;
  seo: SEOMetrics;
}

export class AnalyticsService {
  async getCRMMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<CRMMetrics> {
    try {
      // Total contacts count
      const contactsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(
          and(
            eq(contacts.tenantId, tenantId),
            gte(contacts.createdAt, startDate),
            lte(contacts.createdAt, endDate)
          )
        );

      // Total deals and value
      const dealsResult = await db
        .select({
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
          wonDeals: sql<number>`count(*) FILTER (WHERE stage = 'closed-won')::int`
        })
        .from(deals)
        .where(
          and(
            eq(deals.tenantId, tenantId),
            gte(deals.createdAt, startDate),
            lte(deals.createdAt, endDate)
          )
        );

      const totalContacts = contactsResult[0]?.count || 0;
      const totalDeals = dealsResult[0]?.count || 0;
      const totalDealValue = Number(dealsResult[0]?.totalValue || 0);
      const wonDeals = dealsResult[0]?.wonDeals || 0;
      const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

      // Revenue trend - group by date for won deals
      const revenueTrendResult = await db
        .select({
          date: sql<string>`DATE(${deals.createdAt})`,
          revenue: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`
        })
        .from(deals)
        .where(
          and(
            eq(deals.tenantId, tenantId),
            eq(deals.stage, 'closed-won'),
            gte(deals.createdAt, startDate),
            lte(deals.createdAt, endDate)
          )
        )
        .groupBy(sql`DATE(${deals.createdAt})`)
        .orderBy(sql`DATE(${deals.createdAt})`);

      const revenueTrend = revenueTrendResult.map(row => ({
        date: row.date,
        revenue: Number(row.revenue)
      }));

      return {
        totalContacts,
        totalDeals,
        totalDealValue,
        conversionRate,
        revenueTrend
      };
    } catch (error) {
      console.error('Error fetching CRM metrics:', error);
      return {
        totalContacts: 0,
        totalDeals: 0,
        totalDealValue: 0,
        conversionRate: 0,
        revenueTrend: []
      };
    }
  }

  async getEcommerceMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<EcommerceMetrics> {
    try {
      // Total orders and revenue
      const ordersResult = await db
        .select({
          count: sql<number>`count(*)::int`,
          totalRevenue: sql<number>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.tenantId, tenantId),
            gte(ecommerceOrders.orderDate, startDate),
            lte(ecommerceOrders.orderDate, endDate)
          )
        );

      const totalOrders = ordersResult[0]?.count || 0;
      const totalRevenue = Number(ordersResult[0]?.totalRevenue || 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top 5 selling products
      const topProductsResult = await db
        .select({
          productName: orderItems.productName,
          totalSold: sql<number>`SUM(${orderItems.quantity})::int`,
          revenue: sql<number>`SUM(CAST(${orderItems.totalPrice} AS DECIMAL))`
        })
        .from(orderItems)
        .innerJoin(ecommerceOrders, eq(orderItems.orderId, ecommerceOrders.id))
        .where(
          and(
            eq(orderItems.tenantId, tenantId),
            gte(ecommerceOrders.orderDate, startDate),
            lte(ecommerceOrders.orderDate, endDate)
          )
        )
        .groupBy(orderItems.productName)
        .orderBy(desc(sql`SUM(${orderItems.quantity})`))
        .limit(5);

      const topProducts = topProductsResult.map(row => ({
        name: row.productName,
        totalSold: Number(row.totalSold),
        revenue: Number(row.revenue)
      }));

      // Revenue trend - group by date
      const revenueTrendResult = await db
        .select({
          date: sql<string>`DATE(${ecommerceOrders.orderDate})`,
          revenue: sql<number>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.tenantId, tenantId),
            gte(ecommerceOrders.orderDate, startDate),
            lte(ecommerceOrders.orderDate, endDate)
          )
        )
        .groupBy(sql`DATE(${ecommerceOrders.orderDate})`)
        .orderBy(sql`DATE(${ecommerceOrders.orderDate})`);

      const revenueTrend = revenueTrendResult.map(row => ({
        date: row.date,
        revenue: Number(row.revenue)
      }));

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        topProducts,
        revenueTrend
      };
    } catch (error) {
      console.error('Error fetching E-commerce metrics:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        revenueTrend: []
      };
    }
  }

  async getSEOMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<SEOMetrics> {
    try {
      // Total keywords tracked
      const keywordsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(keywords)
        .where(eq(keywords.tenantId, tenantId));

      // Average ranking position
      const avgRankingResult = await db
        .select({
          avgPosition: sql<number>`COALESCE(AVG(${keywords.position}), 0)`
        })
        .from(keywords)
        .where(
          and(
            eq(keywords.tenantId, tenantId),
            sql`${keywords.position} IS NOT NULL`
          )
        );

      // Top 5 ranking keywords (best positions)
      const topKeywordsResult = await db
        .select({
          keyword: keywords.keyword,
          position: keywords.position,
          searchVolume: keywords.searchVolume
        })
        .from(keywords)
        .where(
          and(
            eq(keywords.tenantId, tenantId),
            sql`${keywords.position} IS NOT NULL`
          )
        )
        .orderBy(keywords.position)
        .limit(5);

      // Estimated traffic from traffic data
      const trafficResult = await db
        .select({
          totalVisits: sql<number>`COALESCE(SUM(${trafficData.visits}), 0)`
        })
        .from(trafficData)
        .where(
          and(
            eq(trafficData.tenantId, tenantId),
            gte(sql`${trafficData.date}::date`, startDate),
            lte(sql`${trafficData.date}::date`, endDate)
          )
        );

      // Ranking trend - average position over time
      const rankingTrendResult = await db
        .select({
          date: keywordRankHistory.date,
          avgPosition: sql<number>`AVG(${keywordRankHistory.position})`
        })
        .from(keywordRankHistory)
        .where(
          and(
            eq(keywordRankHistory.tenantId, tenantId),
            gte(sql`${keywordRankHistory.date}::date`, startDate),
            lte(sql`${keywordRankHistory.date}::date`, endDate)
          )
        )
        .groupBy(keywordRankHistory.date)
        .orderBy(keywordRankHistory.date);

      const totalKeywords = keywordsResult[0]?.count || 0;
      const averageRanking = Number(avgRankingResult[0]?.avgPosition || 0);
      const topKeywords = topKeywordsResult.map(row => ({
        keyword: row.keyword,
        position: row.position || 0,
        searchVolume: row.searchVolume
      }));
      const estimatedTraffic = Number(trafficResult[0]?.totalVisits || 0);
      const rankingTrend = rankingTrendResult.map(row => ({
        date: row.date,
        avgPosition: Number(row.avgPosition)
      }));

      return {
        totalKeywords,
        averageRanking,
        topKeywords,
        estimatedTraffic,
        rankingTrend
      };
    } catch (error) {
      console.error('Error fetching SEO metrics:', error);
      return {
        totalKeywords: 0,
        averageRanking: 0,
        topKeywords: [],
        estimatedTraffic: 0,
        rankingTrend: []
      };
    }
  }

  async getUnifiedAnalytics(tenantId: string, startDate: Date, endDate: Date): Promise<UnifiedAnalyticsData> {
    // Execute all queries in parallel for better performance
    const [crm, ecommerce, seo] = await Promise.all([
      this.getCRMMetrics(tenantId, startDate, endDate),
      this.getEcommerceMetrics(tenantId, startDate, endDate),
      this.getSEOMetrics(tenantId, startDate, endDate)
    ]);

    return {
      crm,
      ecommerce,
      seo
    };
  }
}

export const analyticsService = new AnalyticsService();
