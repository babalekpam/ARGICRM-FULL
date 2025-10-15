import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import RolePermissionManager from "@/components/role-permission-manager";
import {
  Users,
  Shield,
  Settings,
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  UserPlus,
  Crown
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

interface DashboardStats {
  users: number;
  contacts: number;
  deals: number;
}

const PERMISSION_MODULES = [
  { id: 'contacts', name: 'Contacts', actions: ['read', 'write', 'delete'] },
  { id: 'accounts', name: 'Accounts', actions: ['read', 'write', 'delete'] },
  { id: 'deals', name: 'Deals', actions: ['read', 'write', 'delete'] },
  { id: 'leads', name: 'Leads', actions: ['read', 'write', 'delete'] },
  { id: 'tasks', name: 'Tasks', actions: ['read', 'write', 'delete'] },
  { id: 'reports', name: 'Reports', actions: ['read', 'write'] },
  { id: 'admin', name: 'Administration', actions: ['read', 'write'] },
  { id: 'settings', name: 'Settings', actions: ['read', 'write'] },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/dashboard");
      // Handle different response types
      if (response instanceof Response) {
        return await response.json();
      }
      return response || { stats: { users: 0, contacts: 0, deals: 0 }, recentActivity: [] };
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      // Handle different response types
      if (response instanceof Response) {
        return await response.json() || [];
      }
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/roles");
      // Handle different response types
      if (response instanceof Response) {
        return await response.json() || [];
      }
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/admin/permissions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/permissions");
      // Handle different response types  
      if (response instanceof Response) {
        return await response.json() || [];
      }
      return Array.isArray(response) ? response : [];
    },
  });

  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUserForm(false);
      toast({ title: "User created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
      return apiRequest("PUT", `/api/admin/users/${id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    },
  });

  // Role management mutations
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

  const UserForm = ({ user, onClose }: { user?: User; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      password: "",
      role: user?.role || "user",
      isActive: user?.isActive ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (user) {
        updateUserMutation.mutate({ id: user.id, ...formData });
      } else {
        createUserMutation.mutate(formData);
      }
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{user ? "Edit User" : "Create New User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {!user && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {Array.isArray(roles) ? roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name.toLowerCase()}>
                      {role.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                {user ? "Update" : "Create"} User
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

  const RoleForm = ({ role, onClose }: { role?: Role; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions || [],
    });

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
      if (checked) {
        setFormData({
          ...formData,
          permissions: [...formData.permissions, permissionId],
        });
      } else {
        setFormData({
          ...formData,
          permissions: formData.permissions.filter((p) => p !== permissionId),
        });
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4">
                {PERMISSION_MODULES.map((module) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{module.name}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {module.actions.map((action) => {
                        const permissionId = `${module.id}.${action}`;
                        return (
                          <div key={permissionId} className="flex items-center space-x-2">
                            <Checkbox
                              id={permissionId}
                              checked={formData.permissions.includes(permissionId)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(permissionId, !!checked)
                              }
                            />
                            <Label htmlFor={permissionId} className="text-sm">
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {role ? "Update" : "Create"} Role
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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Crown className="mr-3 h-8 w-8 text-yellow-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your company's users, roles, and permissions
            </p>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            {dashboard?.tenant?.name || "Your Company"}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="assignments">Quick Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.stats?.users || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.stats?.contacts || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.stats?.deals || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.recentActivity?.length > 0 ? (
                  <div className="space-y-2">
                    {dashboard.recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">{activity.timestamp}</span>
                        <span>{activity.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Button onClick={() => setShowUserForm(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>

            {showUserForm && (
              <UserForm onClose={() => setShowUserForm(false)} />
            )}

            {editingUser && (
              <UserForm user={editingUser} onClose={() => setEditingUser(null)} />
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user: User) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLoginAt || 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                              className="mr-2"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Roles & Permissions</h2>
              <Button onClick={() => setShowRoleForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
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
                      <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
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
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
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
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!role.isSystemRole && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <RolePermissionManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={dashboard?.tenant?.name || ""} readOnly />
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <Input value={dashboard?.tenant?.domain || ""} readOnly />
                  </div>
                  <div>
                    <Label>Subscription Plan</Label>
                    <Input value={dashboard?.tenant?.subscriptionPlan || ""} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}