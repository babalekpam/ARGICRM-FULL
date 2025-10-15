import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, Calendar, TrendingUp, Clock, Award, AlertTriangle, Search, Plus, Edit, Eye, Star, Target, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function PerformanceReviews() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  const performanceData = [
    {
      id: "1",
      employeeName: "John Smith",
      position: "Software Engineer",
      reviewPeriod: "Q4 2024",
      overallRating: 4.2,
      goals: 8,
      completedGoals: 6,
      status: "completed",
      nextReview: "2025-04-01",
      manager: "Sarah Johnson",
      areas: {
        technical: 4.5,
        communication: 4.0,
        teamwork: 4.3,
        leadership: 3.8,
        problemSolving: 4.6
      }
    },
    {
      id: "2",
      employeeName: "Emily Davis",
      position: "Product Manager",
      reviewPeriod: "Q4 2024",
      overallRating: 4.7,
      goals: 10,
      completedGoals: 9,
      status: "completed",
      nextReview: "2025-04-01",
      manager: "Mike Chen",
      areas: {
        technical: 4.2,
        communication: 4.9,
        teamwork: 4.8,
        leadership: 4.6,
        problemSolving: 4.5
      }
    },
    {
      id: "3",
      employeeName: "Michael Brown",
      position: "Designer",
      reviewPeriod: "Q4 2024",
      overallRating: 3.9,
      goals: 6,
      completedGoals: 4,
      status: "in-progress",
      nextReview: "2025-03-15",
      manager: "Lisa Wilson",
      areas: {
        technical: 4.1,
        communication: 3.7,
        teamwork: 4.0,
        leadership: 3.5,
        problemSolving: 4.0
      }
    }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Performance Reviews</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Start Review
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">4.2</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Goal Completion</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {performanceData.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{review.employeeName}</CardTitle>
                  <CardDescription>{review.position}</CardDescription>
                </div>
                <Badge className={getStatusColor(review.status)} variant="secondary">
                  {review.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Rating:</span>
                  <span className={`text-lg font-bold ${getRatingColor(review.overallRating)}`}>
                    {review.overallRating}/5.0
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Goal Progress:</span>
                    <span>{review.completedGoals}/{review.goals}</span>
                  </div>
                  <Progress value={(review.completedGoals / review.goals) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Areas:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Technical:</span>
                      <span className={getRatingColor(review.areas.technical)}>{review.areas.technical}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Communication:</span>
                      <span className={getRatingColor(review.areas.communication)}>{review.areas.communication}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Teamwork:</span>
                      <span className={getRatingColor(review.areas.teamwork)}>{review.areas.teamwork}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leadership:</span>
                      <span className={getRatingColor(review.areas.leadership)}>{review.areas.leadership}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>Manager: {review.manager}</div>
                  <div>Period: {review.reviewPeriod}</div>
                  <div>Next Review: {format(new Date(review.nextReview), 'MMM dd, yyyy')}</div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AttendanceTracking() {
  const attendanceData = [
    { date: "2024-12-30", status: "present", hours: 8.5, overtime: 0.5 },
    { date: "2024-12-29", status: "present", hours: 8.0, overtime: 0 },
    { date: "2024-12-28", status: "absent", hours: 0, overtime: 0 },
    { date: "2024-12-27", status: "present", hours: 9.0, overtime: 1.0 },
    { date: "2024-12-26", status: "holiday", hours: 0, overtime: 0 },
  ];

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'present': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'holiday': 'bg-blue-100 text-blue-800',
      'sick': 'bg-yellow-100 text-yellow-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Attendance Tracking</h2>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Mark Attendance</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">95.2%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">168.5</div>
              <div className="text-sm text-gray-600">Hours This Month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">12.5</div>
              <div className="text-sm text-gray-600">Overtime Hours</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">Absent Days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 5 working days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium">
                    {format(new Date(day.date), 'EEE, MMM dd')}
                  </div>
                  <Badge className={getStatusColor(day.status)} variant="secondary">
                    {day.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Hours: {day.hours}</span>
                  {day.overtime > 0 && (
                    <span className="text-purple-600">OT: {day.overtime}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { department: "Engineering", present: 28, total: 30, rate: 93.3 },
                { department: "Design", present: 12, total: 12, rate: 100 },
                { department: "Product", present: 8, total: 10, rate: 80 },
                { department: "Marketing", present: 15, total: 16, rate: 93.8 },
              ].map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dept.department}</span>
                    <span>{dept.present}/{dept.total} ({dept.rate}%)</span>
                  </div>
                  <Progress value={dept.rate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-500">
              Attendance trend chart would be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaveManagement() {
  const leaveRequests = [
    {
      id: 1,
      employee: "John Smith",
      type: "Vacation",
      startDate: "2024-12-23",
      endDate: "2024-12-27",
      days: 5,
      status: "approved",
      appliedDate: "2024-12-01",
      reason: "Holiday vacation with family"
    },
    {
      id: 2,
      employee: "Emily Davis",
      type: "Sick Leave",
      startDate: "2024-12-30",
      endDate: "2024-12-30",
      days: 1,
      status: "pending",
      appliedDate: "2024-12-30",
      reason: "Feeling unwell"
    },
    {
      id: 3,
      employee: "Michael Brown",
      type: "Personal",
      startDate: "2025-01-05",
      endDate: "2025-01-07",
      days: 3,
      status: "pending",
      appliedDate: "2024-12-28",
      reason: "Personal matters"
    }
  ];

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'approved': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'Vacation': 'bg-blue-100 text-blue-800',
      'Sick Leave': 'bg-red-100 text-red-800',
      'Personal': 'bg-purple-100 text-purple-800',
      'Maternity': 'bg-pink-100 text-pink-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-gray-600">Total Vacation Days</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Days Used</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">7</div>
              <div className="text-sm text-gray-600">Days Remaining</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">Pending Requests</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Recent leave applications and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.employee}</div>
                      <div className="text-sm text-gray-500">Applied: {format(new Date(request.appliedDate), 'MMM dd, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeColor(request.type)} variant="secondary">
                        {request.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{format(new Date(request.startDate), 'MMM dd')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.days} {request.days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(request.status)} variant="secondary">
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900">
                            Approve
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance by Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "John Smith", used: 8, total: 15 },
                { name: "Emily Davis", used: 5, total: 15 },
                { name: "Michael Brown", used: 12, total: 15 },
                { name: "Sarah Wilson", used: 3, total: 15 },
              ].map((employee, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{employee.name}</span>
                    <span>{employee.used}/{employee.total} days used</span>
                  </div>
                  <Progress value={(employee.used / employee.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "Vacation", count: 45, percentage: 60 },
                { type: "Sick Leave", count: 18, percentage: 24 },
                { type: "Personal", count: 8, percentage: 11 },
                { type: "Maternity", count: 4, percentage: 5 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count}</div>
                    <div className="text-xs text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EnhancedHRManagement() {
  const [activeTab, setActiveTab] = useState("performance");
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-rose-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                AI-Enhanced HR Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Comprehensive human resource management with AI-powered performance tracking
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
              <div className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse"></div>
              Performance Analytics
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Attendance Tracking
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              Smart Reports
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="performance">Performance Reviews</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Tracking</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="analytics">HR Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <PerformanceReviews />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTracking />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Employee Satisfaction</p>
                    <p className="text-2xl font-bold">8.4/10</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">+0.3 from last quarter</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                    <p className="text-2xl font-bold">94.2%</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-blue-600">Above industry average</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Training Completion</p>
                    <p className="text-2xl font-bold">87%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-purple-600">+12% this quarter</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Positions</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-orange-600">5 critical roles</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Average performance ratings by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { department: "Engineering", rating: 4.3, employees: 30 },
                    { department: "Product", rating: 4.5, employees: 10 },
                    { department: "Design", rating: 4.2, employees: 12 },
                    { department: "Marketing", rating: 4.1, employees: 16 },
                    { department: "Sales", rating: 4.0, employees: 20 },
                  ].map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{dept.department}</div>
                        <div className="text-sm text-gray-500">{dept.employees} employees</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{dept.rating}/5.0</div>
                        <Progress value={dept.rating * 20} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training & Development</CardTitle>
                <CardDescription>Employee development progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { program: "Technical Skills", completed: 45, total: 60, progress: 75 },
                    { program: "Leadership Training", completed: 12, total: 20, progress: 60 },
                    { program: "Safety Certification", completed: 88, total: 88, progress: 100 },
                    { program: "Communication Skills", completed: 32, total: 45, progress: 71 },
                  ].map((program, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{program.program}</span>
                        <span>{program.completed}/{program.total}</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>HR Metrics Trends</CardTitle>
              <CardDescription>Key HR metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                HR metrics trends chart would be implemented here with a charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}