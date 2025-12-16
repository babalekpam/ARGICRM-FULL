import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Building2,
  TrendingUp,
  Flame,
  Eye,
  UserPlus,
  RefreshCw,
  MapPin,
  Clock,
  FileText,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Globe,
  Briefcase,
} from "lucide-react";

interface WebsiteVisitor {
  id: string;
  companyName: string;
  industry: string;
  size: string;
  location: string;
  pagesViewed: number;
  sessionDuration: string;
  lastVisit: string;
  intentScore: number;
  isNew: boolean;
}

interface VisitorStats {
  totalVisitorsToday: number;
  identifiedCompanies: number;
  newCompanies: number;
  highIntentVisitors: number;
}

interface WebsiteVisitorsResponse {
  visitors: WebsiteVisitor[];
  stats: VisitorStats;
  total: number;
  page: number;
  limit: number;
}

const INDUSTRY_OPTIONS = [
  { value: "all", label: "All Industries" },
  { value: "technology", label: "Technology" },
  { value: "software", label: "Software" },
  { value: "saas", label: "SaaS" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "education", label: "Education" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "all", label: "All Sizes" },
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1000+", label: "1000+" },
];

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

const mockVisitors: WebsiteVisitor[] = [];

const mockStats: VisitorStats = {
  totalVisitorsToday: 0,
  identifiedCompanies: 0,
  newCompanies: 0,
  highIntentVisitors: 0,
};

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  testId 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  trend?: number;
  trendLabel?: string;
  testId: string;
}) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {value.toLocaleString()}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`w-3 h-3 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-muted-foreground">{trendLabel}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getIntentBadge(score: number) {
  if (score >= 80) {
    return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Sizzling</Badge>;
  } else if (score >= 60) {
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Hot</Badge>;
  } else if (score >= 40) {
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warm</Badge>;
  }
  return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Cold</Badge>;
}

function formatDuration(duration: string): string {
  return duration;
}

function formatLastVisit(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function WebsiteVisitorsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("today");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (dateRange !== "today") params.set("dateRange", dateRange);
    if (industryFilter !== "all") params.set("industry", industryFilter);
    if (sizeFilter !== "all") params.set("size", sizeFilter);
    return params.toString();
  };

  const { data, isLoading, refetch } = useQuery<WebsiteVisitorsResponse>({
    queryKey: ['/api/website-visitors', buildQueryString()],
  });

  const addToCrmMutation = useMutation({
    mutationFn: async (visitorId: string) => {
      return apiRequest("POST", "/api/website-visitors/add-to-crm", { visitorId });
    },
    onSuccess: () => {
      toast({
        title: "Added to CRM",
        description: "Company has been added to your CRM successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/website-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add company to CRM",
        variant: "destructive",
      });
    },
  });

  const visitors = data?.visitors || mockVisitors;
  const stats = data?.stats || mockStats;
  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const handleViewCompany = (visitor: WebsiteVisitor) => {
    toast({
      title: "View Company",
      description: `Opening details for ${visitor.companyName}`,
    });
  };

  const handleAddToCrm = (visitor: WebsiteVisitor) => {
    addToCrmMutation.mutate(visitor.id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Website Visitor Identification
            </h1>
            <p className="text-muted-foreground mt-1">
              Identify anonymous companies visiting your website and convert them into leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Visitors Today"
            value={stats.totalVisitorsToday}
            icon={Users}
            trend={12}
            trendLabel="vs yesterday"
            testId="stat-total-visitors"
          />
          <StatCard
            title="Identified Companies"
            value={stats.identifiedCompanies}
            icon={Building2}
            trend={8}
            trendLabel="vs yesterday"
            testId="stat-identified-companies"
          />
          <StatCard
            title="New Companies"
            value={stats.newCompanies}
            icon={Globe}
            trend={15}
            trendLabel="vs yesterday"
            testId="stat-new-companies"
          />
          <StatCard
            title="High-Intent Visitors"
            value={stats.highIntentVisitors}
            icon={Flame}
            trend={23}
            trendLabel="vs yesterday"
            testId="stat-high-intent"
          />
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Visitor Activity
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[160px]" data-testid="select-date-range">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-industry">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-company-size">
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6" data-testid="empty-state">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No visitors identified yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Website visitor identification will show anonymous companies visiting your site. 
                  Install the tracking script to start identifying visitors.
                </p>
                <Button data-testid="button-install-tracking">
                  Get Tracking Script
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Company Name</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Industry</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Size</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Location</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Pages Viewed</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Session Duration</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide">Last Visit</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wide text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.map((visitor) => (
                        <TableRow 
                          key={visitor.id} 
                          className="border-border hover:bg-muted/50"
                          data-testid={`row-visitor-${visitor.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {visitor.companyName}
                                  {visitor.isNew && (
                                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                {getIntentBadge(visitor.intentScore)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{visitor.industry}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {visitor.size} employees
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              {visitor.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              {visitor.pagesViewed} pages
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {formatDuration(visitor.sessionDuration)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatLastVisit(visitor.lastVisit)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewCompany(visitor)}
                                data-testid={`button-view-company-${visitor.id}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToCrm(visitor)}
                                disabled={addToCrmMutation.isPending}
                                data-testid={`button-add-to-crm-${visitor.id}`}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add to CRM
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} visitors
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
