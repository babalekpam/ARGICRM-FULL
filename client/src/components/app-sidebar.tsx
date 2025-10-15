import {
  BarChart3,
  Search,
  Activity,
  TrendingUp,
  AlertCircle,
  Link as LinkIcon,
  Link2,
  Users,
  LayoutDashboard,
  Sparkles,
  CreditCard,
  FileText,
  Gauge,
  ClipboardList,
  Key,
  MapPin,
  Share2,
  Shield,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import type { User } from "@shared/schema";

const navigation = [
  { titleKey: "sidebar.dashboard", url: "/", icon: LayoutDashboard },
  { titleKey: "sidebar.keywordResearch", url: "/keywords", icon: Search },
  { titleKey: "sidebar.rankTracking", url: "/rank-tracking", icon: Activity },
  { titleKey: "sidebar.contentTools", url: "/content-tools", icon: FileText },
  { titleKey: "sidebar.trafficAnalyzer", url: "/traffic", icon: TrendingUp },
  { titleKey: "sidebar.seoAudit", url: "/seo-audit", icon: AlertCircle },
  { titleKey: "sidebar.technicalAudit", url: "/technical-audit", icon: Gauge },
  { titleKey: "sidebar.automatedReports", url: "/automated-reports", icon: ClipboardList },
  { titleKey: "sidebar.backlinks", url: "/backlinks", icon: LinkIcon },
  { titleKey: "sidebar.linkBuilding", url: "/link-building", icon: Link2 },
  { titleKey: "sidebar.competitors", url: "/competitors", icon: Users },
  { titleKey: "sidebar.localSEO", url: "/local-seo", icon: MapPin },
  { titleKey: "sidebar.socialMedia", url: "/social-media", icon: Share2 },
  { titleKey: "sidebar.aiAssistant", url: "/ai-assistant", icon: Sparkles },
];

const accountNav = [
  { titleKey: "sidebar.apiAccess", url: "/api-access", icon: Key },
  { titleKey: "sidebar.pricingPlans", url: "/pricing", icon: CreditCard },
];

interface AppSidebarProps {
  user?: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">ARGILETTE</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.analytics')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location === item.url;
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.titleKey.split('.')[1]}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.account')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => {
                const isActive = location === item.url;
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.titleKey.split('.')[1]}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('sidebar.admin')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === '/admin'} data-testid="nav-admin-dashboard">
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>{t('sidebar.adminDashboard')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground">
          © 2025 ARGILETTE
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
