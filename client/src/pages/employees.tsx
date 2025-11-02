import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, UserCog, Mail, Phone, Calendar, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Employee } from "@shared/schema";

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [employeeStatus, setEmployeeStatus] = useState("active");
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();

  const { data: employeesData, isLoading, refetch } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      console.log('Fetching employees...');
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched employee data:", data);
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const employees = employeesData || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Submitting employee data:', data);
      const response = await apiRequest("POST", "/api/employees", data);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Employee creation failed:', errorData);
        throw new Error(`Failed to create employee: ${response.status} ${errorData}`);
      }
      const result = await response.json();
      console.log('Employee creation response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Employee created successfully:', data);
      
      // Show success message first
      setShowSuccess(true);
      
      // Update data
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.refetchQueries({ queryKey: ["/api/employees"] });
      refetch();
      
      // Wait 2 seconds to show success message, then close form
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        
        // Reset form element values
        const form = document.querySelector('form');
        if (form) {
          form.reset();
        }
        
        // Close any lingering popovers
        const popoverContents = document.querySelectorAll('[data-radix-popover-content]');
        popoverContents.forEach(popover => {
          const popoverEl = popover as HTMLElement;
          popoverEl.style.display = 'none';
        });
      }, 2000);
    },
    onError: (error) => {
      console.error('Employee creation error:', error);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setHireDate(undefined);
    setEndDate(undefined);
    setDateOfBirth(undefined);
    setEmployeeStatus("active");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-yellow-100 text-yellow-800";
      case "terminated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateEmployeeId = () => {
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EMP${randomId}`;
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

  console.log('Employees data:', employees);
  console.log('Employees length:', employees.length);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <UserCog className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Employee Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage your team and employee information with HR intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                HR Management
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Team Analytics
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Smart Tracking
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <UserCog className="w-4 h-4 mr-2" />
              Team Analytics
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found. Click "Add Employee" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee: Employee) => {
            const manager = employees.find((e: any) => e.id === employee.manager);
            
            return (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <UserCog className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg">
                      {employee.firstName} {employee.lastName}
                    </CardTitle>
                  </div>
                  <Badge className={getStatusColor(employee.status || "active")}>
                    {employee.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employee.employeeId && (
                      <div className="text-sm text-gray-500">
                        ID: {employee.employeeId}
                      </div>
                    )}

                    {employee.position && (
                      <div className="font-medium text-blue-600">
                        {employee.position}
                      </div>
                    )}

                    {employee.department && (
                      <div className="text-sm text-gray-600">
                        Department: {employee.department}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {employee.email}
                      </div>
                      
                      {employee.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {employee.phone}
                        </div>
                      )}
                    </div>

                    {employee.hireDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Hired: {new Date(employee.hireDate).toLocaleDateString()}
                      </div>
                    )}

                    {manager && (
                      <div className="text-sm text-gray-600">
                        Manager: {manager.firstName} {manager.lastName}
                      </div>
                    )}

                    {employee.salary && (
                      <div className="text-sm font-medium text-green-600">
                        Salary: ${parseFloat(employee.salary).toLocaleString()}/year
                      </div>
                    )}

                    {employee.address && (
                      <div className="text-xs text-gray-500">
                        {employee.address}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">Employee created successfully!</p>
                  </div>
                  <p className="text-green-600 text-sm mt-1">The form will close automatically...</p>
                </div>
              )}
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  employeeId: formData.get("employeeId") || generateEmployeeId(),
                  firstName: formData.get("firstName"),
                  lastName: formData.get("lastName"),
                  email: formData.get("email"),
                  phone: formData.get("phone"),
                  department: formData.get("department"),
                  position: formData.get("position"),
                  manager: formData.get("manager") && formData.get("manager") !== "none" ? parseInt(formData.get("manager") as string) : null,
                  hireDate: hireDate ? hireDate.toISOString().split('T')[0] : null,
                  salary: formData.get("salary") || null,
                  status: employeeStatus,
                  address: formData.get("address"),
                  dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
                  endDate: endDate ? endDate.toISOString().split('T')[0] : null,
                });
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input 
                      name="employeeId" 
                      placeholder="Employee ID" 
                      defaultValue={generateEmployeeId()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Employment Status</Label>
                    <Select value={employeeStatus} onValueChange={setEmployeeStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input name="firstName" placeholder="First Name" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input name="lastName" placeholder="Last Name" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input name="email" type="email" placeholder="Email" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input name="phone" placeholder="Phone" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input name="department" placeholder="Department" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input name="position" placeholder="Position" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select name="manager">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salary">Annual Salary</Label>
                    <Input name="salary" type="number" step="0.01" placeholder="Annual Salary" />
                  </div>
                  
                  {/* Hire Date */}
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      type="date"
                      value={hireDate ? format(hireDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          setHireDate(new Date(value));
                        } else {
                          setHireDate(undefined);
                        }
                      }}
                      max={format(new Date(), "yyyy-MM-dd")}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      type="date"
                      value={dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          setDateOfBirth(new Date(value));
                        } else {
                          setDateOfBirth(undefined);
                        }
                      }}
                      min="1900-01-01"
                      max={format(new Date(), "yyyy-MM-dd")}
                      className="w-full"
                    />
                  </div>
                  
                  {/* End Date (only shown for terminated employees) */}
                  {employeeStatus === "terminated" && (
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        type="date"
                        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            setEndDate(new Date(value));
                          } else {
                            setEndDate(undefined);
                          }
                        }}
                        min={hireDate ? format(hireDate, "yyyy-MM-dd") : "1900-01-01"}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea name="address" placeholder="Address" rows={2} />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Add Employee"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
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