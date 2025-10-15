import Layout from "@/components/layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Shield, Users2, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

const availablePermissions = [
  // Core CRM
  { id: "contacts.read", label: "View Contacts", category: "Core CRM" },
  { id: "contacts.write", label: "Create & Edit Contacts", category: "Core CRM" },
  { id: "contacts.delete", label: "Delete Contacts", category: "Core CRM" },
  { id: "accounts.read", label: "View Accounts", category: "Core CRM" },
  { id: "accounts.write", label: "Create & Edit Accounts", category: "Core CRM" },
  { id: "accounts.delete", label: "Delete Accounts", category: "Core CRM" },
  { id: "deals.read", label: "View Deals", category: "Core CRM" },
  { id: "deals.write", label: "Create & Edit Deals", category: "Core CRM" },
  { id: "deals.delete", label: "Delete Deals", category: "Core CRM" },
  { id: "leads.read", label: "View Leads", category: "Core CRM" },
  { id: "leads.write", label: "Create & Edit Leads", category: "Core CRM" },
  { id: "leads.delete", label: "Delete Leads", category: "Core CRM" },
  { id: "tasks.read", label: "View Tasks", category: "Core CRM" },
  { id: "tasks.write", label: "Create & Edit Tasks", category: "Core CRM" },
  { id: "tasks.delete", label: "Delete Tasks", category: "Core CRM" },

  // Marketing & Campaigns
  { id: "marketing.read", label: "View Marketing", category: "Marketing" },
  { id: "marketing.write", label: "Create & Edit Campaigns", category: "Marketing" },
  { id: "marketing.delete", label: "Delete Campaigns", category: "Marketing" },
  { id: "email-marketing.read", label: "View Email Marketing", category: "Marketing" },
  { id: "email-marketing.write", label: "Create Email Campaigns", category: "Marketing" },
  { id: "sms-marketing.read", label: "View SMS Marketing", category: "Marketing" },
  { id: "sms-marketing.write", label: "Create SMS Campaigns", category: "Marketing" },
  { id: "landing-pages.read", label: "View Landing Pages", category: "Marketing" },
  { id: "landing-pages.write", label: "Create Landing Pages", category: "Marketing" },
  { id: "funnel-builder.read", label: "View Funnels", category: "Marketing" },
  { id: "funnel-builder.write", label: "Create & Edit Funnels", category: "Marketing" },

  // AI & Emotional Intelligence
  { id: "ai.read", label: "View AI Features", category: "AI & Intelligence" },
  { id: "ai.write", label: "Configure AI Settings", category: "AI & Intelligence" },
  { id: "emotional-intelligence.read", label: "View Emotional Analytics", category: "AI & Intelligence" },
  { id: "emotional-intelligence.write", label: "Manage Emotional Profiles", category: "AI & Intelligence" },
  { id: "predictive-analytics.read", label: "View Predictions", category: "AI & Intelligence" },
  { id: "predictive-analytics.write", label: "Configure Predictions", category: "AI & Intelligence" },
  { id: "ai-autonomous.read", label: "View AI Autonomous", category: "AI & Intelligence" },
  { id: "ai-autonomous.write", label: "Configure AI Automation", category: "AI & Intelligence" },

  // E-commerce & Store Management
  { id: "ecommerce.read", label: "View E-commerce", category: "E-commerce" },
  { id: "ecommerce.write", label: "Manage Products & Store", category: "E-commerce" },
  { id: "ecommerce.delete", label: "Delete Products", category: "E-commerce" },
  { id: "inventory.read", label: "View Inventory", category: "E-commerce" },
  { id: "inventory.write", label: "Manage Inventory", category: "E-commerce" },
  { id: "orders.read", label: "View Orders", category: "E-commerce" },
  { id: "orders.write", label: "Process Orders", category: "E-commerce" },
  { id: "store-builder.read", label: "View Store Builder", category: "E-commerce" },
  { id: "store-builder.write", label: "Build & Customize Store", category: "E-commerce" },

  // Analytics & Reports
  { id: "analytics.read", label: "View Analytics", category: "Analytics & Reports" },
  { id: "analytics.write", label: "Create Custom Reports", category: "Analytics & Reports" },
  { id: "reports.read", label: "View Reports", category: "Analytics & Reports" },
  { id: "reports.write", label: "Create Reports", category: "Analytics & Reports" },
  { id: "advanced-analytics.read", label: "View Advanced Analytics", category: "Analytics & Reports" },
  { id: "advanced-analytics.write", label: "Configure Advanced Analytics", category: "Analytics & Reports" },
  { id: "dashboard.read", label: "View Dashboard", category: "Analytics & Reports" },
  { id: "dashboard.write", label: "Customize Dashboard", category: "Analytics & Reports" },

  // Financial Management
  { id: "bookkeeping.read", label: "View Financial Data", category: "Financial" },
  { id: "bookkeeping.write", label: "Manage Finances", category: "Financial" },
  { id: "bookkeeping.delete", label: "Delete Financial Records", category: "Financial" },
  { id: "invoices.read", label: "View Invoices", category: "Financial" },
  { id: "invoices.write", label: "Create & Edit Invoices", category: "Financial" },
  { id: "tax-settings.read", label: "View Tax Settings", category: "Financial" },
  { id: "tax-settings.write", label: "Configure Tax Settings", category: "Financial" },

  // Operations & Team
  { id: "team.read", label: "View Team", category: "Operations" },
  { id: "team.write", label: "Manage Team Members", category: "Operations" },
  { id: "employees.read", label: "View Employees", category: "Operations" },
  { id: "employees.write", label: "Manage Employees", category: "Operations" },
  { id: "scheduling.read", label: "View Scheduling", category: "Operations" },
  { id: "scheduling.write", label: "Manage Schedules", category: "Operations" },
  { id: "projects.read", label: "View Projects", category: "Operations" },
  { id: "projects.write", label: "Manage Projects", category: "Operations" },
  { id: "tickets.read", label: "View Support Tickets", category: "Operations" },
  { id: "tickets.write", label: "Manage Support Tickets", category: "Operations" },

  // Workflows & Automation
  { id: "workflows.read", label: "View Workflows", category: "Automation" },
  { id: "workflows.write", label: "Create & Edit Workflows", category: "Automation" },
  { id: "workflows.delete", label: "Delete Workflows", category: "Automation" },
  { id: "automation.read", label: "View Automation", category: "Automation" },
  { id: "automation.write", label: "Configure Automation", category: "Automation" },

  // Data Security & Compliance
  { id: "compliance.read", label: "View Compliance", category: "Data Security" },
  { id: "compliance.write", label: "Manage Compliance", category: "Data Security" },
  { id: "audit.read", label: "View Audit Logs", category: "Data Security" },

  // Administration
  { id: "admin.read", label: "View Admin Panel", category: "Administration" },
  { id: "admin.write", label: "System Administration", category: "Administration" },
  { id: "settings.read", label: "View Settings", category: "Administration" },
  { id: "settings.write", label: "Manage Settings", category: "Administration" },
  { id: "roles.read", label: "View Roles", category: "Administration" },
  { id: "roles.write", label: "Manage Roles & Permissions", category: "Administration" },
  { id: "users.read", label: "View Users", category: "Administration" },
  { id: "users.write", label: "Manage Users", category: "Administration" },

  // Platform Owner Only
  { id: "platform.read", label: "Platform Analytics", category: "Platform Owner" },
  { id: "platform.write", label: "Platform Management", category: "Platform Owner" },
  { id: "super-admin.read", label: "Super Admin Dashboard", category: "Platform Owner" },
  { id: "feature-toggles.read", label: "Feature Toggles", category: "Platform Owner" },
  { id: "feature-toggles.write", label: "Manage Feature Toggles", category: "Platform Owner" },
];

const permissionCategories = Array.from(new Set(availablePermissions.map(p => p.category)));

// Pre-defined role templates aligned with platform features
const roleTemplates = [
  {
    name: "Sales Manager",
    description: "Full access to CRM, deals, and sales analytics",
    permissions: [
      "contacts.read", "contacts.write", "contacts.delete",
      "accounts.read", "accounts.write", "accounts.delete", 
      "deals.read", "deals.write", "deals.delete",
      "leads.read", "leads.write", "leads.delete",
      "tasks.read", "tasks.write", "tasks.delete",
      "analytics.read", "reports.read",
      "emotional-intelligence.read", "predictive-analytics.read"
    ]
  },
  {
    name: "Marketing Specialist",
    description: "Marketing campaigns, automation, and customer insights",
    permissions: [
      "contacts.read", "leads.read", "leads.write",
      "marketing.read", "marketing.write", "marketing.delete",
      "email-marketing.read", "email-marketing.write",
      "sms-marketing.read", "sms-marketing.write",
      "landing-pages.read", "landing-pages.write",
      "funnel-builder.read", "funnel-builder.write",
      "analytics.read", "reports.read",
      "ai.read", "emotional-intelligence.read"
    ]
  },
  {
    name: "E-commerce Manager",
    description: "Full e-commerce and inventory management access",
    permissions: [
      "ecommerce.read", "ecommerce.write", "ecommerce.delete",
      "inventory.read", "inventory.write",
      "orders.read", "orders.write",
      "store-builder.read", "store-builder.write",
      "analytics.read", "reports.read",
      "contacts.read", "leads.read"
    ]
  },
  {
    name: "Financial Analyst",
    description: "Financial management and reporting capabilities",
    permissions: [
      "bookkeeping.read", "bookkeeping.write", "bookkeeping.delete",
      "invoices.read", "invoices.write",
      "tax-settings.read", "tax-settings.write",
      "analytics.read", "advanced-analytics.read",
      "reports.read", "reports.write",
      "contacts.read", "accounts.read"
    ]
  },
  {
    name: "Operations Manager",
    description: "Team, projects, and operational oversight",
    permissions: [
      "team.read", "team.write",
      "employees.read", "employees.write", 
      "projects.read", "projects.write",
      "tickets.read", "tickets.write",
      "scheduling.read", "scheduling.write",
      "workflows.read", "workflows.write",
      "analytics.read", "reports.read"
    ]
  },
  {
    name: "AI Specialist",
    description: "AI features and emotional intelligence access",
    permissions: [
      "ai.read", "ai.write",
      "emotional-intelligence.read", "emotional-intelligence.write",
      "predictive-analytics.read", "predictive-analytics.write",
      "ai-autonomous.read", "ai-autonomous.write",
      "automation.read", "automation.write",
      "workflows.read", "workflows.write",
      "analytics.read", "advanced-analytics.read"
    ]
  },
  {
    name: "Customer Support",
    description: "Customer service and support capabilities",
    permissions: [
      "contacts.read", "contacts.write",
      "tickets.read", "tickets.write",
      "tasks.read", "tasks.write",
      "emotional-intelligence.read",
      "scheduling.read", "scheduling.write",
      "analytics.read"
    ]
  },
  {
    name: "Compliance Analyst",
    description: "Compliance monitoring and audit access",
    permissions: [
      "compliance.read", "compliance.write",
      "audit.read",
      "admin.read",
      "analytics.read", "reports.read"
    ]
  },
  {
    name: "Business Analyst",
    description: "Analytics and reporting focus",
    permissions: [
      "analytics.read", "analytics.write",
      "advanced-analytics.read", "advanced-analytics.write", 
      "reports.read", "reports.write",
      "predictive-analytics.read",
      "contacts.read", "accounts.read", "deals.read",
      "emotional-intelligence.read"
    ]
  },
  {
    name: "Admin",
    description: "Full system administration access",
    permissions: [
      "admin.read", "admin.write",
      "settings.read", "settings.write",
      "roles.read", "roles.write",
      "users.read", "users.write",
      "compliance.read",
      "analytics.read", "reports.read"
    ]
  }
];

export default function RolesPage() {
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: async () => {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json() as Promise<Role[]>;
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowRoleForm(false);
      setFormData({ name: "", description: "", permissions: [] });
      toast({ title: "Role created successfully" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete role");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate(formData);
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleTemplateSelect = (template: typeof roleTemplates[0]) => {
    setFormData({
      name: template.name,
      description: template.description,
      permissions: template.permissions
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Roles & Permissions
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage user roles and access permissions for your NODE CRM platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                {availablePermissions.length} Permissions
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                {roleTemplates.length} Templates
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                {permissionCategories.length} Categories
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Users2 className="w-4 h-4 mr-2" />
              Role Templates
            </Button>
            <Button onClick={() => setShowRoleForm(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>

        <div>
          <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Templates Section */}
                <div>
                  <Label className="text-base font-semibold">Quick Start Templates</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Select a pre-configured role template or create a custom role
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                    {roleTemplates.map((template) => (
                      <Button
                        key={template.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-left h-auto p-3"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{template.permissions.length} permissions</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Role Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter role name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this role"
                    />
                  </div>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="mt-4 space-y-6">
                    {permissionCategories.map(category => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availablePermissions
                            .filter(p => p.category === category)
                            .map(permission => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission.id}
                                  checked={formData.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                                />
                                <Label htmlFor={permission.id} className="text-sm">
                                  {permission.label}
                                </Label>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowRoleForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles?.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      {role.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {role.description}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Permissions ({role.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {availablePermissions.find(p => p.id === permission)?.label || permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(role.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No roles created yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create roles to manage user permissions and access control.
              </p>
              <Button onClick={() => setShowRoleForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Role
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}