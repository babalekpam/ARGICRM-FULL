import { Link, useLocation } from "wouter";
import { 
  CheckCircle,
  Settings,
  Target,
  GitBranch,
  TrendingUp,
  Eye,
  Terminal,
  MapPin,
  Link2,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SeoLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const seoTabs = [
  { path: "/seo-audit", label: "SEO Audit", icon: CheckCircle },
  { path: "/seo-management", label: "SEO Management", icon: Settings },
  { path: "/keywords", label: "Keywords", icon: Target },
  { path: "/backlinks", label: "Backlinks", icon: GitBranch },
  { path: "/rank-tracking", label: "Rank Tracking", icon: TrendingUp },
  { path: "/competitors", label: "Competitors", icon: Eye },
  { path: "/technical-audit", label: "Technical SEO", icon: Terminal },
  { path: "/local-seo", label: "Local SEO", icon: MapPin },
  { path: "/link-building", label: "Link Building", icon: Link2 },
  { path: "/multi-platform-search", label: "Multi-Platform Search", icon: Brain },
];

export default function SeoLayout({ children, title }: SeoLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full" data-testid="seo-layout">
      {/* Header with title */}
      {title && (
        <div className="px-6 py-4 border-b bg-card">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
      )}

      {/* Horizontal Tabs Navigation */}
      <div className="border-b bg-background">
        <div className="flex gap-1 px-6 overflow-x-auto scrollbar-hide">
          {seoTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location === tab.path;

            return (
              <a
                key={tab.path}
                href={tab.path}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', tab.path);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer no-underline",
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
                data-testid={`seo-tab-${tab.path.replace('/', '')}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
