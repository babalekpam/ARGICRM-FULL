import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CalendarIcon, TrendingUp, Users, ShoppingCart, Search, DollarSign, Target, Award } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CRMMetrics {
  totalContacts: number;
  totalDeals: number;
  totalDealValue: number;
  conversionRate: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

interface EcommerceMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; totalSold: number; revenue: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

interface SEOMetrics {
  totalKeywords: number;
  averageRanking: number;
  topKeywords: Array<{ keyword: string; position: number; searchVolume: number }>;
  estimatedTraffic: number;
  rankingTrend: Array<{ date: string; avgPosition: number }>;
}

interface UnifiedAnalyticsData {
  crm: CRMMetrics;
  ecommerce: EcommerceMetrics;
  seo: SEOMetrics;
}

export default function UnifiedAnalytics() {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data, isLoading, error } = useQuery<{ success: boolean; data: UnifiedAnalyticsData; dateRange: { startDate: string; endDate: string } }>({
    queryKey: ['/api/analytics/unified', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      const response = await fetch(`/api/analytics/unified?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const analytics = data?.data;

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="page-unified-analytics">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Unified Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive view of CRM, E-commerce, and SEO metrics</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                data-testid="button-start-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                data-testid="calendar-start-date"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                data-testid="button-end-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
                data-testid="calendar-end-date"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive" data-testid="text-error">Error loading analytics data. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && analytics && (
        <>
          {/* CRM Overview Section */}
          <section data-testid="section-crm-overview">
            <h2 className="text-2xl font-semibold mb-4" data-testid="text-section-title-crm">CRM Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-contacts">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-contacts">{analytics.crm.totalContacts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Contacts in database</p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-deals">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-deals">{analytics.crm.totalDeals.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Deals in pipeline</p>
                </CardContent>
              </Card>

              <Card data-testid="card-deal-value">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deal Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-deal-value">${analytics.crm.totalDealValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">Total pipeline value</p>
                </CardContent>
              </Card>

              <Card data-testid="card-conversion-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-conversion-rate">{analytics.crm.conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Won deals / total deals</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* E-commerce Overview Section */}
          <section data-testid="section-ecommerce-overview">
            <h2 className="text-2xl font-semibold mb-4" data-testid="text-section-title-ecommerce">E-commerce Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-orders">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-orders">{analytics.ecommerce.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total orders</p>
                </CardContent>
              </Card>

              <Card data-testid="card-ecommerce-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-ecommerce-revenue">${analytics.ecommerce.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-order-value">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-order-value">${analytics.ecommerce.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">Per order</p>
                </CardContent>
              </Card>

              <Card data-testid="card-top-products">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Products</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-top-products-count">{analytics.ecommerce.topProducts.length}</div>
                  <p className="text-xs text-muted-foreground">Best sellers</p>
                </CardContent>
              </Card>
            </div>

            {analytics.ecommerce.topProducts.length > 0 && (
              <Card className="mt-4" data-testid="card-top-products-list">
                <CardHeader>
                  <CardTitle>Top 5 Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.ecommerce.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between" data-testid={`product-${index}`}>
                        <div>
                          <p className="font-medium" data-testid={`product-name-${index}`}>{product.name}</p>
                          <p className="text-sm text-muted-foreground">Sold: {product.totalSold.toLocaleString()}</p>
                        </div>
                        <p className="font-semibold" data-testid={`product-revenue-${index}`}>${product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* SEO Overview Section */}
          <section data-testid="section-seo-overview">
            <h2 className="text-2xl font-semibold mb-4" data-testid="text-section-title-seo">SEO Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-keywords-tracked">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-keywords-tracked">{analytics.seo.totalKeywords.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total keywords</p>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-ranking">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Ranking</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-ranking">{analytics.seo.averageRanking > 0 ? analytics.seo.averageRanking.toFixed(1) : 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">Average position</p>
                </CardContent>
              </Card>

              <Card data-testid="card-top-keywords">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Keywords</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-top-keywords-count">{analytics.seo.topKeywords.length}</div>
                  <p className="text-xs text-muted-foreground">Best rankings</p>
                </CardContent>
              </Card>

              <Card data-testid="card-estimated-traffic">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Est. Traffic</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-estimated-traffic">{analytics.seo.estimatedTraffic.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Organic visits</p>
                </CardContent>
              </Card>
            </div>

            {analytics.seo.topKeywords.length > 0 && (
              <Card className="mt-4" data-testid="card-top-keywords-list">
                <CardHeader>
                  <CardTitle>Top 5 Ranking Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.seo.topKeywords.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between" data-testid={`keyword-${index}`}>
                        <div>
                          <p className="font-medium" data-testid={`keyword-term-${index}`}>{keyword.keyword}</p>
                          <p className="text-sm text-muted-foreground">Volume: {keyword.searchVolume.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" data-testid={`keyword-position-${index}`}>#{keyword.position}</p>
                          <p className="text-xs text-muted-foreground">Position</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Trend Charts */}
          <section className="grid gap-6 md:grid-cols-1 lg:grid-cols-3" data-testid="section-trends">
            {/* CRM Revenue Trend */}
            {analytics.crm.revenueTrend.length > 0 && (
              <Card data-testid="chart-crm-revenue">
                <CardHeader>
                  <CardTitle>CRM Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.crm.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* E-commerce Revenue Trend */}
            {analytics.ecommerce.revenueTrend.length > 0 && (
              <Card data-testid="chart-ecommerce-revenue">
                <CardHeader>
                  <CardTitle>E-commerce Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.ecommerce.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* SEO Ranking Trend */}
            {analytics.seo.rankingTrend.length > 0 && (
              <Card data-testid="chart-seo-ranking">
                <CardHeader>
                  <CardTitle>SEO Ranking Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.seo.rankingTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      />
                      <YAxis tick={{ fontSize: 12 }} reversed />
                      <Tooltip 
                        formatter={(value: number) => `Position ${value.toFixed(1)}`}
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      />
                      <Line type="monotone" dataKey="avgPosition" stroke="#ffc658" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Empty State */}
          {analytics.crm.revenueTrend.length === 0 && 
           analytics.ecommerce.revenueTrend.length === 0 && 
           analytics.seo.rankingTrend.length === 0 && (
            <Card data-testid="empty-state-trends">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No trend data available for the selected date range.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
