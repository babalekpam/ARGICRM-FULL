import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Building2,
  Layers,
  Server,
  BarChart3,
  Globe,
  Code2,
  Megaphone,
  Database,
  Cloud,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  TrendingUp,
  Zap,
} from "lucide-react";

interface Technology {
  name: string;
  confidence: number;
  category: string;
  detectedAt?: string;
}

interface CompanyTechnographics {
  id: string;
  domain: string;
  companyName: string;
  industry?: string;
  employeeCount?: string;
  technologies: Technology[];
  lastUpdated: string;
}

interface TechnographicsStats {
  companiesTracked: number;
  technologiesDetected: number;
  categoriesCovered: number;
}

interface TechnographicsResponse {
  companies: CompanyTechnographics[];
  stats: TechnographicsStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TECH_CATEGORIES = [
  { value: "all", label: "All Categories", icon: Layers },
  { value: "crm", label: "CRM", icon: Building2 },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "development", label: "Development", icon: Code2 },
  { value: "database", label: "Database", icon: Database },
  { value: "hosting", label: "Hosting", icon: Server },
];

const getCategoryIcon = (category: string) => {
  const cat = TECH_CATEGORIES.find(c => c.value === category.toLowerCase());
  return cat?.icon || Layers;
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return "bg-[#10B981] text-white";
  if (confidence >= 70) return "bg-[#4C6EF5] text-white";
  if (confidence >= 50) return "bg-[#F59E0B] text-white";
  return "bg-[#64748B] text-white";
};

const mockData: TechnographicsResponse = {
  companies: [
    {
      id: "1",
      domain: "salesforce.com",
      companyName: "Salesforce",
      industry: "Software",
      employeeCount: "50,000+",
      technologies: [
        { name: "Salesforce CRM", confidence: 99, category: "CRM" },
        { name: "Google Analytics", confidence: 95, category: "Analytics" },
        { name: "AWS", confidence: 88, category: "Cloud" },
        { name: "React", confidence: 92, category: "Development" },
        { name: "Marketo", confidence: 85, category: "Marketing" },
      ],
      lastUpdated: "2025-12-15",
    },
    {
      id: "2",
      domain: "hubspot.com",
      companyName: "HubSpot",
      industry: "Software",
      employeeCount: "5,000-10,000",
      technologies: [
        { name: "HubSpot CRM", confidence: 99, category: "CRM" },
        { name: "HubSpot Marketing", confidence: 99, category: "Marketing" },
        { name: "Mixpanel", confidence: 78, category: "Analytics" },
        { name: "GCP", confidence: 82, category: "Cloud" },
        { name: "Vue.js", confidence: 75, category: "Development" },
      ],
      lastUpdated: "2025-12-14",
    },
    {
      id: "3",
      domain: "stripe.com",
      companyName: "Stripe",
      industry: "Fintech",
      employeeCount: "5,000-10,000",
      technologies: [
        { name: "Zendesk", confidence: 88, category: "CRM" },
        { name: "Segment", confidence: 95, category: "Analytics" },
        { name: "AWS", confidence: 92, category: "Cloud" },
        { name: "Ruby on Rails", confidence: 90, category: "Development" },
        { name: "Intercom", confidence: 85, category: "Marketing" },
      ],
      lastUpdated: "2025-12-13",
    },
    {
      id: "4",
      domain: "shopify.com",
      companyName: "Shopify",
      industry: "E-commerce",
      employeeCount: "10,000+",
      technologies: [
        { name: "Salesforce", confidence: 72, category: "CRM" },
        { name: "Amplitude", confidence: 88, category: "Analytics" },
        { name: "GCP", confidence: 95, category: "Cloud" },
        { name: "React", confidence: 94, category: "Development" },
        { name: "Braze", confidence: 80, category: "Marketing" },
        { name: "PostgreSQL", confidence: 92, category: "Database" },
      ],
      lastUpdated: "2025-12-12",
    },
    {
      id: "5",
      domain: "notion.so",
      companyName: "Notion",
      industry: "Productivity",
      employeeCount: "500-1,000",
      technologies: [
        { name: "Pipedrive", confidence: 65, category: "CRM" },
        { name: "Heap", confidence: 82, category: "Analytics" },
        { name: "AWS", confidence: 90, category: "Cloud" },
        { name: "TypeScript", confidence: 95, category: "Development" },
        { name: "Customer.io", confidence: 78, category: "Marketing" },
      ],
      lastUpdated: "2025-12-11",
    },
  ],
  stats: {
    companiesTracked: 2847392,
    technologiesDetected: 15420,
    categoriesCovered: 156,
  },
  pagination: {
    page: 1,
    limit: 25,
    total: 5,
    totalPages: 1,
  },
};

export default function TechnographicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page] = useState(1);

  const { data, isLoading, refetch } = useQuery<TechnographicsResponse>({
    queryKey: ['/api/technographics'],
    queryFn: async () => {
      return mockData;
    },
  });

  const filteredCompanies = useMemo(() => {
    if (!data?.companies) return [];
    
    return data.companies.filter(company => {
      const matchesSearch = searchQuery === "" || 
        company.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" ||
        company.technologies.some(tech => 
          tech.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      
      return matchesSearch && matchesCategory;
    });
  }, [data?.companies, searchQuery, selectedCategory]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTechsByCategory = (technologies: Technology[], category: string): Technology[] => {
    return technologies.filter(tech => 
      tech.category.toLowerCase() === category.toLowerCase()
    );
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F8F9FA]" data-testid="text-page-title">
              Technographics
            </h1>
            <p className="text-[#94A3B8] mt-1">
              Discover technology stacks used by companies worldwide
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            data-testid="button-refresh"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#11152B] border-[#1E293B]" data-testid="card-stat-companies">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#4C6EF5]/10">
                  <Building2 className="w-6 h-6 text-[#4C6EF5]" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Companies Tracked
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-companies-count">
                    {isLoading ? <Skeleton className="h-9 w-24" /> : formatNumber(data?.stats.companiesTracked || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span className="text-xs text-[#10B981]">+12.5% this month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#11152B] border-[#1E293B]" data-testid="card-stat-technologies">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#7048E8]/10">
                  <Zap className="w-6 h-6 text-[#7048E8]" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Technologies Detected
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-technologies-count">
                    {isLoading ? <Skeleton className="h-9 w-24" /> : formatNumber(data?.stats.technologiesDetected || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span className="text-xs text-[#10B981]">+8.2% this month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#11152B] border-[#1E293B]" data-testid="card-stat-categories">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#10B981]/10">
                  <Layers className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Categories Covered
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-categories-count">
                    {isLoading ? <Skeleton className="h-9 w-24" /> : data?.stats.categoriesCovered || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                    <span className="text-xs text-[#10B981]">+3 new categories</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#11152B] border-[#1E293B]">
          <CardHeader className="border-b border-[#1E293B]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-[#F8F9FA]">
                Company Tech Stacks
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input
                    placeholder="Search by domain or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] placeholder:text-[#64748B]"
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger 
                    className="w-full sm:w-48 bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                    data-testid="select-category"
                  >
                    <Filter className="w-4 h-4 mr-2 text-[#64748B]" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#11152B] border-[#1E293B]">
                    {TECH_CATEGORIES.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="text-[#F8F9FA] focus:bg-[#1A1F3A] focus:text-[#F8F9FA]"
                      >
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-12 text-center" data-testid="empty-state">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#1A1F3A] flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-[#64748B]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F8F9FA] mb-2">
                  No companies found
                </h3>
                <p className="text-[#94A3B8] max-w-md mx-auto">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Try adjusting your search or filter criteria to find companies."
                    : "Start by searching for a company domain to discover their technology stack."}
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1E293B] hover:bg-transparent">
                      <TableHead className="text-[#64748B] font-medium">Company</TableHead>
                      <TableHead className="text-[#64748B] font-medium">CRM</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Marketing</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Analytics</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Cloud</TableHead>
                      <TableHead className="text-[#64748B] font-medium">Development</TableHead>
                      <TableHead className="text-[#64748B] font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow 
                        key={company.id} 
                        className="border-[#1E293B] hover:bg-[#1A1F3A]"
                        data-testid={`row-company-${company.id}`}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1A1F3A] flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#4C6EF5]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#F8F9FA]" data-testid={`text-company-name-${company.id}`}>
                                {company.companyName}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#64748B]">{company.domain}</span>
                                {company.industry && (
                                  <Badge variant="secondary" className="text-xs bg-[#1A1F3A] text-[#94A3B8]">
                                    {company.industry}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        {["CRM", "Marketing", "Analytics", "Cloud", "Development"].map((category) => (
                          <TableCell key={category} className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {getTechsByCategory(company.technologies, category).map((tech) => (
                                <Badge
                                  key={tech.name}
                                  className={`${getConfidenceColor(tech.confidence)} text-xs font-medium`}
                                  data-testid={`badge-tech-${company.id}-${tech.name.replace(/\s/g, '-').toLowerCase()}`}
                                >
                                  {tech.name}
                                  <span className="ml-1.5 opacity-80">{tech.confidence}%</span>
                                </Badge>
                              ))}
                              {getTechsByCategory(company.technologies, category).length === 0 && (
                                <span className="text-xs text-[#64748B]">—</span>
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#1A1F3A]"
                            data-testid={`button-view-${company.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#11152B] border-[#1E293B]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#F8F9FA]">
              Technology Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {TECH_CATEGORIES.filter(cat => cat.value !== "all").map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.value;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(isSelected ? "all" : category.value)}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? "bg-[#4C6EF5]/10 border-[#4C6EF5] text-[#4C6EF5]" 
                        : "bg-[#1A1F3A] border-[#1E293B] text-[#94A3B8] hover:border-[#4C6EF5]/50"
                    }`}
                    data-testid={`button-category-${category.value}`}
                  >
                    <IconComponent className="w-5 h-5 mx-auto mb-2" />
                    <p className="text-xs font-medium text-center">{category.label}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
