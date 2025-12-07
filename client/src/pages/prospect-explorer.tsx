import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Prospect, SavedFilter } from "@shared/schema";
import {
  Search,
  Filter,
  Download,
  Upload,
  Users,
  Building2,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Star,
  CheckCircle2,
  AlertCircle,
  Globe,
  DollarSign,
  Layers,
  Tag,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  UserPlus,
  ChevronLeft,
} from "lucide-react";

const SENIORITY_OPTIONS = [
  { value: "c_level", label: "C-Level" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "senior", label: "Senior" },
  { value: "entry", label: "Entry Level" },
];

const DEPARTMENT_OPTIONS = [
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "engineering", label: "Engineering" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "legal", label: "Legal" },
  { value: "executive", label: "Executive" },
];

const EMPLOYEE_RANGE_OPTIONS = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1001-5000", label: "1001-5000" },
  { value: "5000+", label: "5000+" },
];

const REVENUE_RANGE_OPTIONS = [
  { value: "0-1M", label: "$0 - $1M" },
  { value: "1M-10M", label: "$1M - $10M" },
  { value: "10M-50M", label: "$10M - $50M" },
  { value: "50M-100M", label: "$50M - $100M" },
  { value: "100M-500M", label: "$100M - $500M" },
  { value: "500M-1B", label: "$500M - $1B" },
  { value: "1B+", label: "$1B+" },
];

const INDUSTRY_OPTIONS = [
  "Technology", "Software", "SaaS", "Healthcare", "Finance", "Banking",
  "Retail", "E-commerce", "Manufacturing", "Consulting", "Education",
  "Real Estate", "Insurance", "Telecommunications", "Media", "Entertainment",
  "Automotive", "Energy", "Legal", "Hospitality", "Non-profit"
];

interface ProspectFilters {
  name: string;
  email: string;
  title: string;
  seniority: string[];
  department: string[];
  companyName: string;
  industry: string[];
  employeeRange: string[];
  revenueRange: string[];
  technologies: string;
  city: string;
  state: string;
  country: string;
  hasEmail: boolean | undefined;
  hasPhone: boolean | undefined;
  hasLinkedin: boolean | undefined;
  emailVerified: boolean | undefined;
  importedToCrm: boolean | undefined;
  leadScoreMin: number;
  leadScoreMax: number;
}

const defaultFilters: ProspectFilters = {
  name: "",
  email: "",
  title: "",
  seniority: [],
  department: [],
  companyName: "",
  industry: [],
  employeeRange: [],
  revenueRange: [],
  technologies: "",
  city: "",
  state: "",
  country: "",
  hasEmail: undefined,
  hasPhone: undefined,
  hasLinkedin: undefined,
  emailVerified: undefined,
  importedToCrm: undefined,
  leadScoreMin: 0,
  leadScoreMax: 100,
};

export default function ProspectExplorerPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ProspectFilters>(defaultFilters);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["personal", "professional", "company", "location", "data"]));
  const [fetchBusinessesOpen, setFetchBusinessesOpen] = useState(false);
  const [businessKeyword, setBusinessKeyword] = useState("");
  const [businessLocation, setBusinessLocation] = useState("United States");

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    if (filters.name) params.set("name", filters.name);
    if (filters.email) params.set("email", filters.email);
    if (filters.emailVerified !== undefined) params.set("emailVerified", filters.emailVerified.toString());
    filters.seniority.forEach(s => params.append("seniority", s));
    filters.department.forEach(d => params.append("department", d));
    filters.industry.forEach(i => params.append("industry", i));
    filters.employeeRange.forEach(e => params.append("employeeRange", e));
    filters.revenueRange.forEach(r => params.append("revenueRange", r));
    if (filters.city) params.append("city", filters.city);
    if (filters.state) params.append("state", filters.state);
    if (filters.country) params.append("country", filters.country);
    if (filters.hasEmail !== undefined) params.set("hasEmail", filters.hasEmail.toString());
    if (filters.hasPhone !== undefined) params.set("hasPhone", filters.hasPhone.toString());
    if (filters.hasLinkedin !== undefined) params.set("hasLinkedin", filters.hasLinkedin.toString());
    if (filters.importedToCrm !== undefined) params.set("importedToCrm", filters.importedToCrm.toString());

    return params.toString();
  };

  const { data: prospectsData, isLoading: prospectsLoading, refetch } = useQuery({
    queryKey: ["/api/prospects", buildQueryString()],
  });

  const { data: savedFiltersData } = useQuery<SavedFilter[]>({
    queryKey: ["/api/prospects/filters/saved"],
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/prospects/stats/overview"],
  });

  const importMutation = useMutation({
    mutationFn: async (prospectIds: string[]) => {
      return apiRequest("/api/prospects/import", {
        method: "POST",
        body: JSON.stringify({ prospectIds }),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Successful",
        description: `Imported ${data.imported} prospects to CRM`,
      });
      setSelectedProspects(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import prospects",
        variant: "destructive",
      });
    },
  });

  const saveFilterMutation = useMutation({
    mutationFn: async (data: { name: string; filters: ProspectFilters }) => {
      return apiRequest("/api/prospects/filters/saved", {
        method: "POST",
        body: JSON.stringify({ name: data.name, filters: data.filters }),
      });
    },
    onSuccess: () => {
      toast({ title: "Filter Saved", description: "Your filter has been saved" });
      setSaveFilterOpen(false);
      setFilterName("");
      queryClient.invalidateQueries({ queryKey: ["/api/prospects/filters/saved"] });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/prospects/filters/saved/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ title: "Filter Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects/filters/saved"] });
    },
  });

  const fetchBusinessesMutation = useMutation({
    mutationFn: async (data: { keyword: string; location: string; limit: number }) => {
      return apiRequest("/api/prospects/fetch-businesses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Businesses Fetched",
        description: data.message || `Imported ${data.imported} prospects`,
      });
      setFetchBusinessesOpen(false);
      setBusinessKeyword("");
      queryClient.invalidateQueries({ queryKey: ["/api/prospects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prospects/stats/overview"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fetch Failed",
        description: error.message || "Failed to fetch businesses",
        variant: "destructive",
      });
    },
  });

  const prospects = (prospectsData as any)?.prospects || [];
  const pagination = (prospectsData as any)?.pagination || { page: 1, totalPages: 1, totalCount: 0 };
  const stats = (statsData as any) || { total: 0, withEmail: 0, withPhone: 0, imported: 0 };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleProspect = (id: string) => {
    const newSelected = new Set(selectedProspects);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProspects(newSelected);
  };

  const toggleAllProspects = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.map((p: Prospect) => p.id)));
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const applySavedFilter = (savedFilter: SavedFilter) => {
    const filterData = savedFilter.filters as any;
    setFilters({
      ...defaultFilters,
      ...filterData,
      seniority: filterData.seniority || [],
      department: filterData.department || [],
      industry: filterData.industry || [],
      employeeRange: filterData.employeeRange || [],
      revenueRange: filterData.revenueRange || [],
    });
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.name) count++;
    if (filters.email) count++;
    if (filters.title) count++;
    if (filters.seniority.length) count++;
    if (filters.department.length) count++;
    if (filters.companyName) count++;
    if (filters.industry.length) count++;
    if (filters.employeeRange.length) count++;
    if (filters.revenueRange.length) count++;
    if (filters.city) count++;
    if (filters.country) count++;
    if (filters.hasEmail !== undefined) count++;
    if (filters.hasPhone !== undefined) count++;
    if (filters.hasLinkedin !== undefined) count++;
    return count;
  }, [filters]);

  const renderFilterSection = (title: string, section: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Collapsible open={expandedSections.has(section)} onOpenChange={() => toggleSection(section)}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-2 hover-elevate rounded-md group">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </div>
        {expandedSections.has(section) ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-4 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  const MultiSelectFilter = ({ label, options, selected, onSelect }: { label: string; options: { value: string; label: string }[]; selected: string[]; onSelect: (values: string[]) => void }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <Badge
            key={option.value}
            variant={selected.includes(option.value) ? "default" : "outline"}
            className="cursor-pointer text-xs toggle-elevate"
            data-testid={`filter-${label.toLowerCase()}-${option.value}`}
            onClick={() => {
              if (selected.includes(option.value)) {
                onSelect(selected.filter(s => s !== option.value));
              } else {
                onSelect([...selected, option.value]);
              }
            }}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Filters</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters} data-testid="button-reset-filters">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {savedFiltersData && savedFiltersData.length > 0 && (
              <Select onValueChange={(id) => {
                const filter = savedFiltersData.find(f => f.id === id);
                if (filter) applySavedFilter(filter);
              }}>
                <SelectTrigger className="w-full" data-testid="select-saved-filter">
                  <SelectValue placeholder="Load saved filter..." />
                </SelectTrigger>
                <SelectContent>
                  {savedFiltersData.map(filter => (
                    <SelectItem key={filter.id} value={filter.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{filter.name}</span>
                        {filter.isDefault && <Star className="h-3 w-3 text-yellow-500 ml-2" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {renderFilterSection("Personal Info", "personal", <Users className="h-4 w-4" />, (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      placeholder="Search by name..."
                      value={filters.name}
                      onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
                      data-testid="input-filter-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      placeholder="Search by email..."
                      value={filters.email}
                      onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
                      data-testid="input-filter-email"
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-xs text-muted-foreground">Email Verified Only</Label>
                    <Switch
                      checked={filters.emailVerified === true}
                      onCheckedChange={(checked) => setFilters(f => ({ ...f, emailVerified: checked ? true : undefined }))}
                      data-testid="switch-email-verified"
                    />
                  </div>
                </>
              ))}

              <Separator />

              {renderFilterSection("Professional", "professional", <Briefcase className="h-4 w-4" />, (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                    <Input
                      placeholder="e.g. CEO, Sales Director..."
                      value={filters.title}
                      onChange={(e) => setFilters(f => ({ ...f, title: e.target.value }))}
                      data-testid="input-filter-title"
                    />
                  </div>
                  <MultiSelectFilter
                    label="Seniority Level"
                    options={SENIORITY_OPTIONS}
                    selected={filters.seniority}
                    onSelect={(values) => setFilters(f => ({ ...f, seniority: values }))}
                  />
                  <MultiSelectFilter
                    label="Department"
                    options={DEPARTMENT_OPTIONS}
                    selected={filters.department}
                    onSelect={(values) => setFilters(f => ({ ...f, department: values }))}
                  />
                </>
              ))}

              <Separator />

              {renderFilterSection("Company", "company", <Building2 className="h-4 w-4" />, (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Company Name</Label>
                    <Input
                      placeholder="Search company..."
                      value={filters.companyName}
                      onChange={(e) => setFilters(f => ({ ...f, companyName: e.target.value }))}
                      data-testid="input-filter-company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Industry</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {INDUSTRY_OPTIONS.map(industry => (
                        <Badge
                          key={industry}
                          variant={filters.industry.includes(industry) ? "default" : "outline"}
                          className="cursor-pointer text-xs toggle-elevate"
                          onClick={() => {
                            if (filters.industry.includes(industry)) {
                              setFilters(f => ({ ...f, industry: f.industry.filter(i => i !== industry) }));
                            } else {
                              setFilters(f => ({ ...f, industry: [...f.industry, industry] }));
                            }
                          }}
                        >
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <MultiSelectFilter
                    label="Employee Count"
                    options={EMPLOYEE_RANGE_OPTIONS}
                    selected={filters.employeeRange}
                    onSelect={(values) => setFilters(f => ({ ...f, employeeRange: values }))}
                  />
                  <MultiSelectFilter
                    label="Revenue Range"
                    options={REVENUE_RANGE_OPTIONS}
                    selected={filters.revenueRange}
                    onSelect={(values) => setFilters(f => ({ ...f, revenueRange: values }))}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Technologies</Label>
                    <Input
                      placeholder="e.g. Salesforce, React..."
                      value={filters.technologies}
                      onChange={(e) => setFilters(f => ({ ...f, technologies: e.target.value }))}
                      data-testid="input-filter-technologies"
                    />
                  </div>
                </>
              ))}

              <Separator />

              {renderFilterSection("Location", "location", <MapPin className="h-4 w-4" />, (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Country</Label>
                    <Input
                      placeholder="e.g. United States"
                      value={filters.country}
                      onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                      data-testid="input-filter-country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">State/Region</Label>
                    <Input
                      placeholder="e.g. California"
                      value={filters.state}
                      onChange={(e) => setFilters(f => ({ ...f, state: e.target.value }))}
                      data-testid="input-filter-state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">City</Label>
                    <Input
                      placeholder="e.g. San Francisco"
                      value={filters.city}
                      onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                      data-testid="input-filter-city"
                    />
                  </div>
                </>
              ))}

              <Separator />

              {renderFilterSection("Data Availability", "data", <Layers className="h-4 w-4" />, (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Has Email</Label>
                      </div>
                      <Switch
                        checked={filters.hasEmail === true}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, hasEmail: checked ? true : undefined }))}
                        data-testid="switch-has-email"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Has Phone</Label>
                      </div>
                      <Switch
                        checked={filters.hasPhone === true}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, hasPhone: checked ? true : undefined }))}
                        data-testid="switch-has-phone"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Has LinkedIn</Label>
                      </div>
                      <Switch
                        checked={filters.hasLinkedin === true}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, hasLinkedin: checked ? true : undefined }))}
                        data-testid="switch-has-linkedin"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-xs">Not Imported to CRM</Label>
                      </div>
                      <Switch
                        checked={filters.importedToCrm === false}
                        onCheckedChange={(checked) => setFilters(f => ({ ...f, importedToCrm: checked ? false : undefined }))}
                        data-testid="switch-not-imported"
                      />
                    </div>
                  </div>
                </>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Button
              className="w-full"
              onClick={() => { setPage(1); refetch(); }}
              data-testid="button-apply-filters"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Prospects
            </Button>
            <Dialog open={saveFilterOpen} onOpenChange={setSaveFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" data-testid="button-save-filter">
                  <Save className="h-4 w-4 mr-2" />
                  Save Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Filter</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Filter Name</Label>
                  <Input
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="e.g. VP Sales in California"
                    className="mt-2"
                    data-testid="input-filter-name-save"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveFilterOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => saveFilterMutation.mutate({ name: filterName, filters })}
                    disabled={!filterName || saveFilterMutation.isPending}
                    data-testid="button-confirm-save-filter"
                  >
                    {saveFilterMutation.isPending ? "Saving..." : "Save Filter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Prospect Explorer</h1>
                <p className="text-sm text-muted-foreground">
                  B2B prospect database with advanced filtering
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums">{stats.total.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Prospects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums text-green-500">{stats.withEmail.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">With Email</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums text-blue-500">{stats.withPhone.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">With Phone</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums text-purple-500">{stats.imported.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Imported</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedProspects.size > 0 && (
            <div className="p-3 bg-primary/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedProspects.size} prospects selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => importMutation.mutate(Array.from(selectedProspects))}
                  disabled={importMutation.isPending}
                  data-testid="button-import-selected"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : "Import to CRM"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedProspects(new Set())}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {prospectsLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : prospects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Prospects Found</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  {stats.total === 0 
                    ? "Your prospect database is empty. Fetch businesses from DataForSEO to get started."
                    : "Try adjusting your filters or search criteria to find more prospects."
                  }
                </p>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                  <Dialog open={fetchBusinessesOpen} onOpenChange={setFetchBusinessesOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-fetch-businesses">
                        <Download className="h-4 w-4 mr-2" />
                        Fetch Businesses
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Fetch Businesses from DataForSEO</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Business Type / Keyword</Label>
                          <Input
                            placeholder="e.g. software companies, marketing agencies, restaurants..."
                            value={businessKeyword}
                            onChange={(e) => setBusinessKeyword(e.target.value)}
                            data-testid="input-business-keyword"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the type of business you want to find
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            placeholder="e.g. United States, California, New York..."
                            value={businessLocation}
                            onChange={(e) => setBusinessLocation(e.target.value)}
                            data-testid="input-business-location"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setFetchBusinessesOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => fetchBusinessesMutation.mutate({ 
                            keyword: businessKeyword, 
                            location: businessLocation, 
                            limit: 20 
                          })}
                          disabled={!businessKeyword || fetchBusinessesMutation.isPending}
                          data-testid="button-confirm-fetch"
                        >
                          {fetchBusinessesMutation.isPending ? "Fetching..." : "Fetch Businesses"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProspects.size === prospects.length && prospects.length > 0}
                        onCheckedChange={toggleAllProspects}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect: Prospect) => (
                    <TableRow
                      key={prospect.id}
                      className="group hover-elevate"
                      data-testid={`row-prospect-${prospect.id}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProspects.has(prospect.id)}
                          onCheckedChange={() => toggleProspect(prospect.id)}
                          data-testid={`checkbox-prospect-${prospect.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {(prospect.firstName?.[0] || '') + (prospect.lastName?.[0] || '')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{prospect.fullName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {prospect.email && (
                                <>
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{prospect.email}</span>
                                  {prospect.emailVerified && (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{prospect.title || '-'}</div>
                          {prospect.seniority && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {prospect.seniority.replace('_', '-')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {prospect.companyName || '-'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {prospect.industry && (
                              <Badge variant="secondary" className="text-xs">{prospect.industry}</Badge>
                            )}
                            {prospect.employeeRange && (
                              <Badge variant="outline" className="text-xs">{prospect.employeeRange} emp</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {[prospect.city, prospect.state, prospect.country].filter(Boolean).join(', ') || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {prospect.email && (
                            <div className="p-1.5 rounded bg-green-500/10" title="Has Email">
                              <Mail className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                          {(prospect.phone || prospect.directDial) && (
                            <div className="p-1.5 rounded bg-blue-500/10" title="Has Phone">
                              <Phone className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                          {prospect.linkedinUrl && (
                            <div className="p-1.5 rounded bg-purple-500/10" title="Has LinkedIn">
                              <Linkedin className="h-4 w-4 text-purple-500" />
                            </div>
                          )}
                          {prospect.importedToCrm && (
                            <Badge variant="outline" className="text-xs bg-primary/10">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              In CRM
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!prospect.importedToCrm && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => importMutation.mutate([prospect.id])}
                              disabled={importMutation.isPending}
                              data-testid={`button-import-${prospect.id}`}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          {prospect.linkedinUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(prospect.linkedinUrl || '', '_blank')}
                              data-testid={`button-linkedin-${prospect.id}`}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border bg-card flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * limit) + 1} - {Math.min(pagination.page * limit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()} prospects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="px-3 py-1.5 bg-muted rounded-md text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
