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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Lock,
  Crown,
  Users,
  CheckCircle,
  Search,
  Filter
} from "lucide-react";
import { getPermissionLabel, PERMISSION_MODULES } from "@shared/permissions";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SystemRole {
  id: string;
  name: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface PermissionsByModule {
  [module: string]: string[];
}

export default function RolesManagement() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState<"all" | "custom" | "system">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['/api/rbac/roles'],
  });

  // Fetch system roles for reference
  const { data: systemRoles = [], isLoading: isLoadingSystemRoles } = useQuery<SystemRole[]>({
    queryKey: ['/api/rbac/system-roles'],
  });

  // Fetch permissions grouped by module
  const { data: permissionsByModule = {}, isLoading: isLoadingPermissions } = useQuery<PermissionsByModule>({
    queryKey: ['/api/rbac/permissions/by-module'],
  });

  // Fetch users to count role assignments
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/rbac/users'],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof roleForm) => {
      return apiRequest('/api/rbac/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/roles'] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      setShowCreateDialog(false);
      setRoleForm({ name: "", description: "", permissions: [] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<typeof roleForm> }) => {
      return apiRequest(`/api/rbac/roles/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/roles'] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      setShowEditDialog(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rbac/roles'] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setShowDeleteDialog(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = 
        searchQuery === "" ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = 
        roleTypeFilter === "all" ||
        (roleTypeFilter === "custom" && !role.isSystemRole) ||
        (roleTypeFilter === "system" && role.isSystemRole);

      return matchesSearch && matchesType;
    });
  }, [roles, searchQuery, roleTypeFilter]);

  // Custom roles only
  const customRoles = roles.filter(r => !r.isSystemRole);

  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate(roleForm);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystemRole) {
      toast({
        title: "Not Allowed",
        description: "System roles cannot be edited",
        variant: "destructive",
      });
      return;
    }

    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setShowEditDialog(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole || !roleForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    updateRoleMutation.mutate({
      id: selectedRole.id,
      updates: roleForm,
    });
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystemRole) {
      toast({
        title: "Not Allowed",
        description: "System roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setRoleToDelete(role);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setShowDetailsDialog(true);
  };

  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleModule = (moduleName: string) => {
    const modulePermissions = permissionsByModule[moduleName] || [];
    const allSelected = modulePermissions.every(p => roleForm.permissions.includes(p));

    setRoleForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !modulePermissions.includes(p))
        : [...new Set([...prev.permissions, ...modulePermissions])]
    }));
  };

  const getUsersWithRole = (roleId: string) => {
    // This would require fetching user-role assignments
    // For now, return count based on role ID
    return users.filter(u => u.role === roleId).length;
  };

  const getModuleName = (moduleKey: string): string => {
    return moduleKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Shield className="w-8 h-8" />
              Roles & Permissions Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create custom roles and manage permission assignments
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-role">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-roles">{roles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Edit className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-custom-roles">
                {customRoles.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Lock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-system-roles">
                {systemRoles.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="custom" className="space-y-6">
          <TabsList>
            <TabsTrigger value="custom" data-testid="tab-custom-roles">Custom Roles</TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system-roles">System Roles Reference</TabsTrigger>
          </TabsList>

          {/* Custom Roles Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-roles"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Roles Table */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Roles</CardTitle>
                <CardDescription>
                  {customRoles.length} custom {customRoles.length === 1 ? 'role' : 'roles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRoles ? (
                  <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
                ) : customRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No custom roles created yet</p>
                    <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-role">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Role
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customRoles.map((role) => (
                          <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                            <TableCell className="font-medium">
                              {role.name}
                            </TableCell>
                            <TableCell>
                              {role.description || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {role.permissions.length} permissions
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(role)}
                                  data-testid={`button-view-role-${role.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                  data-testid={`button-edit-role-${role.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role)}
                                  data-testid={`button-delete-role-${role.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
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
          </TabsContent>

          {/* System Roles Reference Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Roles</CardTitle>
                <CardDescription>
                  Pre-defined roles with default permissions (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSystemRoles ? (
                  <div className="text-center py-8 text-muted-foreground">Loading system roles...</div>
                ) : (
                  <div className="space-y-4">
                    {systemRoles.map((role) => (
                      <Card key={role.id} data-testid={`card-system-role-${role.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {role.id === 'platform_owner' && <Crown className="w-5 h-5 text-yellow-600" />}
                              {role.id === 'admin' && <Shield className="w-5 h-5 text-blue-600" />}
                              <div>
                                <CardTitle className="text-lg">{role.name}</CardTitle>
                                <CardDescription className="mt-1">
                                  {role.permissions.includes('*') 
                                    ? 'Unrestricted access to all features'
                                    : `${role.permissions.length} default permissions`
                                  }
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="outline">
                              <Lock className="w-3 h-3 mr-1" />
                              System Role
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {role.permissions.includes('*') ? (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-sm font-medium">Full Platform Access</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                This role has unrestricted access to all features and permissions
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                              {role.permissions.slice(0, 20).map((permission) => (
                                <div key={permission} className="text-sm p-2 bg-muted rounded">
                                  {getPermissionLabel(permission)}
                                </div>
                              ))}
                              {role.permissions.length > 20 && (
                                <div className="text-sm text-muted-foreground p-2">
                                  ... and {role.permissions.length - 20} more
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Role Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-role">
            <DialogHeader>
              <DialogTitle>Create Custom Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your organization
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name *</Label>
                  <Input
                    id="role-name"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g., Sales Manager, Content Editor"
                    data-testid="input-role-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Describe the purpose and scope of this role"
                    rows={3}
                    data-testid="input-role-description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Badge variant="secondary">
                    {roleForm.permissions.length} selected
                  </Badge>
                </div>

                {isLoadingPermissions ? (
                  <div className="text-center py-8 text-muted-foreground">Loading permissions...</div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => {
                      const allSelected = modulePermissions.every(p => roleForm.permissions.includes(p));
                      const someSelected = modulePermissions.some(p => roleForm.permissions.includes(p));

                      return (
                        <AccordionItem key={moduleName} value={moduleName}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Checkbox
                                checked={allSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModule(moduleName);
                                }}
                                data-testid={`checkbox-module-${moduleName}`}
                              />
                              <span className="font-medium">{getModuleName(moduleName)}</span>
                              <Badge variant="outline" className="ml-auto">
                                {modulePermissions.filter(p => roleForm.permissions.includes(p)).length} / {modulePermissions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-6 space-y-2 pt-2">
                              {modulePermissions.map((permission) => (
                                <div key={permission} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={roleForm.permissions.includes(permission)}
                                    onCheckedChange={() => togglePermission(permission)}
                                    id={`perm-${permission}`}
                                    data-testid={`checkbox-permission-${permission}`}
                                  />
                                  <Label
                                    htmlFor={`perm-${permission}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {getPermissionLabel(permission)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create-role">
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending} data-testid="button-submit-create-role">
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-role">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify role details and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role-name">Role Name *</Label>
                  <Input
                    id="edit-role-name"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    data-testid="input-edit-role-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-description">Description</Label>
                  <Textarea
                    id="edit-role-description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    rows={3}
                    data-testid="input-edit-role-description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Badge variant="secondary">
                    {roleForm.permissions.length} selected
                  </Badge>
                </div>

                {isLoadingPermissions ? (
                  <div className="text-center py-8 text-muted-foreground">Loading permissions...</div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => {
                      const allSelected = modulePermissions.every(p => roleForm.permissions.includes(p));

                      return (
                        <AccordionItem key={moduleName} value={moduleName}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Checkbox
                                checked={allSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModule(moduleName);
                                }}
                                data-testid={`checkbox-edit-module-${moduleName}`}
                              />
                              <span className="font-medium">{getModuleName(moduleName)}</span>
                              <Badge variant="outline" className="ml-auto">
                                {modulePermissions.filter(p => roleForm.permissions.includes(p)).length} / {modulePermissions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-6 space-y-2 pt-2">
                              {modulePermissions.map((permission) => (
                                <div key={permission} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={roleForm.permissions.includes(permission)}
                                    onCheckedChange={() => togglePermission(permission)}
                                    id={`edit-perm-${permission}`}
                                    data-testid={`checkbox-edit-permission-${permission}`}
                                  />
                                  <Label
                                    htmlFor={`edit-perm-${permission}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {getPermissionLabel(permission)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit-role">
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={updateRoleMutation.isPending} data-testid="button-save-role">
                {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-role-details">
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>
                View complete role information and permissions
              </DialogDescription>
            </DialogHeader>

            {selectedRole && (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Role Name</Label>
                  <p className="font-semibold text-lg">{selectedRole.name}</p>
                </div>

                {selectedRole.description && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p>{selectedRole.description}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <Badge variant={selectedRole.isSystemRole ? "outline" : "default"}>
                    {selectedRole.isSystemRole ? (
                      <><Lock className="w-3 h-3 mr-1" /> System Role</>
                    ) : (
                      <>Custom Role</>
                    )}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Permissions</Label>
                    <Badge variant="secondary">
                      {selectedRole.permissions.length} total
                    </Badge>
                  </div>
                  
                  {selectedRole.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                      {selectedRole.permissions.map((permission) => (
                        <div key={permission} className="p-2 bg-muted rounded text-sm flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {getPermissionLabel(permission)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No permissions assigned</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)} data-testid="button-close-details">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent data-testid="dialog-delete-role">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
                Users with this role will lose these permissions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
