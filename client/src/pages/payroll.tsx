import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Calculator,
  Settings,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

interface PayrollMetrics {
  totalEmployees: number;
  currentPeriodGrossPay: number;
  upcomingPayDate: string | null;
  pendingTaxFilings: number;
  ytdTotalWages: number;
  ytdTotalTaxes: number;
}

interface PayrollProfile {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollId: string;
  payType: string;
  baseSalary: number;
  hourlyRate: number;
  payFrequency: string;
  isActive: boolean;
}

interface PayrollPeriod {
  id: string;
  periodName: string;
  payFrequency: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxes: number;
  totalDeductions: number;
  employeeCount: number;
}

interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  basePay: number;
  overtimePay: number;
  bonusPay: number;
  grossPay: number;
  totalTaxes: number;
  totalDeductions: number;
  netPay: number;
  status: string;
}

interface TimeSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  regularHours: number;
  overtimeHours: number;
  vacationHours: number;
  sickHours: number;
  status: string;
}

const payrollProfileSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  payrollId: z.string().min(1, "Payroll ID is required"),
  payType: z.enum(["salary", "hourly", "commission", "contract"]),
  baseSalary: z.number().min(0),
  hourlyRate: z.number().min(0),
  payFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly"]),
  currency: z.string().default("USD"),
});

const payrollPeriodSchema = z.object({
  periodName: z.string().min(1, "Period name is required"),
  payFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  payDate: z.string().min(1, "Pay date is required"),
});

const timeSheetSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  workDate: z.string().min(1, "Work date is required"),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  regularHours: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).max(24),
  breakTime: z.number().min(0).max(8),
  vacationHours: z.number().min(0).max(24),
  sickHours: z.number().min(0).max(24),
  taskDescription: z.string().optional(),
  location: z.string().optional(),
});

export default function PayrollPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showTimeSheetDialog, setShowTimeSheetDialog] = useState(false);

  // Fetch payroll metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<PayrollMetrics>({
    queryKey: ["/api/payroll/metrics"],
  });

  // Fetch payroll profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<PayrollProfile[]>({
    queryKey: ["/api/payroll/profiles"],
  });

  // Fetch payroll periods
  const { data: periods = [], isLoading: periodsLoading } = useQuery<PayrollPeriod[]>({
    queryKey: ["/api/payroll/periods"],
  });

  // Fetch payroll entries for selected period
  const { data: entries = [], isLoading: entriesLoading } = useQuery<PayrollEntry[]>({
    queryKey: ["/api/payroll/entries", selectedPeriod],
    enabled: !!selectedPeriod,
  });

  // Fetch time sheets
  const { data: timeSheets = [], isLoading: timeSheetsLoading } = useQuery<TimeSheet[]>({
    queryKey: ["/api/payroll/timesheets"],
  });

  // Create payroll profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: z.infer<typeof payrollProfileSchema>) =>
      apiRequest("POST", "/api/payroll/profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/metrics"] });
      setShowProfileDialog(false);
      toast({ title: "Success", description: "Payroll profile created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create payroll period mutation
  const createPeriodMutation = useMutation({
    mutationFn: (data: z.infer<typeof payrollPeriodSchema>) =>
      apiRequest("POST", "/api/payroll/periods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/periods"] });
      setShowPeriodDialog(false);
      toast({ title: "Success", description: "Payroll period created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: (periodId: string) =>
      apiRequest("POST", `/api/payroll/periods/${periodId}/process`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/metrics"] });
      toast({ title: "Success", description: "Payroll processed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Time sheet mutation
  const createTimeSheetMutation = useMutation({
    mutationFn: (data: z.infer<typeof timeSheetSchema>) =>
      apiRequest("POST", "/api/payroll/timesheets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/timesheets"] });
      setShowTimeSheetDialog(false);
      toast({ title: "Success", description: "Time sheet entry created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Forms
  const profileForm = useForm<z.infer<typeof payrollProfileSchema>>({
    resolver: zodResolver(payrollProfileSchema),
    defaultValues: {
      payType: "salary",
      baseSalary: 0,
      hourlyRate: 0,
      payFrequency: "bi-weekly",
      currency: "USD",
    },
  });

  const periodForm = useForm<z.infer<typeof payrollPeriodSchema>>({
    resolver: zodResolver(payrollPeriodSchema),
    defaultValues: {
      payFrequency: "bi-weekly",
    },
  });

  const timeSheetForm = useForm<z.infer<typeof timeSheetSchema>>({
    resolver: zodResolver(timeSheetSchema),
    defaultValues: {
      regularHours: 8,
      overtimeHours: 0,
      breakTime: 1,
      vacationHours: 0,
      sickHours: 0,
      workDate: new Date().toISOString().split('T')[0],
    },
  });

  const onCreateProfile = (data: z.infer<typeof payrollProfileSchema>) => {
    createProfileMutation.mutate(data);
  };

  const onCreatePeriod = (data: z.infer<typeof payrollPeriodSchema>) => {
    createPeriodMutation.mutate(data);
  };

  const onCreateTimeSheet = (data: z.infer<typeof timeSheetSchema>) => {
    createTimeSheetMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (metricsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-gray-600">Comprehensive payroll processing and employee management</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowTimeSheetDialog(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
            <Button onClick={() => setShowProfileDialog(true)}>
              <Users className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button onClick={() => setShowPeriodDialog(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              New Pay Period
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Employees</p>
                  <p className="text-2xl font-bold">{metrics?.totalEmployees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Period</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.currentPeriodGrossPay || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Pay Date</p>
                  <p className="text-lg font-semibold">
                    {metrics?.upcomingPayDate ? new Date(metrics.upcomingPayDate).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Filings</p>
                  <p className="text-2xl font-bold">{metrics?.pendingTaxFilings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">YTD Wages</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.ytdTotalWages || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Calculator className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">YTD Taxes</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.ytdTotalTaxes || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="periods" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="periods">Pay Periods</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="timesheets">Time Sheets</TabsTrigger>
            <TabsTrigger value="payroll">Current Payroll</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Pay Periods Tab */}
          <TabsContent value="periods" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pay Periods</CardTitle>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select pay period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.periodName} - {new Date(period.payDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {periodsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {periods.map((period) => (
                        <div key={period.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{period.periodName}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(period.status)}>
                                {period.status}
                              </Badge>
                              {period.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={() => processPayrollMutation.mutate(period.id)}
                                  disabled={processPayrollMutation.isPending}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Process
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Employees</p>
                              <p className="font-semibold">{period.employeeCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Gross Pay</p>
                              <p className="font-semibold">{formatCurrency(period.totalGrossPay)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Taxes</p>
                              <p className="font-semibold">{formatCurrency(period.totalTaxes)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Net Pay</p>
                              <p className="font-semibold">{formatCurrency(period.totalNetPay)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Payroll Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profilesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {profiles.map((profile) => (
                        <div key={profile.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{profile.employeeName}</h3>
                              <p className="text-sm text-gray-600">ID: {profile.payrollId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(profile.isActive ? 'active' : 'inactive')}>
                                {profile.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-600">Pay Type</p>
                              <p className="font-semibold capitalize">{profile.payType}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                {profile.payType === 'salary' ? 'Annual Salary' : 'Hourly Rate'}
                              </p>
                              <p className="font-semibold">
                                {profile.payType === 'salary' 
                                  ? formatCurrency(profile.baseSalary)
                                  : `${formatCurrency(profile.hourlyRate)}/hr`
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Pay Frequency</p>
                              <p className="font-semibold capitalize">{profile.payFrequency.replace('-', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Next Pay</p>
                              <p className="font-semibold">
                                {metrics?.upcomingPayDate ? new Date(metrics.upcomingPayDate).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Sheets Tab */}
          <TabsContent value="timesheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Time Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeSheetsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {timeSheets.map((timeSheet) => (
                        <div key={timeSheet.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{timeSheet.employeeName}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(timeSheet.workDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(timeSheet.status)}>
                              {timeSheet.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-600">Regular Hours</p>
                              <p className="font-semibold">{timeSheet.regularHours}h</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Overtime Hours</p>
                              <p className="font-semibold">{timeSheet.overtimeHours}h</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Vacation Hours</p>
                              <p className="font-semibold">{timeSheet.vacationHours}h</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Sick Hours</p>
                              <p className="font-semibold">{timeSheet.sickHours}h</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Payroll Tab */}
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Payroll Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedPeriod ? (
                    entriesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {entries.map((entry) => (
                          <div key={entry.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{entry.employeeName}</h3>
                                <Badge className={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Net Pay</p>
                                <p className="text-2xl font-bold">{formatCurrency(entry.netPay)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-gray-600">Base Pay</p>
                                <p className="font-semibold">{formatCurrency(entry.basePay)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Overtime</p>
                                <p className="font-semibold">{formatCurrency(entry.overtimePay)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Gross Pay</p>
                                <p className="font-semibold">{formatCurrency(entry.grossPay)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Taxes</p>
                                <p className="font-semibold">{formatCurrency(entry.totalTaxes)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Deductions</p>
                                <p className="font-semibold">{formatCurrency(entry.totalDeductions)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Select a pay period to view payroll entries</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2">Payroll Summary</h3>
                  <p className="text-sm text-gray-600">Overview of payroll costs and trends</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h3 className="font-semibold mb-2">Tax Reports</h3>
                  <p className="text-sm text-gray-600">Federal and state tax filings</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <PieChart className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                  <h3 className="font-semibold mb-2">Benefits Analysis</h3>
                  <p className="text-sm text-gray-600">Employee benefits breakdown</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 mx-auto text-orange-600 mb-4" />
                  <h3 className="font-semibold mb-2">Time & Attendance</h3>
                  <p className="text-sm text-gray-600">Hours worked and attendance patterns</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
                  <h3 className="font-semibold mb-2">Cost Analysis</h3>
                  <p className="text-sm text-gray-600">Labor cost trends and forecasting</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Download className="h-12 w-12 mx-auto text-red-600 mb-4" />
                  <h3 className="font-semibold mb-2">Export Data</h3>
                  <p className="text-sm text-gray-600">Download payroll data and reports</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Payroll Profile</DialogTitle>
            </DialogHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onCreateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <FormControl>
                          <Input placeholder="Select employee..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="payrollId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payroll ID</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="payType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pay Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="payFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pay Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="65000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25.00"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowProfileDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProfileMutation.isPending}>
                    Create Profile
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pay Period</DialogTitle>
            </DialogHeader>
            <Form {...periodForm}>
              <form onSubmit={periodForm.handleSubmit(onCreatePeriod)} className="space-y-4">
                <FormField
                  control={periodForm.control}
                  name="periodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Name</FormLabel>
                      <FormControl>
                        <Input placeholder="January 2025 - Period 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={periodForm.control}
                  name="payFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={periodForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={periodForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={periodForm.control}
                    name="payDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pay Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowPeriodDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPeriodMutation.isPending}>
                    Create Period
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showTimeSheetDialog} onOpenChange={setShowTimeSheetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Sheet Entry</DialogTitle>
            </DialogHeader>
            <Form {...timeSheetForm}>
              <form onSubmit={timeSheetForm.handleSubmit(onCreateTimeSheet)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={timeSheetForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <FormControl>
                          <Input placeholder="Select employee..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={timeSheetForm.control}
                    name="workDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={timeSheetForm.control}
                    name="regularHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={timeSheetForm.control}
                    name="overtimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overtime Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={timeSheetForm.control}
                    name="vacationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vacation Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={timeSheetForm.control}
                    name="sickHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sick Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.25"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={timeSheetForm.control}
                  name="taskDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the work performed..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowTimeSheetDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTimeSheetMutation.isPending}>
                    Add Entry
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}