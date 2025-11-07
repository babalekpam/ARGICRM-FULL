import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Target,
  TrendingUp,
  BarChart3 as Gantt,
  Plus,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Filter,
  Download,
  Settings,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays, isAfter, isBefore } from "date-fns";

// Project Schema
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.string().optional(),
  projectManagerId: z.string().optional(),
  clientId: z.string().optional(),
});

// Task Schema
const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done", "blocked"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  plannedHours: z.number().optional(),
  assigneeId: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
});

// Resource Allocation Schema
const resourceSchema = z.object({
  userId: z.string(),
  allocatedHours: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  utilizationPercent: z.number().default(100),
  billableRate: z.string().optional(),
});

// Time Entry Schema
const timeEntrySchema = z.object({
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  billable: z.boolean().default(true),
  billableRate: z.string().optional(),
});

// Mock data for development
const mockProjects = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete redesign of company website with modern UI/UX",
    status: "active",
    priority: "high",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-03-15"),
    plannedStartDate: new Date("2024-01-15"),
    plannedEndDate: new Date("2024-03-15"),
    budget: "50000.00",
    actualCost: "25000.00",
    progress: 65,
    projectManagerId: "user1",
    clientId: "client1",
    tasks: [
      {
        id: "t1",
        name: "UI Design",
        status: "done",
        progress: 100,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-02-01"),
        assignee: "Designer A"
      },
      {
        id: "t2", 
        name: "Frontend Development",
        status: "in_progress",
        progress: 70,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-02-28"),
        assignee: "Developer B"
      },
      {
        id: "t3",
        name: "Backend Integration", 
        status: "todo",
        progress: 0,
        startDate: new Date("2024-02-15"),
        endDate: new Date("2024-03-10"),
        assignee: "Developer C"
      }
    ]
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Native mobile app for iOS and Android",
    status: "planning",
    priority: "medium",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-06-01"),
    plannedStartDate: new Date("2024-02-01"),
    plannedEndDate: new Date("2024-06-01"),
    budget: "100000.00",
    actualCost: "0.00",
    progress: 15,
    projectManagerId: "user2",
    clientId: "client2",
    tasks: []
  }
];

const mockUsers = [
  { id: "user1", name: "John Smith", role: "Project Manager" },
  { id: "user2", name: "Sarah Johnson", role: "Senior Developer" },
  { id: "user3", name: "Mike Chen", role: "Designer" },
  { id: "user4", name: "Lisa Brown", role: "Developer" }
];

const mockClients = [
  { id: "client1", name: "Tech Corp", industry: "Technology" },
  { id: "client2", name: "Design Studio", industry: "Creative" }
];

// Gantt Chart Component
function GanttChart({ projects }: { projects: any[] }) {
  const [viewMode, setViewMode] = useState<"weeks" | "months">("weeks");
  
  // Calculate timeline
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const endDate = addDays(startDate, viewMode === "weeks" ? 84 : 180); // 12 weeks or 6 months
  
  const timelineUnits = [];
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (viewMode === "weeks") {
      timelineUnits.push({
        label: format(current, "MMM dd"),
        date: new Date(current),
        width: 100
      });
      current = addDays(current, 7);
    } else {
      timelineUnits.push({
        label: format(current, "MMM yyyy"),
        date: new Date(current),
        width: 120
      });
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  const getTaskPosition = (task: any) => {
    const taskStart = task.startDate || startDate;
    const taskEnd = task.endDate || addDays(taskStart, 7);
    
    const totalDays = differenceInDays(endDate, startDate);
    const taskStartDays = differenceInDays(taskStart, startDate);
    const taskDuration = differenceInDays(taskEnd, taskStart);
    
    const left = (taskStartDays / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;
    
    return { left: Math.max(0, left), width: Math.max(2, width) };
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "blocked": return "bg-red-500";
      case "review": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "weeks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("weeks")}
          >
            Weeks
          </Button>
          <Button
            variant={viewMode === "months" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("months")}
          >
            Months
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        {/* Timeline Header */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex">
            <div className="w-64 flex-shrink-0">
              <div className="font-medium text-sm text-gray-600">Projects & Tasks</div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex" style={{ minWidth: timelineUnits.length * (viewMode === "weeks" ? 100 : 120) }}>
                {timelineUnits.map((unit, index) => (
                  <div
                    key={index}
                    className="border-l border-gray-200 text-center text-xs text-gray-600 py-2"
                    style={{ width: unit.width }}
                  >
                    {unit.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Rows */}
        <div className="max-h-96 overflow-y-auto">
          {projects.map((project) => (
            <div key={project.id} className="border-b">
              {/* Project Row */}
              <div className="flex items-center hover:bg-gray-50">
                <div className="w-64 flex-shrink-0 p-4">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      project.status === "active" ? "bg-green-500" :
                      project.status === "planning" ? "bg-yellow-500" :
                      project.status === "completed" ? "bg-blue-500" : "bg-gray-400"
                    )} />
                    <div>
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.progress}% complete</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative h-12" style={{ minWidth: timelineUnits.length * (viewMode === "weeks" ? 100 : 120) }}>
                  {project.startDate && project.endDate && (
                    <div
                      className="absolute top-3 h-6 bg-blue-200 border border-blue-300 rounded flex items-center px-2"
                      style={getTaskPosition(project)}
                    >
                      <div className="text-xs font-medium text-blue-800 truncate">
                        {project.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Rows */}
              {project.tasks?.map((task: any) => (
                <div key={task.id} className="flex items-center hover:bg-gray-50 border-t border-gray-100">
                  <div className="w-64 flex-shrink-0 p-4 pl-12">
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))} />
                      <div>
                        <div className="font-medium text-sm">{task.name}</div>
                        <div className="text-xs text-gray-500">{task.assignee}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-10" style={{ minWidth: timelineUnits.length * (viewMode === "weeks" ? 100 : 120) }}>
                    {task.startDate && task.endDate && (
                      <div
                        className={cn(
                          "absolute top-2 h-6 rounded flex items-center px-2",
                          getStatusColor(task.status)
                        )}
                        style={getTaskPosition(task)}
                      >
                        <div className="text-xs font-medium text-white truncate">
                          {task.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Resource Capacity Planning Component
function ResourcePlanning({ users }: { users: any[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  
  const mockAllocations = [
    { userId: "user1", projectName: "Website Redesign", hours: 40, utilization: 100 },
    { userId: "user1", projectName: "Mobile App", hours: 0, utilization: 0 },
    { userId: "user2", projectName: "Website Redesign", hours: 30, utilization: 75 },
    { userId: "user2", projectName: "Mobile App", hours: 10, utilization: 25 },
    { userId: "user3", projectName: "Website Redesign", hours: 20, utilization: 50 },
    { userId: "user4", projectName: "Mobile App", hours: 35, utilization: 87.5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Resource Allocation</h3>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => {
          const userAllocations = mockAllocations.filter(a => a.userId === user.id);
          const totalHours = userAllocations.reduce((sum, a) => sum + a.hours, 0);
          const totalUtilization = totalHours / 40 * 100; // Assuming 40 hour work week
          
          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{totalHours}h / 40h</div>
                    <div className={cn(
                      "text-sm",
                      totalUtilization > 100 ? "text-red-600" :
                      totalUtilization > 80 ? "text-yellow-600" : "text-green-600"
                    )}>
                      {totalUtilization.toFixed(0)}% utilized
                    </div>
                  </div>
                </div>
                
                <Progress value={Math.min(totalUtilization, 100)} className="mb-3" />
                
                <div className="space-y-2">
                  {userAllocations.map((allocation, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{allocation.projectName}</span>
                      <span className="font-medium">{allocation.hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Time Tracking Component
function TimeTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>("");
  
  const mockTimeEntries = [
    {
      id: "1",
      project: "Website Redesign",
      task: "Frontend Development",
      user: "Sarah Johnson",
      duration: "2h 30m",
      billable: true,
      date: new Date(),
      status: "completed"
    },
    {
      id: "2", 
      project: "Mobile App",
      task: "UI Design",
      user: "Mike Chen",
      duration: "3h 15m",
      billable: true,
      date: new Date(),
      status: "completed"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Tracking</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {/* Active Timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                variant={isTracking ? "destructive" : "default"}
                onClick={() => setIsTracking(!isTracking)}
              >
                {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div>
                <Select value={currentTask} onValueChange={setCurrentTask}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select task to track..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend Development</SelectItem>
                    <SelectItem value="backend">Backend Integration</SelectItem>
                    <SelectItem value="design">UI Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono">
                {isTracking ? "01:23:45" : "00:00:00"}
              </div>
              <div className="text-sm text-gray-600">
                {isTracking ? "Tracking..." : "Not tracking"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTimeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-sm">{entry.project}</div>
                  <div className="text-sm text-gray-600">{entry.task} • {entry.user}</div>
                  <div className="text-xs text-gray-500">
                    {format(entry.date, "MMM dd, yyyy")}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-medium">{entry.duration}</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={entry.billable ? "default" : "secondary"} className="text-xs">
                      {entry.billable ? "Billable" : "Non-billable"}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdvancedProjectManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Forms
  const projectForm = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "planning",
      priority: "medium"
    }
  });

  const handleCreateProject = async (data: any) => {
    try {
      // Add required tenantId field - using text format to match existing database
      const projectData = {
        ...data,
        tenantId: "default-tenant",
        createdBy: "system"
      };
      
      await apiRequest("POST", "/api/projects", projectData);
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      projectForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const projects = mockProjects;
  const users = mockUsers;
  const clients = mockClients;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  AI-Driven Project Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Advanced Gantt charts, resource planning, and intelligent time tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                Gantt Charts
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Resource Planning
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Time Tracking
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <Form {...projectForm}>
                <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={projectForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="submit">Create Project</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hours Tracked</p>
                  <p className="text-2xl font-bold">1,847</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On Schedule</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{project.name}</span>
                          <Badge variant={
                            project.status === "active" ? "default" :
                            project.status === "completed" ? "secondary" :
                            project.status === "planning" ? "outline" : "destructive"
                          }>
                            {project.status}
                          </Badge>
                        </CardTitle>
                        <p className="text-gray-600 mt-1">{project.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Progress</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={project.progress} className="flex-1" />
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Budget</p>
                        <p className="font-medium">${project.budget}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Spent</p>
                        <p className="font-medium">${project.actualCost}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium">{format(project.endDate, "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    
                    {project.tasks.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recent Tasks</h4>
                        <div className="space-y-2">
                          {project.tasks.slice(0, 3).map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  "w-3 h-3 rounded-full",
                                  task.status === "done" ? "bg-green-500" :
                                  task.status === "in_progress" ? "bg-blue-500" :
                                  task.status === "blocked" ? "bg-red-500" : "bg-gray-400"
                                )} />
                                <span className="text-sm">{task.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">{task.assignee}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="gantt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gantt className="h-5 w-5 mr-2" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GanttChart projects={projects} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-6">
            <ResourcePlanning users={users} />
          </TabsContent>
          
          <TabsContent value="time" className="space-y-6">
            <TimeTracking />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">On Time Delivery</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Budget Adherence</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Team Utilization</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resource Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">1,847</div>
                      <div className="text-sm text-gray-600">Total Hours This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">$127,450</div>
                      <div className="text-sm text-gray-600">Billable Hours Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">94%</div>
                      <div className="text-sm text-gray-600">Billable Ratio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}