import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckSquare, Calendar, Clock, AlertTriangle, GripVertical, Edit, Trash2, Save } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskItem } from "@/components/sortable-task-item";

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: tasksData, isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Tasks API response:", data);
      return data;
    },
    staleTime: 0,
  });
  const tasks = tasksData || [];

  const { data: contactsData } = useQuery({
    queryKey: ["/api/contacts"],
  });
  const contacts = contactsData || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refetch();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      setIsSaving(true);
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      setIsSaving(false);
      refetch();
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`, null);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refetch();
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <CheckSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTasks = (tasks || []).filter((task: Task) => {
    switch (filter) {
      case "pending": return task.status === "pending";
      case "in-progress": return task.status === "in-progress";
      case "completed": return task.status === "completed";
      case "overdue": return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
      default: return true;
    }
  });

  const toggleTaskComplete = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      status: task.status === "completed" ? "pending" : "completed"
    });
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
              <CheckSquare className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Task Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage and track your tasks with intelligent prioritization</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Smart Tasks
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Drag & Drop
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Priority Alerts
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Calendar className="w-4 h-4 mr-2" />
              Task Calendar
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          {["all", "pending", "in-progress", "completed", "overdue"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredTasks || []).map((task: Task) => {
            const contact = contacts.find((c: any) => c.id === task.relatedId && task.relatedTo === "contact");
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
            
            return (
              <Card key={task.id} className={`hover:shadow-lg transition-shadow ${isOverdue ? "border-red-200" : ""}`}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => toggleTaskComplete(task)}
                    />
                    {getPriorityIcon(task.priority || "medium")}
                    <CardTitle className={`text-lg ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                      {task.title}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge className={getPriorityColor(task.priority || "medium")}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status || "pending")}>
                      {task.status?.replace("-", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                    )}
                    
                    {task.type && (
                      <Badge variant="outline">{task.type}</Badge>
                    )}

                    {task.dueDate && (
                      <div className={`flex items-center text-sm ${isOverdue ? "text-red-600" : "text-gray-500"}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue && <Clock className="h-4 w-4 ml-2" />}
                      </div>
                    )}

                    {contact && (
                      <div className="text-sm text-blue-600">
                        Related to: {contact.name}
                      </div>
                    )}

                    {task.relatedTo && task.relatedTo !== "contact" && (
                      <div className="text-sm text-gray-500">
                        Related to: {task.relatedTo} #{task.relatedId}
                      </div>
                    )}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
                            deleteMutation.mutate(task.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const taskData = {
                  title: formData.get("title"),
                  description: formData.get("description") || null,
                  type: formData.get("type") || null,
                  priority: formData.get("priority") || "medium",
                  status: formData.get("status") || "pending",
                  // Remove dueDate for now to test basic functionality
                  relatedTo: formData.get("relatedTo") || null,
                  relatedId: formData.get("relatedId") ? parseInt(formData.get("relatedId") as string) : null,
                };
                console.log("Creating task with data:", taskData);
                createMutation.mutate(taskData);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="title" placeholder="Task Title" required className="px-3 py-2 border rounded-md" />
                  <select name="type" className="px-3 py-2 border rounded-md">
                    <option value="">Select Type</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                  
                  <select name="priority" className="px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <select name="status" className="px-3 py-2 border rounded-md">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <input name="dueDate" type="datetime-local" className="px-3 py-2 border rounded-md" />
                  
                  <select name="relatedTo" className="px-3 py-2 border rounded-md">
                    <option value="">Not Related</option>
                    <option value="contact">Contact</option>
                    <option value="lead">Lead</option>
                    <option value="deal">Deal</option>
                    <option value="account">Account</option>
                  </select>
                </div>
                
                <textarea name="description" placeholder="Task Description" rows={3} className="w-full px-3 py-2 border rounded-md" />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingTask && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Task: {editingTask.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editingTask.id,
                  data: {
                    title: formData.get("title"),
                    description: formData.get("description") || null,
                    type: formData.get("type") || null,
                    priority: formData.get("priority") || "medium",
                    status: formData.get("status") || "pending",
                    dueDate: formData.get("dueDate") || null,
                    relatedTo: formData.get("relatedTo") || null,
                    relatedId: formData.get("relatedId") ? parseInt(formData.get("relatedId") as string) : null,
                  }
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    name="title" 
                    placeholder="Task Title" 
                    defaultValue={editingTask.title || ''} 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <select name="type" defaultValue={editingTask.type || ''} className="px-3 py-2 border rounded-md">
                    <option value="">Select Type</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                  
                  <select name="priority" defaultValue={editingTask.priority || 'medium'} className="px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <select name="status" defaultValue={editingTask.status || 'pending'} className="px-3 py-2 border rounded-md">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <input 
                    name="dueDate" 
                    type="datetime-local" 
                    defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 16) : ''}
                    className="px-3 py-2 border rounded-md" 
                  />
                  
                  <select name="relatedTo" defaultValue={editingTask.relatedTo || ''} className="px-3 py-2 border rounded-md">
                    <option value="">Not Related</option>
                    <option value="contact">Contact</option>
                    <option value="lead">Lead</option>
                    <option value="deal">Deal</option>
                    <option value="account">Account</option>
                  </select>
                </div>
                
                <textarea 
                  name="description" 
                  placeholder="Task Description" 
                  defaultValue={editingTask.description || ''} 
                  rows={3} 
                  className="w-full px-3 py-2 border rounded-md" 
                />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}