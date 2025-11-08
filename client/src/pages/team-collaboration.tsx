import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Video, 
  FileText, 
  Users, 
  Clock, 
  Send, 
  Phone,
  Calendar,
  Share,
  Plus,
  Download,
  Upload,
  Settings
} from "lucide-react";
import Layout from "@/components/layout";
import { videoConferencingService } from "@/services/video-conferencing";

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'meeting';
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar: string;
}

// No more mock data - using real API data only

export default function TeamCollaborationPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [newMessage, setNewMessage] = useState("");
  
  // Fetch real data from APIs
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
  });
  
  const { data: chatMessages = [], isLoading: chatMessagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat-messages'],
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Update local messages when data is loaded
  useEffect(() => {
    if (chatMessages.length > 0) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);
  const [selectedProvider, setSelectedProvider] = useState("zoom");
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [meetingData, setMeetingData] = useState({
    topic: "",
    description: "",
    startTime: "",
    attendees: ""
  });
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: messages.length + 1,
      user: "You",
      message: newMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const startVideoCall = async () => {
    try {
      const provider = videoConferencingService.getProvider(selectedProvider);
      if (provider) {
        const result = await provider.startMeeting({
          topic: "Quick Team Meeting",
          participantEmails: teamMembers.map(m => m.email)
        });
        
        if (result.success) {
          alert(`${provider.name} meeting started!\n\nMeeting ID: ${result.meetingId}\nJoin URL: ${result.joinUrl}\n\nThe meeting will open in a new tab.`);
        } else {
          alert(`Failed to start meeting: ${result.error}`);
        }
      }
    } catch (error) {
      alert("Error starting video call. Please try again.");
    }
  };

  const startVoiceCall = () => {
    const provider = videoConferencingService.getProvider(selectedProvider);
    if (provider) {
      alert(`Starting voice call with ${provider.name}...\n\nFor voice-only meetings, you can join the video meeting and turn off your camera.`);
      startVideoCall();
    }
  };

  const shareScreen = async () => {
    try {
      await videoConferencingService.startScreenShare();
    } catch (error) {
      alert("Screen sharing failed. Please ensure you have granted the necessary permissions.");
    }
  };

  const validateMeetingForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate topic
    if (!meetingData.topic.trim()) {
      errors.topic = "Meeting title is required";
    } else if (meetingData.topic.trim().length < 3) {
      errors.topic = "Meeting title must be at least 3 characters";
    }
    
    // Validate start time
    if (!meetingData.startTime) {
      errors.startTime = "Meeting date and time is required";
    } else {
      const selectedDate = new Date(meetingData.startTime);
      const now = new Date();
      if (selectedDate <= now) {
        errors.startTime = "Meeting must be scheduled for a future date";
      }
    }
    
    // Validate attendees if provided
    if (meetingData.attendees.trim()) {
      const emails = meetingData.attendees.split(',').map(email => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of emails) {
        if (email && !emailRegex.test(email)) {
          errors.attendees = `Invalid email format: ${email}`;
          break;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const scheduleMeeting = async () => {
    if (!validateMeetingForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before scheduling the meeting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const provider = videoConferencingService.getProvider(selectedProvider);
      if (provider) {
        const result = await provider.scheduleMeeting({
          topic: meetingData.topic,
          startTime: new Date(meetingData.startTime),
          participantEmails: meetingData.attendees.split(',').map(email => email.trim()).filter(email => email)
        });

        if (result.success) {
          toast({
            title: "Meeting Scheduled Successfully!",
            description: `Your ${provider.name} meeting has been scheduled for ${result.startTime.toLocaleString()}`,
          });
          
          setIsSchedulingOpen(false);
          setMeetingData({ topic: "", description: "", startTime: "", attendees: "" });
          setValidationErrors({});
        } else {
          toast({
            title: "Scheduling Failed",
            description: "Unable to schedule the meeting. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while scheduling the meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadDocument = () => {
    alert("Document upload...\n\nChoose files to share with your team. Supported formats: PDF, DOC, XLS, PPT, images.");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
            <p className="text-gray-600">Real-time communication and collaboration tools</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Platform:</label>
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {videoConferencingService.getAvailableProviders().map((provider) => (
                  <option key={provider.name.toLowerCase().replace(' ', '')} value={provider.name.toLowerCase().replace(' ', '')}>
                    {provider.icon} {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={startVideoCall} className="bg-green-600 hover:bg-green-700">
              <Video className="h-4 w-4 mr-2" />
              Start Video Call
            </Button>
            <Button onClick={startVoiceCall} variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Voice Call
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Team Chat
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Video className="h-4 w-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                        {chatMessagesLoading ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-sm text-gray-500">Loading messages...</p>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No messages yet - Start a conversation with your team</p>
                          </div>
                        ) : (
                          <>
                          {messages.map((msg) => (
                            <div key={msg.id} className="mb-4">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">{msg.user}</span>
                              <span className="text-xs text-gray-500">
                                {msg.timestamp.toLocaleTimeString()}
                              </span>
                              {msg.type === 'file' && (
                                <Badge variant="secondary" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  File
                                </Badge>
                              )}
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              {msg.message}
                            </div>
                          </div>
                        ))}
                          </>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={uploadDocument}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Online Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMembersLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : teamMembers.filter(member => member.status === 'online').length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No team members online</p>
                    ) : (
                      <div className="space-y-3">
                        {teamMembers.filter(member => member.status === 'online').map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {member.avatar}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{member.status}</p>
                          </div>
                        </div>
                      ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={startVideoCall} className="w-full bg-green-600 hover:bg-green-700">
                    <Video className="h-4 w-4 mr-2" />
                    Start Instant Meeting
                  </Button>
                  <Button onClick={shareScreen} className="w-full" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share Screen
                  </Button>
                  <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule New Meeting - {videoConferencingService.getProvider(selectedProvider)?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="meeting-title">Meeting Title *</Label>
                          <Input 
                            id="meeting-title"
                            placeholder="Enter meeting title"
                            value={meetingData.topic}
                            onChange={(e) => {
                              setMeetingData(prev => ({ ...prev, topic: e.target.value }));
                              if (validationErrors.topic) {
                                setValidationErrors(prev => ({ ...prev, topic: '' }));
                              }
                            }}
                            className={validationErrors.topic ? "border-red-500" : ""}
                          />
                          {validationErrors.topic && (
                            <p className="text-sm text-red-500">{validationErrors.topic}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meeting-description">Meeting Description</Label>
                          <Textarea 
                            id="meeting-description"
                            placeholder="Optional meeting description"
                            rows={3}
                            value={meetingData.description}
                            onChange={(e) => setMeetingData(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meeting-time">Date & Time *</Label>
                          <Input 
                            id="meeting-time"
                            type="datetime-local" 
                            value={meetingData.startTime}
                            onChange={(e) => {
                              setMeetingData(prev => ({ ...prev, startTime: e.target.value }));
                              if (validationErrors.startTime) {
                                setValidationErrors(prev => ({ ...prev, startTime: '' }));
                              }
                            }}
                            className={validationErrors.startTime ? "border-red-500" : ""}
                          />
                          {validationErrors.startTime && (
                            <p className="text-sm text-red-500">{validationErrors.startTime}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meeting-attendees">Attendee Emails</Label>
                          <Input 
                            id="meeting-attendees"
                            placeholder="user@example.com, another@example.com"
                            value={meetingData.attendees}
                            onChange={(e) => {
                              setMeetingData(prev => ({ ...prev, attendees: e.target.value }));
                              if (validationErrors.attendees) {
                                setValidationErrors(prev => ({ ...prev, attendees: '' }));
                              }
                            }}
                            className={validationErrors.attendees ? "border-red-500" : ""}
                          />
                          {validationErrors.attendees && (
                            <p className="text-sm text-red-500">{validationErrors.attendees}</p>
                          )}
                          <p className="text-xs text-gray-500">Separate multiple emails with commas</p>
                        </div>

                        {Object.keys(validationErrors).length > 0 && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              Please fix the validation errors above before scheduling the meeting.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex space-x-2">
                          <Button 
                            onClick={scheduleMeeting} 
                            className="flex-1"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Scheduling..." : `Schedule on ${videoConferencingService.getProvider(selectedProvider)?.name}`}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsSchedulingOpen(false);
                              setValidationErrors({});
                              setMeetingData({ topic: "", description: "", startTime: "", attendees: "" });
                            }}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-sm">Team Standup</p>
                      <p className="text-xs text-gray-600">Today, 2:00 PM - Zoom</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => videoConferencingService.joinMeetingByUrl("https://zoom.us/j/123456789")}
                      >
                        Join Meeting
                      </Button>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-sm">Client Review</p>
                      <p className="text-xs text-gray-600">Tomorrow, 10:00 AM - Teams</p>
                      <Button size="sm" variant="outline" className="mt-2">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Meeting History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-sm">Project Kickoff</p>
                      <p className="text-xs text-gray-600">Yesterday, 45 minutes</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <Download className="h-3 w-3 mr-1" />
                        Recording
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-semibold text-sm">Project Proposal v2.1</p>
                          <p className="text-xs text-gray-600">Modified 2 hours ago by Emily</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Open</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-sm">Meeting Notes - June 23</p>
                          <p className="text-xs text-gray-600">Modified 1 day ago by Sarah</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Open</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Document Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={uploadDocument} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Document
                  </Button>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse All Files
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {teamMembersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-500">Invite team members to start collaborating</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                          {member.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                      </div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <Badge className={`mt-2 ${member.status === 'online' ? 'bg-green-100 text-green-800' : 
                        member.status === 'busy' ? 'bg-red-100 text-red-800' :
                        member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                        {member.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}