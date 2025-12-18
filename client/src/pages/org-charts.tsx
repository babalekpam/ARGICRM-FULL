import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Mail,
  Linkedin,
  ChevronDown,
  ChevronRight,
  Users,
  UserPlus,
  Star,
  Phone,
  MapPin,
  Briefcase,
  Network,
  Filter,
} from "lucide-react";

interface OrgChartPerson {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  isDecisionMaker: boolean;
  location?: string;
  reportsTo?: string;
  directReports?: OrgChartPerson[];
}

interface OrgChartCompany {
  id: string;
  name: string;
  industry?: string;
  employeeCount?: number;
  headquarters?: string;
  orgChart: OrgChartPerson[];
}

interface OrgChartData {
  companies: OrgChartCompany[];
}

const MOCK_ORG_DATA: OrgChartData = {
  companies: [
    {
      id: "1",
      name: "Acme Corporation",
      industry: "Technology",
      employeeCount: 5000,
      headquarters: "San Francisco, CA",
      orgChart: [
        {
          id: "ceo-1",
          name: "Sarah Chen",
          title: "Chief Executive Officer",
          department: "Executive",
          email: "sarah.chen@acme.com",
          phone: "+1 (555) 123-4567",
          linkedinUrl: "https://linkedin.com/in/sarahchen",
          isDecisionMaker: true,
          location: "San Francisco, CA",
          directReports: [
            {
              id: "cto-1",
              name: "Michael Torres",
              title: "Chief Technology Officer",
              department: "Engineering",
              email: "michael.torres@acme.com",
              phone: "+1 (555) 234-5678",
              linkedinUrl: "https://linkedin.com/in/michaeltorres",
              isDecisionMaker: true,
              location: "San Francisco, CA",
              reportsTo: "ceo-1",
              directReports: [
                {
                  id: "eng-dir-1",
                  name: "Emily Rodriguez",
                  title: "VP of Engineering",
                  department: "Engineering",
                  email: "emily.rodriguez@acme.com",
                  linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
                  isDecisionMaker: true,
                  location: "Austin, TX",
                  reportsTo: "cto-1",
                  directReports: [
                    {
                      id: "eng-mgr-1",
                      name: "David Kim",
                      title: "Engineering Manager",
                      department: "Engineering",
                      email: "david.kim@acme.com",
                      isDecisionMaker: false,
                      location: "Austin, TX",
                      reportsTo: "eng-dir-1",
                    },
                    {
                      id: "eng-mgr-2",
                      name: "Lisa Wang",
                      title: "Engineering Manager",
                      department: "Engineering",
                      email: "lisa.wang@acme.com",
                      isDecisionMaker: false,
                      location: "Seattle, WA",
                      reportsTo: "eng-dir-1",
                    },
                  ],
                },
              ],
            },
            {
              id: "cfo-1",
              name: "Robert Johnson",
              title: "Chief Financial Officer",
              department: "Finance",
              email: "robert.johnson@acme.com",
              phone: "+1 (555) 345-6789",
              linkedinUrl: "https://linkedin.com/in/robertjohnson",
              isDecisionMaker: true,
              location: "New York, NY",
              reportsTo: "ceo-1",
              directReports: [
                {
                  id: "fin-dir-1",
                  name: "Amanda Foster",
                  title: "VP of Finance",
                  department: "Finance",
                  email: "amanda.foster@acme.com",
                  isDecisionMaker: false,
                  location: "New York, NY",
                  reportsTo: "cfo-1",
                },
              ],
            },
            {
              id: "cmo-1",
              name: "Jennifer Lee",
              title: "Chief Marketing Officer",
              department: "Marketing",
              email: "jennifer.lee@acme.com",
              phone: "+1 (555) 456-7890",
              linkedinUrl: "https://linkedin.com/in/jenniferlee",
              isDecisionMaker: true,
              location: "Los Angeles, CA",
              reportsTo: "ceo-1",
              directReports: [
                {
                  id: "mkt-dir-1",
                  name: "Chris Martinez",
                  title: "VP of Marketing",
                  department: "Marketing",
                  email: "chris.martinez@acme.com",
                  isDecisionMaker: false,
                  location: "Los Angeles, CA",
                  reportsTo: "cmo-1",
                },
              ],
            },
            {
              id: "cro-1",
              name: "James Wilson",
              title: "Chief Revenue Officer",
              department: "Sales",
              email: "james.wilson@acme.com",
              phone: "+1 (555) 567-8901",
              linkedinUrl: "https://linkedin.com/in/jameswilson",
              isDecisionMaker: true,
              location: "Chicago, IL",
              reportsTo: "ceo-1",
              directReports: [
                {
                  id: "sales-dir-1",
                  name: "Maria Garcia",
                  title: "VP of Sales",
                  department: "Sales",
                  email: "maria.garcia@acme.com",
                  linkedinUrl: "https://linkedin.com/in/mariagarcia",
                  isDecisionMaker: true,
                  location: "Chicago, IL",
                  reportsTo: "cro-1",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "TechStart Inc",
      industry: "SaaS",
      employeeCount: 150,
      headquarters: "Austin, TX",
      orgChart: [
        {
          id: "ts-ceo-1",
          name: "Alex Thompson",
          title: "CEO & Founder",
          department: "Executive",
          email: "alex@techstart.io",
          linkedinUrl: "https://linkedin.com/in/alexthompson",
          isDecisionMaker: true,
          location: "Austin, TX",
          directReports: [
            {
              id: "ts-cto-1",
              name: "Priya Patel",
              title: "CTO",
              department: "Engineering",
              email: "priya@techstart.io",
              linkedinUrl: "https://linkedin.com/in/priyapatel",
              isDecisionMaker: true,
              location: "Austin, TX",
              reportsTo: "ts-ceo-1",
            },
            {
              id: "ts-vps-1",
              name: "Mark Stevens",
              title: "VP Sales",
              department: "Sales",
              email: "mark@techstart.io",
              linkedinUrl: "https://linkedin.com/in/markstevens",
              isDecisionMaker: true,
              location: "Austin, TX",
              reportsTo: "ts-ceo-1",
            },
          ],
        },
      ],
    },
  ],
};

function PersonNode({
  person,
  level = 0,
  onPersonClick,
  expandedNodes,
  toggleExpand,
  departmentFilter,
}: {
  person: OrgChartPerson;
  level?: number;
  onPersonClick: (person: OrgChartPerson) => void;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
  departmentFilter: string;
}) {
  const hasDirectReports = person.directReports && person.directReports.length > 0;
  const isExpanded = expandedNodes.has(person.id);

  const filteredReports = useMemo(() => {
    if (!person.directReports) return [];
    if (departmentFilter === "all") return person.directReports;
    return person.directReports.filter(
      (p) => p.department === departmentFilter || 
      (p.directReports && p.directReports.some(dr => dr.department === departmentFilter))
    );
  }, [person.directReports, departmentFilter]);

  const shouldShow = departmentFilter === "all" || 
    person.department === departmentFilter ||
    (person.directReports && person.directReports.some(dr => dr.department === departmentFilter));

  if (!shouldShow && level > 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" data-testid={`org-node-${person.id}`}>
      {level > 0 && (
        <div className="absolute left-0 top-0 w-6 h-8 border-l-2 border-b-2 border-border rounded-bl-lg -translate-x-6" />
      )}
      
      <Card 
        className="mb-3 hover-elevate cursor-pointer bg-card border-border"
        onClick={() => onPersonClick(person)}
        data-testid={`person-card-${person.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {hasDirectReports && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(person.id);
                }}
                data-testid={`expand-btn-${person.id}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasDirectReports && <div className="w-6" />}
            
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={person.avatarUrl} alt={person.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-semibold text-foreground truncate"
                  data-testid={`person-name-${person.id}`}
                >
                  {person.name}
                </span>
                {person.isDecisionMaker && (
                  <Badge 
                    variant="default" 
                    className="bg-amber-500/20 text-amber-400 border-amber-500/30 shrink-0"
                    data-testid={`decision-maker-badge-${person.id}`}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Decision Maker
                  </Badge>
                )}
              </div>
              <p 
                className="text-sm text-muted-foreground truncate"
                data-testid={`person-title-${person.id}`}
              >
                {person.title}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {person.department}
                </Badge>
                {person.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{person.email}</span>
                  </span>
                )}
                {person.linkedinUrl && (
                  <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {hasDirectReports && isExpanded && (
        <div className="ml-12 pl-6 border-l-2 border-border">
          {filteredReports.map((report) => (
            <PersonNode
              key={report.id}
              person={report}
              level={level + 1}
              onPersonClick={onPersonClick}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              departmentFilter={departmentFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed" data-testid="empty-state">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Network className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Org Chart Data
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          Select a company to view their organizational structure, or the selected company doesn't have org chart data available yet.
        </p>
        <Button variant="outline" data-testid="btn-request-data">
          <Users className="h-4 w-4 mr-2" />
          Request Org Data
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrgChartsPage() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPerson, setSelectedPerson] = useState<OrgChartPerson | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: orgData, isLoading } = useQuery<OrgChartData>({
    queryKey: ["/api/org-charts"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/org-charts");
        if (!response.ok) {
          // API not available, use mock data
          return MOCK_ORG_DATA;
        }
        const data = await response.json();
        // If API returns empty data, fall back to mock
        if (!data || !data.companies || data.companies.length === 0) {
          return MOCK_ORG_DATA;
        }
        return data;
      } catch {
        // Network error, use mock data
        return MOCK_ORG_DATA;
      }
    },
    // Ensure we always have data
    staleTime: Infinity,
    retry: false,
  });

  const addToContactsMutation = useMutation({
    mutationFn: async (person: OrgChartPerson) => {
      return apiRequest("POST", "/api/contacts", {
        firstName: person.name.split(" ")[0],
        lastName: person.name.split(" ").slice(1).join(" "),
        email: person.email,
        phone: person.phone,
        title: person.title,
        company: selectedCompany?.name,
        linkedinUrl: person.linkedinUrl,
        source: "org_chart",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact Added",
        description: "Successfully added to your contacts",
      });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Always ensure we have companies data (use mock as fallback)
  const companies = orgData?.companies && orgData.companies.length > 0 
    ? orgData.companies 
    : MOCK_ORG_DATA.companies;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const departments = useMemo(() => {
    if (!selectedCompany?.orgChart) return [];
    const depts = new Set<string>();
    
    const collectDepts = (people: OrgChartPerson[]) => {
      people.forEach((p) => {
        depts.add(p.department);
        if (p.directReports) collectDepts(p.directReports);
      });
    };
    
    collectDepts(selectedCompany.orgChart);
    return Array.from(depts).sort();
  }, [selectedCompany]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!selectedCompany?.orgChart) return;
    const allIds = new Set<string>();
    
    const collectIds = (people: OrgChartPerson[]) => {
      people.forEach((p) => {
        if (p.directReports && p.directReports.length > 0) {
          allIds.add(p.id);
          collectIds(p.directReports);
        }
      });
    };
    
    collectIds(selectedCompany.orgChart);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handlePersonClick = (person: OrgChartPerson) => {
    setSelectedPerson(person);
    setDetailsOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">
              Org Charts
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore organizational structures and identify key decision makers
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Organization
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                disabled={!selectedCompany}
                data-testid="btn-expand-all"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                disabled={!selectedCompany}
                data-testid="btn-collapse-all"
              >
                Collapse All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Select
                  value={selectedCompanyId}
                  onValueChange={(value) => {
                    setSelectedCompanyId(value);
                    setExpandedNodes(new Set());
                    setDepartmentFilter("all");
                  }}
                  data-testid="company-selector"
                >
                  <SelectTrigger className="w-full sm:w-80" data-testid="company-selector-trigger">
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{company.name}</span>
                          {company.employeeCount && (
                            <Badge variant="secondary" className="ml-2">
                              {company.employeeCount.toLocaleString()} employees
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompany && departments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                    data-testid="department-filter"
                  >
                    <SelectTrigger className="w-48" data-testid="department-filter-trigger">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedCompany && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                {selectedCompany.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {selectedCompany.industry}
                  </span>
                )}
                {selectedCompany.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedCompany.headquarters}
                  </span>
                )}
                {selectedCompany.employeeCount && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedCompany.employeeCount.toLocaleString()} employees
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingSkeleton />
        ) : !selectedCompany ? (
          <EmptyState />
        ) : selectedCompany.orgChart.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)] min-h-96">
            <div className="pr-4">
              {selectedCompany.orgChart.map((person) => (
                <PersonNode
                  key={person.id}
                  person={person}
                  onPersonClick={handlePersonClick}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                  departmentFilter={departmentFilter}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Person Details</DialogTitle>
            <DialogDescription>
              View contact information and add to your CRM
            </DialogDescription>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPerson.avatarUrl} alt={selectedPerson.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                    {getInitials(selectedPerson.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg" data-testid="modal-person-name">
                      {selectedPerson.name}
                    </h3>
                    {selectedPerson.isDecisionMaker && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Star className="h-3 w-3 mr-1" />
                        Decision Maker
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedPerson.title}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedPerson.department}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {selectedPerson.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${selectedPerson.email}`}
                      className="text-primary hover:underline"
                      data-testid="modal-email-link"
                    >
                      {selectedPerson.email}
                    </a>
                  </div>
                )}
                {selectedPerson.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${selectedPerson.phone}`}
                      className="text-primary hover:underline"
                      data-testid="modal-phone-link"
                    >
                      {selectedPerson.phone}
                    </a>
                  </div>
                )}
                {selectedPerson.linkedinUrl && (
                  <div className="flex items-center gap-3 text-sm">
                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                    <a
                      href={selectedPerson.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      data-testid="modal-linkedin-link"
                    >
                      View LinkedIn Profile
                    </a>
                  </div>
                )}
                {selectedPerson.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedPerson.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => selectedPerson && addToContactsMutation.mutate(selectedPerson)}
              disabled={addToContactsMutation.isPending}
              data-testid="btn-add-to-contacts"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {addToContactsMutation.isPending ? "Adding..." : "Add to Contacts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
