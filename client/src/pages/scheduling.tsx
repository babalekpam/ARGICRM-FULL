import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import Layout from "@/components/layout";
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Video, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Bell,
  BarChart3,
  Settings,
  Target,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: number;
  title: string;
  contact: string;
  date: Date;
  time: string;
  duration: number;
  type: 'meeting' | 'call' | 'demo' | 'consultation';
  location?: string;
  description?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export default function SchedulingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState("calendar");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    contact: '',
    date: '',
    time: '',
    duration: 60,
    type: 'meeting' as const,
    location: '',
    description: '',
    status: 'scheduled' as const
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: () => fetch("/api/appointments").then((res) => res.json()),
  });

  // Update appointments when data changes
  useEffect(() => {
    if (appointmentsData && Array.isArray(appointmentsData)) {
      const mappedAppointments = appointmentsData.map((apt: any) => ({
        ...apt,
        date: new Date(apt.date)
      }));
      setAppointments(mappedAppointments);
    }
  }, [appointmentsData]);

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      setNewAppointment({
        title: '',
        contact: '',
        date: '',
        time: '',
        duration: 60,
        type: 'meeting',
        location: '',
        description: '',
        status: 'scheduled'
      });
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive",
      });
    }
  });

  const handleCreateAppointment = () => {
    if (!newAppointment.title || !newAppointment.contact || !newAppointment.date || !newAppointment.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      title: newAppointment.title,
      contact: newAppointment.contact,
      date: newAppointment.date,
      time: newAppointment.time,
      duration: newAppointment.duration,
      type: newAppointment.type,
      location: newAppointment.location,
      description: newAppointment.description,
      status: newAppointment.status
    });
  };

  const todaysAppointments = appointments.filter(apt => 
    apt.date.toDateString() === new Date().toDateString()
  );

  const upcomingAppointments = appointments.filter(apt => 
    apt.date > new Date() && apt.date.toDateString() !== new Date().toDateString()
  ).slice(0, 5);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              Calendar & Scheduling
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage appointments, meetings, and schedule optimization
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={newAppointment.title}
                        onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                        placeholder="Meeting title"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact *</label>
                      <Input
                        value={newAppointment.contact}
                        onChange={(e) => setNewAppointment({...newAppointment, contact: e.target.value})}
                        placeholder="Contact name or email"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Time *</label>
                      <Input
                        type="time"
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Select value={newAppointment.duration.toString()} onValueChange={(value) => setNewAppointment({...newAppointment, duration: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={newAppointment.type} onValueChange={(value: any) => setNewAppointment({...newAppointment, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="demo">Demo</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={newAppointment.location}
                        onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                        placeholder="Meeting location or link"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newAppointment.description}
                      onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleCreateAppointment} disabled={createAppointmentMutation.isPending} className="flex-1">
                      {createAppointmentMutation.isPending ? 'Creating...' : 'Create Appointment'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
        </div>

        {/* Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar">
              <CalendarDays className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-2" data-testid="tab-today">
              <Clock className="h-4 w-4" />
              Today's Schedule
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2" data-testid="tab-upcoming">
              <Bell className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="calendar" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>
                      Appointments for {selectedDate?.toLocaleDateString() || 'Selected Date'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No appointments scheduled</p>
                        <p className="text-sm mt-2">Click "New Appointment" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{appointment.title}</h3>
                                <p className="text-sm text-gray-600">{appointment.contact}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {appointment.time}
                                  </div>
                                  <div className="flex items-center">
                                    <Video className="h-3 w-3 mr-1" />
                                    {appointment.type}
                                  </div>
                                  {appointment.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {appointment.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="today" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todaysAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{appointment.title}</h3>
                              <p className="text-sm text-gray-600">{appointment.contact}</p>
                              <p className="text-sm text-gray-500">{appointment.time} - {appointment.duration} minutes</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{appointment.title}</h3>
                              <p className="text-sm text-gray-600">{appointment.contact}</p>
                              <p className="text-sm text-gray-500">
                                {appointment.date.toLocaleDateString()} at {appointment.time}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {appointment.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Scheduling Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Scheduling Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Settings panel coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}