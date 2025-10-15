import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  User, 
  Clock, 
  TrendingUp, 
  Activity, 
  ArrowRight, 
  Calendar,
  Target,
  Users,
  BarChart3,
  Eye,
  Plus,
  Search
} from "lucide-react";

interface JourneyStage {
  id: string;
  name: string;
  displayName: string;
  description: string;
  stageType: string;
  sortOrder: number;
  color: string;
  icon: string;
  isActive: boolean;
}

interface JourneyEvent {
  id: string;
  contactId: string;
  eventType: string;
  eventName: string;
  description: string;
  fromStage: string | null;
  toStage: string | null;
  metadata: any;
  triggeredBy: string;
  eventDate: string;
}

interface JourneyProgress {
  id: string;
  contactId: string;
  currentStage: string;
  stageEntryDate: string;
  totalDurationInStage: number;
  interactionCount: number;
  lastInteractionDate: string;
  journeyScore: number;
  completedMilestones: string[];
  nextPredictedStage: string | null;
  stageConfidence: number | null;
  estimatedTimeToNextStage: number | null;
  riskScore: number | null;
}

interface ContactJourney {
  contact: any;
  currentProgress: JourneyProgress | null;
  events: JourneyEvent[];
  stages: JourneyStage[];
  metrics: {
    totalEvents: number;
    stageChanges: number;
    timeInCurrentStage: number;
    journeyStartDate: string | null;
    journeyDuration: number;
  };
}

interface JourneyAnalytics {
  stageDistribution: Record<string, number>;
  conversionRates: Record<string, number>;
  averageStageTime: Record<string, number>;
  topEvents: Array<{ event: string; count: number }>;
  journeyVelocity: number;
  totalContacts: number;
}

export default function CustomerJourneyPage() {
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journey stages
  const { data: stages = [] } = useQuery<JourneyStage[]>({
    queryKey: ["/api/customer-journey/stages"],
  });

  // Fetch contacts for selection
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Fetch contact journey data
  const { data: contactJourney, isLoading: isLoadingJourney } = useQuery<ContactJourney>({
    queryKey: ["/api/customer-journey/contact", selectedContactId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/customer-journey/contact/${selectedContactId}`);
      return response.json();
    },
    enabled: !!selectedContactId,
  });

  // Fetch journey analytics
  const { data: analytics } = useQuery<JourneyAnalytics>({
    queryKey: ["/api/customer-journey/analytics", timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));
      
      const response = await apiRequest("GET", `/api/customer-journey/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return response.json();
    },
  });

  // Track journey event mutation
  const trackEventMutation = useMutation({
    mutationFn: (eventData: any) => apiRequest("POST", "/api/customer-journey/events", eventData),
    onSuccess: () => {
      toast({
        title: "Event Tracked",
        description: "Journey event has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-journey/contact", selectedContactId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to track journey event.",
        variant: "destructive",
      });
    },
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ contactId, newStage }: { contactId: string; newStage: string }) =>
      apiRequest("PUT", `/api/customer-journey/progress/${contactId}`, { newStage, triggeredBy: "manual" }),
    onSuccess: () => {
      toast({
        title: "Stage Updated",
        description: "Customer journey stage has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-journey/contact", selectedContactId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update journey stage.",
        variant: "destructive",
      });
    },
  });

  const filteredContacts = (contacts || []).filter((contact: any) =>
    contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageColor = (stageId: string) => {
    const stage = (stages || []).find(s => s.id === stageId);
    return stage?.color || "#3B82F6";
  };

  const getStageName = (stageId: string) => {
    const stage = (stages || []).find(s => s.id === stageId);
    return stage?.displayName || stageId;
  };

  const formatDuration = (days: number) => {
    if (days < 1) return "Less than 1 day";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Journey Visualization</h1>
          <p className="text-muted-foreground">
            Track and visualize customer interactions through their journey
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Journey</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalContacts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In journey system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Journey Velocity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.journeyVelocity || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  Average lead to customer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Stages</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stages?.filter(s => s.isActive).length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Journey stages configured
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Event</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.topEvents?.[0]?.event.slice(0, 12) || "None"}...
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.topEvents?.[0]?.count || 0} occurrences
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Journey Stage Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Journey Stage Flow</CardTitle>
              <CardDescription>
                Visual representation of customer journey stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-4">
                {(stages || [])
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2 min-w-fit">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: stage.color }}
                        >
                          {analytics?.stageDistribution?.[stage.displayName] || 0}
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {stage.displayName}
                        </Badge>
                      </div>
                      {index < stages.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Distribution</CardTitle>
              <CardDescription>
                Current distribution of contacts across journey stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics?.stageDistribution || {}).map(([stage, count]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{stage}</span>
                      <span>{count} contacts</span>
                    </div>
                    <Progress 
                      value={(count / (analytics?.totalContacts || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Contact</CardTitle>
              <CardDescription>
                Choose a contact to view their detailed customer journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Contacts</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact-select">Contact</Label>
                  <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                    <SelectTrigger id="contact-select" className="w-[300px]">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredContacts.map((contact: any) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedContactId && contactJourney && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Journey Progress</CardTitle>
                  <CardDescription>
                    Current stage and progress metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getStageColor(contactJourney.currentProgress?.currentStage || "") }}
                    >
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {getStageName(contactJourney.currentProgress?.currentStage || "")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Current Stage
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Journey Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {contactJourney.currentProgress?.journeyScore || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Interactions</p>
                      <p className="text-2xl font-bold">
                        {contactJourney.currentProgress?.interactionCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Time in Current Stage</span>
                      <span>{formatDuration(contactJourney.metrics.timeInCurrentStage)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Journey Duration</span>
                      <span>{formatDuration(contactJourney.metrics.journeyDuration)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Track Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Track Journey Event</DialogTitle>
                          <DialogDescription>
                            Record a new interaction or milestone for this contact
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="event-type">Event Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="interaction">Interaction</SelectItem>
                                <SelectItem value="milestone">Milestone</SelectItem>
                                <SelectItem value="touchpoint">Touchpoint</SelectItem>
                                <SelectItem value="stage_change">Stage Change</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input placeholder="e.g., Email Opened, Demo Completed" />
                          </div>
                          <Button 
                            onClick={() => {
                              trackEventMutation.mutate({
                                contactId: selectedContactId,
                                eventType: "interaction",
                                eventName: "Manual Event",
                                description: "Manually tracked event",
                                metadata: { channel: "manual" },
                                eventDate: new Date().toISOString()
                              });
                            }}
                            disabled={trackEventMutation.isPending}
                          >
                            Track Event
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Target className="h-4 w-4 mr-2" />
                          Update Stage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Journey Stage</DialogTitle>
                          <DialogDescription>
                            Move this contact to a different journey stage
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="new-stage">New Stage</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select new stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {(stages || []).map((stage) => (
                                  <SelectItem key={stage.id} value={stage.id}>
                                    {stage.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={() => {
                              updateStageMutation.mutate({
                                contactId: selectedContactId,
                                newStage: "qualified_lead"
                              });
                            }}
                            disabled={updateStageMutation.isPending}
                          >
                            Update Stage
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Journey Timeline</CardTitle>
                  <CardDescription>
                    Chronological view of customer interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {(contactJourney.events || []).map((event) => (
                        <div key={event.id} className="flex gap-4 pb-4 border-b">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{event.eventName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {event.eventType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(event.eventDate).toLocaleDateString()} at{" "}
                                {new Date(event.eventDate).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="time-range">Time Range</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger id="time-range" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>
                  Stage-to-stage conversion performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.conversionRates || {}).map(([conversion, rate]) => (
                    <div key={conversion} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{conversion}</span>
                        <span>{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Stage Time</CardTitle>
                <CardDescription>
                  How long contacts spend in each stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.averageStageTime || {}).map(([stage, days]) => (
                    <div key={stage} className="flex justify-between items-center">
                      <span className="text-sm">{stage}</span>
                      <Badge variant="outline">
                        {formatDuration(days as number)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>
                  Most frequent journey events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(analytics?.topEvents || []).map((event, index) => (
                    <div key={event.event} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{event.event}</span>
                      </div>
                      <Badge variant="outline">
                        {event.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journey Insights</CardTitle>
                <CardDescription>
                  Key insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Journey Velocity</p>
                      <p className="text-xs text-muted-foreground">
                        Average time to convert: {analytics?.journeyVelocity || 0} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Stage Performance</p>
                      <p className="text-xs text-muted-foreground">
                        Monitor conversion rates between stages for optimization opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}