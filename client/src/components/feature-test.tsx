import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function FeatureTest() {
  const { user } = useAuth();

  const allFeatures = [
    // Core CRM
    { name: "Dashboard", path: "/dashboard", permission: null },
    { name: "Contacts", path: "/contacts", permission: "contacts.read" },
    { name: "Accounts", path: "/accounts", permission: "accounts.read" },
    { name: "Leads", path: "/leads", permission: "leads.read" },
    { name: "Deals", path: "/deals", permission: "deals.read" },
    { name: "Tasks", path: "/tasks", permission: "tasks.read" },
    
    // Sales & Marketing
    { name: "Campaigns", path: "/campaigns", permission: "campaigns.read" },
    { name: "Email Marketing", path: "/email-marketing", permission: "marketing.read" },
    { name: "SMS Marketing", path: "/sms-marketing", permission: "marketing.read" },
    { name: "Funnel Builder", path: "/funnel-builder", permission: "marketing.read" },
    { name: "Landing Pages", path: "/landing-pages", permission: "marketing.read" },
    
    // Analytics & Reports
    { name: "Analytics", path: "/analytics", permission: "analytics.read" },
    { name: "Advanced Analytics", path: "/advanced-analytics", permission: "analytics.read" },
    { name: "Reports", path: "/reports", permission: "reports.read" },
    
    // Operations
    { name: "Scheduling", path: "/scheduling", permission: "scheduling.read" },
    { name: "Support Tickets", path: "/tickets", permission: "support.read" },
    { name: "Projects", path: "/projects", permission: "projects.read" },
    { name: "Team Collaboration", path: "/team-collaboration", permission: "collaboration.read" },
    
    // Financial
    { name: "Invoices", path: "/invoices", permission: "invoices.read" },
    { name: "Bookkeeping", path: "/bookkeeping", permission: "bookkeeping.read" },
    { name: "Tax Settings", path: "/tax-settings", permission: "tax.read" },
    
    // HR & Admin
    { name: "Employees", path: "/employees", permission: "hr.read" },
    { name: "Roles & Permissions", path: "/roles", permission: "admin.read" },
    { name: "Workflows", path: "/workflows", permission: "workflows.read" },
    
    // Intelligence
    { name: "Emotional Intelligence", path: "/sentiment", permission: "sentiment.read" },
    { name: "Unified Inbox", path: "/unified-inbox", permission: "communications.read" },
    { name: "Forms & Surveys", path: "/forms-surveys", permission: "forms.read" },
    { name: "Reputation Management", path: "/reputation-management", permission: "reputation.read" },
    
    // Security
    { name: "Security", path: "/security", permission: "security.read" },
  ];

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (user?.role === "platform_owner") return true;
    return user?.permissions?.includes(permission) || false;
  };

  const accessibleFeatures = allFeatures.filter(feature => hasPermission(feature.permission));
  const blockedFeatures = allFeatures.filter(feature => !hasPermission(feature.permission));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Feature Access Test
          <Badge variant={user?.role === "platform_owner" ? "default" : "secondary"}>
            {user?.role || "No Role"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-green-600 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Accessible Features ({accessibleFeatures.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {accessibleFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">{feature.name}</span>
                  <a 
                    href={feature.path} 
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = feature.path;
                    }}
                  >
                    Visit
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-red-600 mb-3 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Blocked Features ({blockedFeatures.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {blockedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm text-gray-600">{feature.name}</span>
                  <span className="text-xs text-red-600">
                    {feature.permission || "Admin Only"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-800 mb-2">User Details:</h4>
          <div className="text-sm text-blue-700">
            <p>Email: {user?.email}</p>
            <p>Welcome to ARGILETTE CRM</p>
            <p>Dashboard Status: Active</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}