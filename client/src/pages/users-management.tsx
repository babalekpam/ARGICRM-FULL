import Layout from "@/components/layout";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Shield, 
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { SYSTEM_ROLES, getPermissionLabel } from "@shared/permissions";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface UserRole {
  assignment: {
    id: string;
    userId: string;
    roleId: string;
    assignedAt: string;
  };
  role: Role;
}

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([]);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    role: "",
    isActive: true,
  });

  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
  });

  const [selectedCustomRoles, setSelectedCustomRoles] = useState<string[]>([]);

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/rbac/users'],
  });

  // Fetch all roles (for custom role assignment)
  const { data: allRoles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['/api/rbac/roles'],
  });

  // Fetch user's custom role assignments
  const { data: userRoleAssignments = [], isLoading: isLoadingUserRoles } = useQuery<UserRole[]>({
    queryKey: ['/api/rbac/user-roles', editingUser?.id],
    enabled: !!editingUser?.id && showEditDialog,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: Partial<User> }) => {
      return apiRequest(`/api/rbac/users/${data.userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Assign custom role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; roleId: string }) => {
      return apiRequest('/api/rbac/user-roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/user-roles', editingUser?.id] });
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  // Remove custom role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest(`/api/rbac/user-roles/${assignmentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/user-roles', editingUser?.id] });
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return apiRequest('/api/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/users'] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setShowCreateDialog(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // View user permissions
  const viewUserPermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/rbac/users/${userId}/permissions`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      setSelectedUserPermissions(data.permissions || []);
      setShowPermissionsDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive",
      });
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        searchQuery === "" ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    updateUserMutation.mutate({
      userId: editingUser.id,
      updates: editForm,
    });
  };

  const handleAssignRole = (roleId: string) => {
    if (!editingUser) return;
    
    assignRoleMutation.mutate({
      userId: editingUser.id,
      roleId,
    });
  };

  const handleRemoveRole = (assignmentId: string) => {
    removeRoleMutation.mutate(assignmentId);
  };

  const handleCreateUser = () => {
    if (!createForm.email || !createForm.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(createForm);
  };

  const handleDeactivateUser = () => {
    if (!userToDeactivate) return;

    updateUserMutation.mutate({
      userId: userToDeactivate.id,
      updates: { isActive: false },
    });
    setUserToDeactivate(null);
  };

  const isPlatformOwner = (email: string) => email === 'abel@argilette.com';

  const customRolesForSelection = allRoles.filter(r => !r.isSystemRole);
  const assignedRoleIds = userRoleAssignments.map(ur => ur.role.id);
  const availableCustomRoles = customRolesForSelection.filter(r => !assignedRoleIds.includes(r.id));

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Users className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users, assign roles, and control access permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-user">
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-users">
                {users.filter(u => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-admin-users">
                {users.filter(u => u.role === 'admin' || u.role === 'platform_owner').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-inactive-users">
                {users.filter(u => !u.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="platform_owner">Platform Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isPlatformOwner(user.email) && (
                              <Crown className="w-4 h-4 text-yellow-600" title="Platform Owner" />
                            )}
                            {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.email}
                            {isPlatformOwner(user.email) && (
                              <Lock className="w-3 h-3 text-muted-foreground" title="Protected Account" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' || user.role === 'platform_owner' ? 'default' : 'secondary'}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-3 h-3" />
                              {format(new Date(user.lastLoginAt), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewUserPermissions(user.id)}
                              data-testid={`button-view-permissions-${user.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              data-testid={`button-edit-user-${user.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-user">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details, system role, and assign custom roles
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser?.email || ""} disabled />
                </div>
              </div>

              {/* System Role */}
              <div className="space-y-4">
                <h3 className="font-semibold">System Role</h3>
                {isPlatformOwner(editingUser?.email || "") ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-medium">
                        Platform Owner role cannot be changed for security reasons
                      </p>
                    </div>
                  </div>
                ) : (
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                    <SelectTrigger data-testid="select-system-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="font-semibold">Account Status</h3>
                {isPlatformOwner(editingUser?.email || "") ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-medium">
                        Platform Owner account cannot be deactivated
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked as boolean })}
                      data-testid="checkbox-is-active"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active (user can log in and access the platform)
                    </Label>
                  </div>
                )}
              </div>

              {/* Custom Roles */}
              <div className="space-y-4">
                <h3 className="font-semibold">Custom Role Assignments</h3>
                
                {/* Assigned Roles */}
                {isLoadingUserRoles ? (
                  <div className="text-sm text-muted-foreground">Loading assigned roles...</div>
                ) : userRoleAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {userRoleAssignments.map((assignment) => (
                      <div key={assignment.assignment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.role.name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.role.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(assignment.assignment.id)}
                          data-testid={`button-remove-role-${assignment.assignment.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom roles assigned</p>
                )}

                {/* Assign New Role */}
                {availableCustomRoles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Assign Custom Role</Label>
                    <Select onValueChange={handleAssignRole}>
                      <SelectTrigger data-testid="select-assign-role">
                        <SelectValue placeholder="Select a role to assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCustomRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending} data-testid="button-save-user">
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent data-testid="dialog-create-user">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to your organization
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-firstName">First Name</Label>
                  <Input
                    id="create-firstName"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    data-testid="input-create-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-lastName">Last Name</Label>
                  <Input
                    id="create-lastName"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    data-testid="input-create-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  data-testid="input-create-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  data-testid="input-create-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">System Role *</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger data-testid="select-create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending} data-testid="button-submit-create">
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Permissions Dialog */}
        <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-view-permissions">
            <DialogHeader>
              <DialogTitle>User Permissions</DialogTitle>
              <DialogDescription>
                Effective permissions from system role and custom role assignments
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedUserPermissions.includes('*') ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <p className="font-medium">Platform Owner - Unrestricted Access</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This user has full access to all platform features and permissions
                  </p>
                </div>
              ) : selectedUserPermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                  {selectedUserPermissions.map((permission) => (
                    <div key={permission} className="p-2 bg-muted rounded text-sm">
                      {getPermissionLabel(permission)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No permissions found</p>
              )}
              <p className="text-xs text-muted-foreground">
                Total: {selectedUserPermissions.includes('*') ? 'All' : selectedUserPermissions.length} permissions
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowPermissionsDialog(false)} data-testid="button-close-permissions">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
