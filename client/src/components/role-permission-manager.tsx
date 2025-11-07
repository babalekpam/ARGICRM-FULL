import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, Plus, Edit, Trash2, Settings } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface PermissionModule {
  id: string;
  name: string;
  description: string;
  actions: string[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  // Core CRM
  {
    id: 'contacts',
    name: 'Contacts',
    description: 'Manage customer contacts and relationships',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Manage company accounts and organizations',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'deals',
    name: 'Deals',
    description: 'Manage sales opportunities and deals',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'leads',
    name: 'Leads',
    description: 'Manage potential customers and prospects',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Manage tasks and follow-ups',
    actions: ['read', 'write', 'delete']
  },
  
  // AI & Emotional Intelligence
  {
    id: 'ai',
    name: 'AI Features',
    description: 'Access AI-powered tools and automation',
    actions: ['read', 'write']
  },
  {
    id: 'emotional-intelligence',
    name: 'Emotional Intelligence',
    description: 'Customer sentiment analysis and emotional profiling',
    actions: ['read', 'write']
  },
  {
    id: 'predictive-analytics',
    name: 'Predictive Analytics',
    description: 'AI-powered predictions and trend analysis',
    actions: ['read', 'write']
  },
  {
    id: 'ai-autonomous',
    name: 'AI Autonomous Operations',
    description: 'Autonomous AI workflows and decision making',
    actions: ['read', 'write']
  },

  // Marketing & Campaigns
  {
    id: 'marketing',
    name: 'Marketing Campaigns',
    description: 'Marketing campaigns and automation',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'Email campaigns and automation',
    actions: ['read', 'write']
  },
  {
    id: 'sms-marketing',
    name: 'SMS Marketing',
    description: 'SMS campaigns and messaging',
    actions: ['read', 'write']
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    description: 'Create and manage landing pages',
    actions: ['read', 'write']
  },
  {
    id: 'funnel-builder',
    name: 'Funnel Builder',
    description: 'Sales funnel creation and optimization',
    actions: ['read', 'write']
  },

  // E-commerce & Store Management
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online store and product management',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Stock control and inventory tracking',
    actions: ['read', 'write']
  },
  {
    id: 'orders',
    name: 'Order Management',
    description: 'Process and manage customer orders',
    actions: ['read', 'write']
  },
  {
    id: 'store-builder',
    name: 'Store Builder',
    description: 'Build and customize online stores',
    actions: ['read', 'write']
  },

  // Analytics & Reports
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business analytics and insights',
    actions: ['read', 'write']
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Generate business reports and dashboards',
    actions: ['read', 'write']
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep business intelligence and custom analytics',
    actions: ['read', 'write']
  },

  // Financial Management
  {
    id: 'bookkeeping',
    name: 'Bookkeeping',
    description: 'Financial records and accounting',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'Invoice creation and management',
    actions: ['read', 'write']
  },
  {
    id: 'tax-settings',
    name: 'Tax Settings',
    description: 'Tax configuration and compliance',
    actions: ['read', 'write']
  },

  // Operations & Team
  {
    id: 'team',
    name: 'Team Management',
    description: 'Team collaboration and communication',
    actions: ['read', 'write']
  },
  {
    id: 'employees',
    name: 'Employee Management',
    description: 'HR and employee administration',
    actions: ['read', 'write']
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Calendar and appointment management',
    actions: ['read', 'write']
  },
  {
    id: 'projects',
    name: 'Project Management',
    description: 'Project tracking and collaboration',
    actions: ['read', 'write']
  },
  {
    id: 'tickets',
    name: 'Support Tickets',
    description: 'Customer support and helpdesk',
    actions: ['read', 'write']
  },

  // Workflows & Automation
  {
    id: 'workflows',
    name: 'Workflows',
    description: 'Business process automation',
    actions: ['read', 'write', 'delete']
  },
  {
    id: 'automation',
    name: 'Advanced Automation',
    description: 'Complex automation and integrations',
    actions: ['read', 'write']
  },

  // Security & Compliance
  {
    id: 'security',
    name: 'Security',
    description: 'Security monitoring and threat protection',
    actions: ['read', 'write']
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Regulatory compliance and audit trails',
    actions: ['read', 'write']
  },
  {
    id: 'audit',
    name: 'Audit Logs',
    description: 'System audit and activity monitoring',
    actions: ['read']
  },

  // Administration
  {
    id: 'admin',
    name: 'Administration',
    description: 'System administration and configuration',
    actions: ['read', 'write']
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Application settings and preferences',
    actions: ['read', 'write']
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    description: 'User role and permission management',
    actions: ['read', 'write']
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'User account management and access control',
    actions: ['read', 'write']
  },

  // Platform Owner Features
  {
    id: 'platform',
    name: 'Platform Management',
    description: 'Platform-wide analytics and management (Platform Owner Only)',
    actions: ['read', 'write']
  },
  {
    id: 'super-admin',
    name: 'Super Admin Dashboard',
    description: 'Full platform administration (Platform Owner Only)',
    actions: ['read']
  },
  {
    id: 'feature-toggles',
    name: 'Feature Toggles',
    description: 'Enable/disable platform features (Platform Owner Only)',
    actions: ['read', 'write']
  }
];

export default function RolePermissionManager() {
  const [activeTab, setActiveTab] = useState("users");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: () => apiRequest("GET", "/api/admin/roles"),
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated successfully" });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return apiRequest("POST", "/api/admin/roles", roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setShowRoleForm(false);
      toast({ title: "Role created successfully" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: any) => {
      return apiRequest("PUT", `/api/admin/roles/${id}`, roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setEditingRole(null);
      toast({ title: "Role updated successfully" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest("DELETE", `/api/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({ title: "Role deleted successfully" });
    },
  });

  const RoleForm = ({ role, onClose }: { role?: Role; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions || [],
    });

    const handlePermissionToggle = (permissionId: string, checked: boolean) => {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          permissions: [...prev.permissions, permissionId]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          permissions: prev.permissions.filter(p => p !== permissionId)
        }));
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (role) {
        updateRoleMutation.mutate({ id: role.id, ...formData });
      } else {
        createRoleMutation.mutate(formData);
      }
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{role ? "Edit Role" : "Create New Role"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sales Manager"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role and its responsibilities"
              />
            </div>

            <div>
              <Label className="text-base font-semibold">Permissions</Label>
              <p className="text-sm text-gray-600 mb-4">
                Select the features this role can access
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PERMISSION_MODULES.map((module) => (
                  <Card key={module.id} className="p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm">{module.name}</h4>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                    <div className="space-y-2">
                      {module.actions.map((action) => {
                        const permissionId = `${module.id}.${action}`;
                        return (
                          <div key={permissionId} className="flex items-center space-x-2">
                            <Checkbox
                              id={permissionId}
                              checked={formData.permissions.includes(permissionId)}
                              onCheckedChange={(checked) =>
                                handlePermissionToggle(permissionId, !!checked)
                              }
                            />
                            <Label htmlFor={permissionId} className="text-sm">
                              {action === 'read' && 'View'}
                              {action === 'write' && 'Create & Edit'}
                              {action === 'delete' && 'Delete'}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {role ? "Update Role" : "Create Role"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="mr-3 h-6 w-6" />
            Role & Permission Management
          </h1>
          <p className="text-gray-600">
            Easily assign roles to users and manage feature access across your organization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Assignments</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assign Roles to Users</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assign New Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user: User) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === 'platform_owner' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) =>
                              updateUserRoleMutation.mutate({ userId: user.id, role: newRole })
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {roles.map((role: Role) => (
                                <SelectItem key={role.id} value={role.name.toLowerCase()}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Custom Roles</h2>
            <Button onClick={() => setShowRoleForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Role
            </Button>
          </div>

          {showRoleForm && (
            <RoleForm onClose={() => setShowRoleForm(false)} />
          )}

          {editingRole && (
            <RoleForm role={editingRole} onClose={() => setEditingRole(null)} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role: Role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Shield className="mr-2 h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    {role.isSystemRole && (
                      <Badge variant="outline">System</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {role.description || "No description"}
                  </p>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">
                      Permissions ({role.permissions.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 4).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.split('.')[0]}
                        </Badge>
                      ))}
                      {role.permissions.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRole(role)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!role.isSystemRole && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Permission Matrix</h2>
            <p className="text-gray-600 mb-4">
              Overview of all available permissions in the system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PERMISSION_MODULES.map((module) => (
              <Card key={module.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    {module.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Available Actions:</h4>
                    {module.actions.map((action) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {module.id}.{action}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {action === 'read' && 'View data and access pages'}
                          {action === 'write' && 'Create and modify records'}
                          {action === 'delete' && 'Remove records permanently'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}