import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "./LanguageSelector";
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
  Crown,
  Terminal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Check if user is platform owner - ONLY abel@argilette.com
  const isPlatformOwner = Boolean(user?.email === 'abel@argilette.com');

  const navigationItems = [
    {
      category: "Core CRM",
      items: [
        { name: "Dashboard", href: isPlatformOwner ? "/dashboard" : "/user-dashboard", icon: Home, permission: "dashboard.read" },
        { name: "Contacts", href: "/contacts", icon: Users, permission: "contacts.read" },
        { name: "Companies", href: "/accounts", icon: Building2, permission: "accounts.read" },
        { name: "Leads", href: "/leads", icon: UserCheck, permission: "leads.read" },
        { name: "Deals", href: "/deals", icon: DollarSign, permission: "deals.read" },
        { name: "Tasks", href: "/tasks", icon: CheckSquare, permission: "tasks.read" },
        { name: "Calendar", href: "/scheduling", icon: Calendar, permission: "scheduling.read" },
      ]
    },
    {
      category: "Marketing & E-commerce",
      items: [
        { name: "Simple Messaging", href: "/simple-messaging", icon: Mail, permission: "campaigns.read" },
        { name: "Funnel Builder", href: "/funnel-builder", icon: TrendingUp, permission: "marketing.read" },
        { name: "Sales Channels", href: "/sales-channels", icon: Target, permission: "marketing.read" },
        { name: "E-commerce Store", href: "/e-commerce-dashboard", icon: Package, permission: "inventory.read" },
      ]
    },
    {
      category: "Analytics & Reports",
      items: [
        { name: "Analytics & Reports", href: "/analytics", icon: BarChart3, permission: "analytics.read" },
        { name: "Advanced Analytics", href: "/advanced-analytics", icon: PieChart, permission: "analytics.read" },
      ]
    },
    {
      category: "Operations & Support",
      items: [
        { name: "Project Management", href: "/projects", icon: FolderOpen, permission: "projects.read" },
        { name: "Support Tickets", href: "/tickets", icon: Ticket, permission: "tickets.read" },
        { name: "Team Collaboration", href: "/team-collaboration", icon: Users2, permission: "team.read" },
        { name: "Inventory & Orders", href: "/inventory-management", icon: Package, permission: "inventory.read" },
        { name: "Documents", href: "/document-management", icon: Archive, permission: "documents.read" },
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
      category: "Team & Administration",
      items: [
        { name: "Team Management", href: "/employees", icon: UserPlus, permission: "hr.read" },
        { name: "Roles & Permissions", href: "/roles", icon: Shield, permission: "admin.read" },
      ]
    },
    {
      category: "AI & Intelligence",
      items: [
        { name: "AI Automation", href: "/ai-autonomous", icon: Brain, permission: "sentiment.read" },
        { name: "Sentiment Analysis", href: "/sentiment", icon: Brain, permission: "sentiment.read" },
        { name: "Unified Communications", href: "/unified-inbox", icon: Mail, permission: "communications.read" },
        { name: "Forms & Surveys", href: "/forms-surveys", icon: FileText, permission: "forms.read" },
      ]
    },
    // Platform Administration - Only for Platform Owners
    ...(isPlatformOwner ? [{
      category: "Platform Administration",
      items: [
        { name: "Admin Dashboard", href: "/admin-dashboard", icon: Crown, permission: "admin.read" },
        { name: "Platform Settings", href: "/settings", icon: Settings, permission: "platform.read" },
      ]
    }] : [])
  ];

  const filteredItems = navigationItems.map(category => ({
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
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {filteredItems.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {category.category}
                    </h4>
                    <div className="space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        
                        return (
                          <Link key={item.href} href={item.href}>
                            <div
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              onClick={() => setOpen(false)}
                            >
                              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Language Selector */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Language
                  </h4>
                  <LanguageSelector variant="compact" showLabel={false} />
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}