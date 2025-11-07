import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  Award
} from "lucide-react";
import type { TeamCapacity, EmployeeSkill, ResourceForecast, WorkloadSnapshot } from "@shared/schema";

export default function ResourceManagement() {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(getMonday(new Date()).toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ['/api/employees'],
  });

  // Fetch team capacity for selected week
  const { data: teamCapacity = [], isLoading: capacityLoading } = useQuery<TeamCapacity[]>({
    queryKey: ['/api/resources/capacity', { weekStartDate: selectedWeek }],
    enabled: !!selectedWeek,
  });

  // Fetch employee skills
  const { data: employeeSkills = [], isLoading: skillsLoading } = useQuery<EmployeeSkill[]>({
    queryKey: ['/api/resources/skills', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Fetch resource forecasts
  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery<ResourceForecast[]>({
    queryKey: ['/api/resources/forecasts'],
  });

  // Fetch workload snapshots
  const { data: workloadData = [], isLoading: workloadLoading } = useQuery<WorkloadSnapshot[]>({
    queryKey: ['/api/resources/workload', { days: 30 }],
  });

  // Create capacity mutation
  const createCapacityMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/resources/capacity', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/capacity'] });
      toast({ title: "Success", description: "Team capacity created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create capacity", variant: "destructive" });
    },
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/resources/skills', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/skills'] });
      toast({ title: "Success", description: "Skill added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add skill", variant: "destructive" });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/resources/skills/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/skills'] });
      toast({ title: "Success", description: "Skill deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete skill", variant: "destructive" });
    },
  });

  // Create forecast mutation
  const createForecastMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/resources/forecasts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/forecasts'] });
      toast({ title: "Success", description: "Forecast created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create forecast", variant: "destructive" });
    },
  });

  // Helper function to get Monday of the week
  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Prepare workload chart data
  const workloadChartData = teamCapacity.map((capacity) => {
    const member = teamMembers.find((m) => m.id === capacity.userId);
    return {
      name: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
      utilization: capacity.utilizationPercent || 0,
      allocated: capacity.allocatedHours || 0,
      available: capacity.availableHours || 0,
    };
  });

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 60) return "text-yellow-600";
    if (utilization <= 90) return "text-green-600";
    return "text-red-600";
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization < 60) return "Underutilized";
    if (utilization <= 90) return "Optimal";
    return "Overallocated";
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-resource-management">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Resource Management</h1>
          <p className="text-muted-foreground">Team capacity, skills, and workload analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-48"
            data-testid="input-week-selector"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-capacity">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-capacity">
              {teamCapacity.reduce((sum, c) => sum + (c.availableHours || 0), 0)} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              {teamCapacity.length} team members
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-allocated-hours">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-allocated-hours">
              {teamCapacity.reduce((sum, c) => sum + (c.allocatedHours || 0), 0)} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              Assigned to projects
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-utilization">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-utilization">
              {teamCapacity.length > 0 
                ? Math.round(teamCapacity.reduce((sum, c) => sum + (c.utilizationPercent || 0), 0) / teamCapacity.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Team average
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-forecasts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forecasts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-forecasts">
              {forecasts.filter(f => f.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Resource planning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="capacity" className="space-y-4" data-testid="tabs-resource-management">
        <TabsList>
          <TabsTrigger value="capacity" data-testid="tab-capacity">Team Capacity</TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">Skills Matrix</TabsTrigger>
          <TabsTrigger value="workload" data-testid="tab-workload">Workload Analytics</TabsTrigger>
          <TabsTrigger value="forecasts" data-testid="tab-forecasts">Forecasts</TabsTrigger>
        </TabsList>

        {/* Team Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <Card data-testid="card-team-capacity">
            <CardHeader>
              <CardTitle>Weekly Team Capacity</CardTitle>
              <CardDescription>
                Track team member availability and utilization for week of {selectedWeek}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capacityLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table data-testid="table-team-capacity">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Available (hrs)</TableHead>
                      <TableHead className="text-right">Allocated (hrs)</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead className="text-right">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamCapacity.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No capacity data for this week
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamCapacity.map((capacity) => {
                        const member = teamMembers.find((m) => m.id === capacity.userId);
                        const utilization = capacity.utilizationPercent || 0;
                        
                        return (
                          <TableRow key={capacity.id} data-testid={`row-capacity-${capacity.id}`}>
                            <TableCell className="font-medium">
                              {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={capacity.status === 'active' ? 'default' : 'secondary'}>
                                {capacity.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{capacity.availableHours || 0}</TableCell>
                            <TableCell className="text-right">{capacity.allocatedHours || 0}</TableCell>
                            <TableCell className="text-right">
                              <span className={getUtilizationColor(utilization)}>
                                {utilization}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={utilization > 90 ? 'destructive' : utilization < 60 ? 'secondary' : 'default'}
                              >
                                {getUtilizationStatus(utilization)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Matrix Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card data-testid="card-skills-matrix">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Skills Matrix</CardTitle>
                  <CardDescription>Track team member skills and proficiency levels</CardDescription>
                </div>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[250px]" data-testid="select-user">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUserId ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-user-selected">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a team member to view their skills</p>
                </div>
              ) : skillsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table data-testid="table-employee-skills">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Proficiency</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Endorsements</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeSkills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No skills recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeeSkills.map((skill) => (
                          <TableRow key={skill.id} data-testid={`row-skill-${skill.id}`}>
                            <TableCell className="font-medium">{skill.skillName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{skill.skillCategory}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Award
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < skill.proficiencyLevel ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{skill.yearsOfExperience || 0} years</TableCell>
                            <TableCell>{skill.endorsements || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSkillMutation.mutate(skill.id)}
                                data-testid={`button-delete-skill-${skill.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Analytics Tab */}
        <TabsContent value="workload" className="space-y-4">
          <Card data-testid="card-workload-distribution">
            <CardHeader>
              <CardTitle>Team Workload Distribution</CardTitle>
              <CardDescription>Visual breakdown of team utilization</CardDescription>
            </CardHeader>
            <CardContent>
              {capacityLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={workloadChartData} data-testid="chart-workload">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" fill="#94a3b8" name="Available Hours" />
                    <Bar dataKey="allocated" fill="#3b82f6" name="Allocated Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card data-testid="card-resource-forecasts">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Forecasts</CardTitle>
                  <CardDescription>Plan future resource needs and identify gaps</CardDescription>
                </div>
                <Button data-testid="button-create-forecast">
                  <Plus className="h-4 w-4 mr-2" />
                  New Forecast
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {forecastsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table data-testid="table-forecasts">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forecast Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Required Hours</TableHead>
                      <TableHead className="text-right">Available Hours</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No forecasts created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      forecasts.map((forecast) => (
                        <TableRow key={forecast.id} data-testid={`row-forecast-${forecast.id}`}>
                          <TableCell className="font-medium">{forecast.forecastName}</TableCell>
                          <TableCell>{forecast.forecastPeriod}</TableCell>
                          <TableCell>
                            <Badge variant={forecast.status === 'active' ? 'default' : 'secondary'}>
                              {forecast.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{forecast.totalRequiredHours || 0}</TableCell>
                          <TableCell className="text-right">{forecast.totalAvailableHours || 0}</TableCell>
                          <TableCell className="text-right">{forecast.projectedUtilization || 0}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
