import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { saasFeatures } from "@/services/saas-features";
import { useAuth } from "@/hooks/useAuth";
import { BrandedLogo } from "./branded-logo";
import { LanguageSelector } from "./LanguageSelector";
import { useOffline } from "@/hooks/useOffline";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserCheck, 
  Handshake, 
  CheckSquare,
  CheckCircle,
  Crown,
  Settings,
  LogOut,
  Mail,
  MessageSquare,
  TrendingUp,
  BarChart3,
  FileText,
  Eye,
  Calendar,
  Ticket,
  FolderOpen,
  Receipt,
  UserPlus,
  Shield,
  Lock,
  DollarSign,
  Brain,
  Bot,
  Kanban,
  Package,
  MapPin,
  Zap,
  User,
  Mic,
  Bug,
  TestTube,
  Target,
  Activity,
  GitBranch,
  Terminal,
  Store,
  Heart,
  Scale,
  Wifi,
  WifiOff,
  Download,
  ChevronDown,
  ChevronRight,
  Briefcase,
  ShoppingCart,
  PieChart,
  Cog,
  DollarSign as FinanceIcon,
  UserCog,
  Sparkles
} from "lucide-react";

interface NavigationProps {
  onLogout?: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { status, downloadForOffline } = useOffline();
  const { toast } = useToast();

  // State for managing collapsed/expanded sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const isActive = (path: string) => location.pathname === path;
  
  const toggleSection = (sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionKey)) {
      newCollapsed.delete(sectionKey);
    } else {
      newCollapsed.add(sectionKey);
    }
    setCollapsedSections(newCollapsed);
  };
  
  // Check if user is platform owner - ONLY abel@argilette.com or admin@default.com
  const isPlatformOwner = Boolean(user?.email === 'abel@argilette.com' || user?.email === 'admin@default.com');

  // Define navigation groups with icons and modules
  const dashboardPath = isPlatformOwner ? "/super-admin-dashboard" : "/user-dashboard";
  
  const navigationGroups = [
    {
      key: "core",
      title: "Core CRM",
      icon: LayoutDashboard,
      description: "Essential CRM functionality",
      modules: [
        { path: dashboardPath, label: "Dashboard", icon: LayoutDashboard, permission: null },
        { path: "/contacts", label: "Contacts", icon: Users, permission: "contacts.read" },
        { path: "/accounts", label: "Companies", icon: Building2, permission: "accounts.read" },
        { path: "/leads", label: "Leads", icon: UserCheck, permission: "leads.read" },
        { path: "/deals", label: "Deals", icon: Handshake, permission: "deals.read" },
        { path: "/tasks", label: "Tasks", icon: CheckSquare, permission: "tasks.read" },
        { path: "/scheduling", label: "Calendar", icon: Calendar, permission: "scheduling.read" },
      ]
    },
    {
      key: "marketing",
      title: "Marketing & Sales",
      icon: ShoppingCart,
      description: "Marketing campaigns and e-commerce",
      modules: [
        { path: "/simple-messaging", label: "Simple Messaging", icon: Mail, permission: "campaigns.read" },
        { path: "/funnel-builder", label: "Funnel Builder", icon: TrendingUp, permission: "marketing.read" },
        { path: "/sales-channels", label: "Sales Channels", icon: Target, permission: "marketing.read" },
        { path: "/e-commerce-dashboard", label: "E-commerce Store", icon: Store, permission: "inventory.read" },
      ]
    },
    {
      key: "analytics", 
      title: "Analytics & Reports",
      icon: PieChart,
      description: "Data insights and reporting",
      modules: [
        { path: "/analytics", label: "Analytics & Reports", icon: BarChart3, permission: "analytics.read" },
        { path: "/advanced-analytics", label: "Advanced Analytics", icon: TrendingUp, permission: "analytics.read" },
      ]
    },
    {
      key: "operations",
      title: "Operations",
      icon: Briefcase,
      description: "Project management and support",
      modules: [
        { path: "/projects", label: "Project Management", icon: Kanban, permission: "projects.read" },
        { path: "/tickets", label: "Support Tickets", icon: Ticket, permission: "support.read" },
        { path: "/team-collaboration", label: "Team Collaboration", icon: Users, permission: "collaboration.read" },
        { path: "/inventory-management", label: "Inventory & Orders", icon: Package, permission: "inventory.read" },
        { path: "/document-management", label: "Documents", icon: FileText, permission: "documents.read" },
      ]
    },
    {
      key: "financial",
      title: "Financial",
      icon: FinanceIcon,
      description: "Invoicing and bookkeeping",
      modules: [
        { path: "/invoices", label: "Invoices", icon: Receipt, permission: "invoices.read" },
        { path: "/bookkeeping", label: "Bookkeeping", icon: DollarSign, permission: "bookkeeping.read" },
        { path: "/tax-settings", label: "Tax Settings", icon: FileText, permission: "tax.read" },
      ]
    },
    {
      key: "hr",
      title: "Team & HR",
      icon: UserCog,
      description: "Team management and administration",
      modules: [
        { path: "/employees", label: "Team Management", icon: UserPlus, permission: "hr.read" },
        { path: "/roles", label: "Roles & Permissions", icon: Shield, permission: "admin.read" },
      ]
    },
    {
      key: "intelligence",
      title: "AI & Intelligence",
      icon: Sparkles,
      description: "AI-powered features and insights",
      modules: [
        { path: "/ai-campaign-studio", label: "AI Campaign Studio", icon: Sparkles, permission: "ai.read" },
        { path: "/cloe-ai-agent", label: "Cloe AI Agent", icon: Bot, permission: "ai.read" },
        { path: "/ai-autonomous", label: "AI Automation", icon: Brain, permission: "sentiment.read" },
        { path: "/sentiment", label: "Sentiment Analysis", icon: MessageSquare, permission: "sentiment.read" },
        { path: "/unified-inbox", label: "Unified Communications", icon: Mail, permission: "communications.read" },
        { path: "/forms-surveys", label: "Forms & Surveys", icon: FileText, permission: "forms.read" },
      ]
    },
    {
      key: "seo",
      title: "ARGILETTE SEO",
      icon: TrendingUp,
      description: "Complete SEO & backlink analysis platform",
      modules: [
        { path: "/seo-audit", label: "SEO Audit", icon: CheckCircle, permission: "seo.read" },
        { path: "/seo-management", label: "SEO Management", icon: Settings, permission: "seo.read" },
        { path: "/keywords", label: "Keyword Research", icon: Target, permission: "seo.read" },
        { path: "/backlinks", label: "Backlink Monitoring", icon: GitBranch, permission: "seo.read" },
        { path: "/rank-tracking", label: "Rank Tracking", icon: TrendingUp, permission: "seo.read" },
        { path: "/competitors", label: "Competitor Analysis", icon: Eye, permission: "seo.read" },
        { path: "/technical-audit", label: "Technical SEO", icon: Terminal, permission: "seo.read" },
        { path: "/local-seo", label: "Local SEO", icon: MapPin, permission: "seo.read" },
      ]
    }
  ];

  // Add Admin group for platform owners
  if (isPlatformOwner) {
    navigationGroups.push({
      key: "admin",
      title: "Platform Administration",
      icon: Crown,
      description: "Platform management and administration",
      modules: [
        { path: "/super-admin-dashboard", label: "Super Admin Dashboard", icon: Crown, permission: "platform.read" },
        { path: "/integrity-dashboard", label: "Platform Integrity", icon: CheckCircle, permission: "platform.read" },
        { path: "/performance-dashboard", label: "Performance Dashboard", icon: TrendingUp, permission: "platform.read" },
        { path: "/testing-deployment", label: "Testing & Deployment", icon: TestTube, permission: "platform.read" },
        { path: "/bug-resolution", label: "Bug Resolution", icon: Bug, permission: "platform.read" },
        { path: "/feature-toggles", label: "Feature Toggles", icon: Zap, permission: "admin.read" },
        { path: "/white-label-settings", label: "White Label Settings", icon: Crown, permission: "platform.read" },
        { path: "/settings", label: "Platform Settings", icon: Settings, permission: "platform.*" },
      ]
    });
  }
  
  // Always add Settings group for all users
  navigationGroups.push({
    key: "settings",
    title: "Settings & Account",
    icon: Cog,
    description: "Personal settings and account management",
    modules: [
      { path: "/terms-of-service", label: "Terms of Service", icon: Scale, permission: null },
      { path: "/account-settings", label: "Account Settings", icon: User, permission: "" },
    ]
  });

  const hasPermission = (permission: string | null, requiredRole?: string) => {
    return true;
  };

  const renderCollapsibleGroup = (group: any) => {
    const isCollapsed = collapsedSections.has(group.key);
    const visibleModules = group.modules;
    const GroupIcon = group.icon;
    
    // Check if any item in this group is currently active
    const hasActiveItem = visibleModules.some((item: any) => isActive(item.path));
    
    if (visibleModules.length === 0) return null;

    return (
      <div key={group.key} className="mb-3">
        {/* Group Header - Clickable to toggle */}
        <button
          onClick={() => toggleSection(group.key)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 group hover:shadow-md",
            hasActiveItem
              ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200"
              : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
          aria-expanded={!isCollapsed}
          data-testid={`nav-group-${group.key}`}
        >
          <div className="flex items-center">
            <GroupIcon className={cn(
              "mr-3 h-4 w-4 transition-all duration-200",
              hasActiveItem ? "text-blue-600 scale-110" : "group-hover:scale-110"
            )} />
            <div className="text-left">
              <div className="font-semibold">{group.title}</div>
              <div className="text-xs opacity-70 font-normal">{group.description}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full font-medium">
              {visibleModules.length}
            </div>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
        )}>
          <div className="mt-2 ml-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
            {visibleModules.map((item: any) => {
              const Icon = item.icon;
              const canAccess = saasFeatures.canAccessFeature(item.path);
              
              // Core CRM features and platform admin features should always be accessible
              const coreFeatures = ['/dashboard', '/contacts', '/accounts', '/leads', '/deals', '/tasks', '/calendar', '/analytics', '/simple-messaging', '/funnel-builder', '/sales-channels', '/e-commerce-dashboard'];
              const platformFeatures = ['/admin-dashboard', '/super-admin-dashboard', '/integrity-dashboard', '/performance-dashboard'];
              const isCore = coreFeatures.includes(item.path) || platformFeatures.includes(item.path);
              
              if (!canAccess && !isCore) {
                return (
                  <div
                    key={item.path}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed relative"
                    data-testid={`nav-item-${item.path.replace('/', '')}-locked`}
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-1">{item.label}</span>
                    <Lock className="h-3 w-3 ml-2" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      Upgrade to access this feature
                    </div>
                  </div>
                );
              }
              
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                  role="menuitem"
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  data-testid={`nav-item-${item.path.replace('/', '')}`}
                >
                  <Icon className={cn(
                    "mr-3 h-4 w-4 flex-shrink-0 transition-transform duration-200",
                    isActive(item.path) ? "text-white scale-110" : "group-hover:scale-110"
                  )} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-80"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav 
      id="main-navigation"
      className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md dark:bg-slate-900/95 shadow-2xl border-r border-slate-200/60 dark:border-slate-700/60 overflow-y-auto z-30"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center">
            <div className="relative">
              <BrandedLogo />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NODE CRM
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enterprise AI Platform
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">All Systems Operational</span>
          </div>
        </div>
        
        <div className="flex-1 px-2 py-4 space-y-4">
          {/* Render all navigation groups */}
          {navigationGroups.map((group) => renderCollapsibleGroup(group))}
        </div>

        {/* Offline Status Section */}
        {status.isInitialized && (
          <div className="border-t p-2 space-y-2">
            <div className="px-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Connection Status
              </div>
              <div className="space-y-2">
                {/* Connection Status */}
                <div className="flex items-center justify-between px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    {status.isOnline ? (
                      <Wifi className="h-3 w-3 text-green-600" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-xs font-medium">
                      {status.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  {status.hasOfflineData && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>

                {/* Download for Offline Button */}
                {status.isOnline && (
                  <Button
                    onClick={async () => {
                      const success = await downloadForOffline();
                      toast({
                        title: success ? "Offline Data Downloaded" : "Download Failed",
                        description: success 
                          ? "Your data is now available offline"
                          : "Failed to download data for offline use",
                        variant: success ? "default" : "destructive",
                      });
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full text-xs py-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    {status.hasOfflineData ? "Update Offline" : "Download Offline"}
                  </Button>
                )}

                {/* Offline Status Message */}
                {!status.isOnline && status.hasOfflineData && (
                  <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                    Working offline mode
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Actions */}
        <div className="border-t p-2 space-y-2">
          {/* Language Selector */}
          <div className="px-2">
            <LanguageSelector variant="compact" showLabel={false} />
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}