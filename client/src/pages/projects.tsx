import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FolderOpen, Calendar, DollarSign, User, Edit, Upload, FileText, Save, Trash2, X, Paperclip } from "lucide-react";
import Layout from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project, InsertProject } from "@shared/schema";

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Projects API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Accounts API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Employees API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating project with data:", data);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Project creation error:", errorData);
        throw new Error(errorData.error || "Failed to create project");
      }
      return response.json();
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
      console.error("Project creation failed:", error);
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
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
        }
        throw new Error(JSON.stringify(errorData.details || errorData.error || "Failed to update project"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowEditDialog(false);
      setEditingProject(null);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted successfully",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "on-hold": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) added to project`,
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditDialog(true);
  };



  const handleUpdateProject = () => {
    if (!editingProject) return;
    
    // Get form element and extract values
    const form = document.querySelector('#project-edit-form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    
    // Build clean data object with proper validation
    const data: any = {
      name: formData.get('name')?.toString().trim() || editingProject.name,
      description: formData.get('description')?.toString().trim() || null,
      status: formData.get('status')?.toString() || editingProject.status,
      priority: formData.get('priority')?.toString() || editingProject.priority
    };

    // Handle optional numeric fields with proper validation
    const managerId = formData.get('managerId')?.toString();
    if (managerId && managerId !== '' && managerId !== 'undefined' && !isNaN(Number(managerId))) {
      data.managerId = parseInt(managerId);
    }

    const clientId = formData.get('clientId')?.toString();
    if (clientId && clientId !== '' && clientId !== 'undefined' && !isNaN(Number(clientId))) {
      data.accountId = parseInt(clientId);
    }

    const progress = formData.get('progress')?.toString();
    if (progress && progress !== '' && progress !== 'undefined' && !isNaN(Number(progress))) {
      data.progress = parseInt(progress);
    }

    // Handle optional decimal fields
    const budget = formData.get('budget')?.toString();
    if (budget && budget !== '' && budget !== 'undefined' && !isNaN(Number(budget))) {
      data.budget = budget;
    }

    const actualCost = formData.get('actualCost')?.toString();
    if (actualCost && actualCost !== '' && actualCost !== 'undefined' && !isNaN(Number(actualCost))) {
      data.actualCost = actualCost;
    }

    // Handle date fields
    const startDate = formData.get('startDate')?.toString();
    if (startDate && startDate !== '' && startDate !== 'undefined') {
      data.startDate = startDate;
    }

    const endDate = formData.get('endDate')?.toString();
    if (endDate && endDate !== '' && endDate !== 'undefined') {
      data.endDate = endDate;
    }

    console.log('Cleaned project update data:', data);
    updateMutation.mutate({ id: editingProject.id, data });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <FolderOpen className="h-8 w-8 text-rose-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Project Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage projects, track progress, and coordinate team efforts with smart automation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse"></div>
                Smart Projects
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Team Coordination
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Progress Tracking
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Calendar className="w-4 h-4 mr-2" />
              Timeline View
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => {
            const account = accounts.find((a: any) => a.id === project.accountId);
            const manager = employees.find((e: any) => e.id === project.managerId);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Badge className={getStatusColor(project.status || "planning")}>
                        {project.status?.replace("-", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority || "medium")}>
                        {project.priority}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
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
                              Delete Project
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>

                    {account && (
                      <div className="text-sm text-blue-600">
                        Client: {account.name}
                      </div>
                    )}

                    {manager && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        Manager: {manager.firstName} {manager.lastName}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {project.startDate && (
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Start: {new Date(project.startDate).toLocaleDateString()}
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          End: {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {project.budget && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Budget</span>
                          <span>${parseFloat(project.budget).toLocaleString()}</span>
                        </div>
                        {project.actualCost && (
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Spent: ${parseFloat(project.actualCost).toLocaleString()}</span>
                            <span className={parseFloat(project.actualCost) > parseFloat(project.budget) ? "text-red-600" : "text-green-600"}>
                              {Math.round((parseFloat(project.actualCost) / parseFloat(project.budget)) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get("name"),
                  description: formData.get("description"),
                  status: formData.get("status"),
                  priority: formData.get("priority"),
                  accountId: formData.get("accountId") ? parseInt(formData.get("accountId") as string) : null,
                  managerId: formData.get("managerId") ? parseInt(formData.get("managerId") as string) : null,
                  startDate: formData.get("startDate") || null,
                  endDate: formData.get("endDate") || null,
                  budget: formData.get("budget") || null,
                  progress: formData.get("progress") ? parseInt(formData.get("progress") as string) : 0,
                });
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
                    {accounts.map((account: any) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                  
                  <select name="managerId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Manager</option>
                    {employees.map((employee: any) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                  
                  <input name="progress" type="number" min="0" max="100" placeholder="Progress %" className="px-3 py-2 border rounded-md" />
                  <input name="startDate" type="date" placeholder="Start Date" className="px-3 py-2 border rounded-md" />
                  <input name="endDate" type="date" placeholder="End Date" className="px-3 py-2 border rounded-md" />
                  <input name="budget" type="number" step="0.01" placeholder="Budget" className="px-3 py-2 border rounded-md" />
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
              <form id="project-edit-form" onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProject();
              }} className="space-y-6">
                
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
                        {accounts.map((account: any) => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Project Manager</label>
                      <select name="managerId" defaultValue={editingProject.managerId || ""} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Select Manager</option>
                        {employees.map((employee: any) => (
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
                        defaultValue={editingProject.startDate ? new Date(editingProject.startDate).toISOString().split('T')[0] : ""}
                        className="w-full px-3 py-2 border rounded-md" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input 
                        name="endDate" 
                        type="date" 
                        defaultValue={editingProject.endDate ? new Date(editingProject.endDate).toISOString().split('T')[0] : ""}
                        className="w-full px-3 py-2 border rounded-md" 
                      />
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Budget</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Budget ($)</label>
                      <input 
                        name="budget" 
                        type="number" 
                        step="0.01" 
                        defaultValue={editingProject.budget || ""}
                        className="w-full px-3 py-2 border rounded-md" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Actual Cost ($)</label>
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

                {/* File Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Project Files</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload project files
                          </span>
                          <input
                            id="file-upload"
                            name="files"
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          Documents, images, presentations up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Uploaded Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}