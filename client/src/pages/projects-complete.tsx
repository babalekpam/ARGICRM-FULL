import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Calendar, DollarSign, Edit, Upload, FileText, Trash2, X } from "lucide-react";
import Layout from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project, InsertProject, Account, Employee } from "@shared/schema";

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      return apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowForm(false);
      toast({
        title: "Project created successfully",
        description: "Your new project has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('Sending update data:', data);
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error response:', response.status, errorData);
        throw new Error(errorData.error || "Failed to update project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowEditDialog(false);
      setEditingProject(null);
      setUploadedFiles([]);
      toast({
        title: "Project updated successfully",
        description: "Your project changes have been saved.",
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: "Files added",
      description: `${files.length} file(s) ready for upload`,
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: "Files added",
      description: `${files.length} file(s) ready for upload`,
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditDialog(true);
    setUploadedFiles([]);
  };

  const handleUpdateProject = () => {
    if (!editingProject) return;
    
    const form = document.querySelector('#project-edit-form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    
    // Build clean data object with proper validation
    const data: any = {};

    // Required fields
    const name = formData.get('name')?.toString().trim();
    if (name) {
      data.name = name;
    }

    const description = formData.get('description')?.toString().trim();
    if (description !== undefined) {
      data.description = description || null;
    }

    const status = formData.get('status')?.toString();
    if (status) {
      data.status = status;
    }

    const priority = formData.get('priority')?.toString();
    if (priority) {
      data.priority = priority;
    }

    // Optional numeric fields
    const managerId = formData.get('managerId')?.toString();
    if (managerId && managerId !== '' && !isNaN(Number(managerId))) {
      data.managerId = parseInt(managerId);
    }

    const clientId = formData.get('clientId')?.toString();
    if (clientId && clientId !== '' && !isNaN(Number(clientId))) {
      data.accountId = parseInt(clientId);
    }

    const progress = formData.get('progress')?.toString();
    if (progress && progress !== '' && !isNaN(Number(progress))) {
      data.progress = parseInt(progress);
    }

    // Optional decimal fields
    const budget = formData.get('budget')?.toString();
    if (budget && budget !== '' && !isNaN(Number(budget))) {
      data.budget = budget;
    }

    const actualCost = formData.get('actualCost')?.toString();
    if (actualCost && actualCost !== '' && !isNaN(Number(actualCost))) {
      data.actualCost = actualCost;
    }

    // Date fields
    const startDate = formData.get('startDate')?.toString();
    if (startDate && startDate !== '') {
      data.startDate = startDate;
    }

    const endDate = formData.get('endDate')?.toString();
    if (endDate && endDate !== '') {
      data.endDate = endDate;
    }

    console.log('Clean project update data:', data);
    updateMutation.mutate({ id: editingProject.id, data });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      planning: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      "on-hold": "bg-orange-100 text-orange-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage your projects and track progress</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Project Creation Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: InsertProject = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string || null,
                  status: formData.get('status') as string || 'planning',
                  priority: formData.get('priority') as string || 'medium',
                  accountId: formData.get('accountId') ? parseInt(formData.get('accountId') as string) : null,
                  managerId: formData.get('managerId') ? parseInt(formData.get('managerId') as string) : null,
                  budget: formData.get('budget') as string || null,
                  startDate: formData.get('startDate') as string || null,
                  endDate: formData.get('endDate') as string || null,
                };
                createMutation.mutate(data);
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Project Name" required className="px-3 py-2 border rounded-md" />
                  <select name="status" className="px-3 py-2 border rounded-md">
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <select name="priority" className="px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  
                  <select name="accountId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Client</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                  
                  <select name="managerId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Manager</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                  
                  <input name="budget" type="number" step="0.01" placeholder="Budget" className="px-3 py-2 border rounded-md" />
                  <input name="startDate" type="date" className="px-3 py-2 border rounded-md" />
                  <input name="endDate" type="date" className="px-3 py-2 border rounded-md" />
                </div>
                
                <textarea name="description" placeholder="Project Description" rows={3} className="w-full px-3 py-2 border rounded-md" />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(project.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getStatusBadge(project.status || 'planning')}>
                    {project.status || 'Planning'}
                  </Badge>
                  <Badge className={getPriorityBadge(project.priority || 'medium')}>
                    {project.priority || 'Medium'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                )}
                
                {project.progress !== null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-500">
                  {project.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(project.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${parseFloat(project.budget).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project: {editingProject?.name}</DialogTitle>
              <DialogDescription>
                Update project details and upload files
              </DialogDescription>
            </DialogHeader>
            
            {editingProject && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Project Details</TabsTrigger>
                  <TabsTrigger value="files">File Management</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <form id="project-edit-form" className="space-y-6">
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Project Name</label>
                          <input 
                            name="name" 
                            defaultValue={editingProject.name}
                            required 
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <select name="status" defaultValue={editingProject.status || "planning"} className="w-full px-3 py-2 border rounded-md">
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Priority</label>
                          <select name="priority" defaultValue={editingProject.priority || "medium"} className="w-full px-3 py-2 border rounded-md">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Progress (%)</label>
                          <input 
                            name="progress" 
                            type="number" 
                            min="0" 
                            max="100" 
                            defaultValue={editingProject.progress || 0}
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                          name="description" 
                          defaultValue={editingProject.description || ""}
                          rows={3} 
                          className="w-full px-3 py-2 border rounded-md" 
                        />
                      </div>
                    </div>

                    {/* Assignment & Dates */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Assignment & Timeline</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Client</label>
                          <select name="clientId" defaultValue={editingProject.accountId || ""} className="w-full px-3 py-2 border rounded-md">
                            <option value="">Select Client</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>{account.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Project Manager</label>
                          <select name="managerId" defaultValue={editingProject.managerId || ""} className="w-full px-3 py-2 border rounded-md">
                            <option value="">Select Manager</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <input 
                            name="startDate" 
                            type="date" 
                            defaultValue={editingProject.startDate || ""}
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input 
                            name="endDate" 
                            type="date" 
                            defaultValue={editingProject.endDate || ""}
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Budget & Costs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Budget & Costs</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Budget</label>
                          <input 
                            name="budget" 
                            type="number" 
                            step="0.01" 
                            defaultValue={editingProject.budget || ""}
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Actual Cost</label>
                          <input 
                            name="actualCost" 
                            type="number" 
                            step="0.01" 
                            defaultValue={editingProject.actualCost || ""}
                            className="w-full px-3 py-2 border rounded-md" 
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="files" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">File Management</h3>
                    
                    {/* File Upload Area */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop files here or click to upload
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB each)
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Files to Upload ({uploadedFiles.length})</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProject} 
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}