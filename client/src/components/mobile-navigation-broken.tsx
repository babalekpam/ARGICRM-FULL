import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Building2, 
  UserCheck, 
  DollarSign, 
  CheckSquare,
  Mail,
  MessageSquare,
  BarChart3,
  Settings,
  Calendar,
  Ticket,
  FolderOpen,
  UserPlus,
  Calculator,
  BookOpen,
  Shield,
  Zap,
  Brain,
  Target,
  FileText,
  Database,
  Globe,
  Phone,
  Headphones,
  Star,
  TrendingUp,
  Workflow,
  Users2,
  PieChart,
  Briefcase,
  FileSpreadsheet,
  CreditCard,
  Banknote,
  Receipt,
  PiggyBank,
  Layers,
  Archive,
  Package,
  MapPin,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

const navigationItems = (isPlatformOwner: boolean) => [
  {
    category: "Dashboard",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home, permission: "dashboard.read" },
      { name: "AI Autonomous", href: "/ai-autonomous-dashboard", icon: Brain, permission: "ai.read" },
    ]
  },
  {
    category: "CRM",
    items: [
      { name: "Contacts", href: "/contacts", icon: Users, permission: "contacts.read" },
      { name: "Accounts", href: "/accounts", icon: Building2, permission: "accounts.read" },
      { name: "Leads", href: "/leads", icon: UserCheck, permission: "leads.read" },
      { name: "Deals", href: "/deals", icon: DollarSign, permission: "deals.read" },
      { name: "Tasks", href: "/tasks", icon: CheckSquare, permission: "tasks.read" },
    ]
  },
  {
    category: "Marketing",
    items: [
      { name: "Email Marketing", href: "/email-marketing", icon: Mail, permission: "marketing.read" },
      { name: "SMS Marketing", href: "/sms-marketing", icon: MessageSquare, permission: "marketing.read" },
      { name: "Landing Pages", href: "/landing-pages", icon: Globe, permission: "marketing.read" },
      { name: "Campaigns", href: "/campaigns", icon: Target, permission: "marketing.read" },
      { name: "Funnel Builder", href: "/funnel-builder", icon: TrendingUp, permission: "marketing.read" },
    ]
  },
  {
    category: "Analytics",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics.read" },
      { name: "Advanced Analytics", href: "/advanced-analytics", icon: PieChart, permission: "analytics.read" },
      { name: "Reports", href: "/reports", icon: FileText, permission: "reports.read" },
    ]
  },
  {
    category: "Operations",
    items: [
      { name: "Scheduling", href: "/scheduling", icon: Calendar, permission: "scheduling.read" },
      { name: "Support Tickets", href: "/tickets", icon: Ticket, permission: "tickets.read" },
      { name: "Projects", href: "/projects", icon: FolderOpen, permission: "projects.read" },
      { name: "Team Collaboration", href: "/team-collaboration", icon: Users2, permission: "team.read" },
    ]
  },
  {
    category: "Financial",
    items: [
      { name: "Bookkeeping", href: "/bookkeeping", icon: Calculator, permission: "financial.read" },
      { name: "Invoices", href: "/invoices", icon: Receipt, permission: "financial.read" },
      { name: "Tax Settings", href: "/tax-settings", icon: PiggyBank, permission: "financial.read" },
    ]
  },
  {
    category: "Enterprise",
    items: [
      { name: "Advanced Project Mgmt", href: "/advanced-project-management", icon: Briefcase, permission: "enterprise.read" },
      { name: "Enhanced HR", href: "/enhanced-hr-management", icon: UserPlus, permission: "enterprise.read" },
      { name: "Document Management", href: "/document-management", icon: Archive, permission: "enterprise.read" },
      { name: "Inventory Management", href: "/inventory-management", icon: Package, permission: "enterprise.read" },
      { name: "Territory Management", href: "/territory-management", icon: MapPin, permission: "enterprise.read" },
    ]
  },
  ...(isPlatformOwner ? [{
    category: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings, permission: "settings.read" },
      { name: "Employees", href: "/employees", icon: Users, permission: "team.read" },
      { name: "Roles & Permissions", href: "/roles", icon: Shield, permission: "admin.read" },
      { name: "Workflows", href: "/workflows", icon: Workflow, permission: "workflows.read" },
    ]
  }] : []),
  ...(isPlatformOwner ? [{
    category: "Administration",
    items: [
      { name: "Admin Dashboard", href: "/admin", icon: Crown, permission: "platform.read" },
      { name: "Platform Settings", href: "/settings", icon: Settings, permission: "platform.read" },
    ]
  }] : [])
];

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Check if user is platform owner - ONLY admin@default.com
  const isPlatformOwner = Boolean(user?.email === 'admin@default.com');

  const filteredItems = navigationItems(isPlatformOwner).map(category => ({
    ...category,
    items: category.items.filter(item => hasPermission(item.permission))
  })).filter(category => category.items.length > 0);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-lg">NODE CRM</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.email || 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role?.replace('_', ' ') || 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-2">
              <div className="space-y-4">
                {filteredItems.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category.category}
                    </h3>
                    <div className="space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  Mobile View
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}