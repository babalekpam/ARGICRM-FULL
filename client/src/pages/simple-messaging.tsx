import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail, MessageSquare, Users, CheckCircle, ArrowLeft } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-utils";
import { useSearch, useLocation } from "wouter";

export default function SimpleMessaging() {
  const [selectedTab, setSelectedTab] = useState("email");
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("announcement");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();
  const [location, setLocation] = useLocation();

  // Handle URL parameters from contact quick actions
  useEffect(() => {
    const params = new URLSearchParams(search);
    const recipient = params.get('recipient');
    const name = params.get('name');
    
    if (recipient) {
      setRecipients(recipient);
      if (name) {
        setSubject(`Message for ${name}`);
        toast({
          title: "Contact Pre-filled",
          description: `Ready to send message to ${name}`,
        });
      }
    }
  }, [search, toast]);

  // Get contacts for recipient selection
  const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/contacts", { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    },
  });

  // Handle different response formats - API returns array directly
  const contacts = Array.isArray(contactsResponse) ? contactsResponse : (contactsResponse?.contacts || []);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/simple-messaging/send", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully!",
        description: `Your ${selectedTab} message has been delivered.`,
      });
      setRecipients("");
      setSubject("");
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!recipients || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipients and message.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      type: selectedTab,
      recipients: recipients.split(",").map(r => r.trim()),
      subject: selectedTab === "email" ? subject : undefined,
      message,
      messageType,
    };

    sendMessageMutation.mutate(data);
  };

  const quickFillContacts = () => {
    if (contacts.length === 0) {
      toast({
        title: "No Contacts Found",
        description: "Please add contacts to your contact list first.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTab === "email") {
      // Use emails from contacts
      const emailList = contacts
        .filter((c: any) => c.email && c.email.trim())
        .slice(0, 10) // Get first 10 contacts with emails
        .map((c: any) => c.email.trim())
        .join(", ");
      
      if (emailList) {
        setRecipients(emailList);
        toast({
          title: "Contacts Added",
          description: `Added ${emailList.split(",").length} email addresses from your contacts.`,
        });
      } else {
        toast({
          title: "No Email Addresses",
          description: "Your contacts don't have email addresses. Please add emails to your contacts.",
          variant: "destructive",
        });
      }
    } else {
      // Use phone numbers from contacts
      const phoneList = contacts
        .filter((c: any) => c.phone && c.phone.trim())
        .slice(0, 10) // Get first 10 contacts with phone numbers
        .map((c: any) => c.phone.trim())
        .join(", ");
      
      if (phoneList) {
        setRecipients(phoneList);
        toast({
          title: "Contacts Added",
          description: `Added ${phoneList.split(",").length} phone numbers from your contacts.`,
        });
      } else {
        toast({
          title: "No Phone Numbers",
          description: "Your contacts don't have phone numbers. Please add phone numbers to your contacts.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Send className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Simple Messaging
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Send quick messages to your contacts via email or SMS with smart automation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Quick Messaging
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Multi-Channel
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Contact Integration
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {new URLSearchParams(search).get('recipient') && (
              <Button 
                variant="outline" 
                onClick={() => setLocation('/contacts')}
                className="bg-white shadow-md border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contacts
              </Button>
            )}
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Users className="w-4 h-4 mr-2" />
              Message Analytics
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Contacts</p>
                  <p className="text-2xl font-bold">{(contacts || []).length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages Sent Today</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Send className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Message Type Selection */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email messages will be sent to the provided email addresses
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-recipients">Recipients (Email Addresses)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="email-recipients"
                        placeholder="email1@example.com, email2@example.com"
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={quickFillContacts}>
                        Use Contacts
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-4 mt-6">
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    SMS messages will be sent to phone numbers (demo mode)
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="sms-recipients">Recipients (Phone Numbers)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="sms-recipients"
                      placeholder="+1234567890, +0987654321"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={quickFillContacts}>
                      Use Contacts
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Message Type */}
            <div>
              <Label htmlFor="message-type">Message Type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message Content */}
            <div>
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                placeholder={selectedTab === "email" 
                  ? "Enter your email message here..." 
                  : "Enter your SMS message here (keep it short)..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={selectedTab === "email" ? 6 : 3}
              />
              {selectedTab === "sms" && (
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/160 characters
                </p>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="w-full"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {selectedTab === "email" ? "Email" : "SMS"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Available Contacts Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Available Contacts
              {contactsLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="text-center py-4 text-gray-500">
                Loading your contacts...
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No contacts found. Add contacts to your contact list first.</p>
                <Button variant="outline" className="mt-2" asChild>
                  <a href="/contacts">Go to Contacts</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Showing first 10 contacts:</span>
                  <span>
                    {selectedTab === "email" 
                      ? `${contacts.filter((c: any) => c.email).length} with emails`
                      : `${contacts.filter((c: any) => c.phone).length} with phone numbers`
                    }
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {contacts.slice(0, 10).map((contact: any, index: number) => (
                    <div key={contact.id || index} className="p-2 border rounded-md text-sm">
                      <div className="font-medium">{contact.name || 'Unnamed Contact'}</div>
                      <div className="text-gray-600">
                        {selectedTab === "email" 
                          ? (contact.email || 'No email') 
                          : (contact.phone || 'No phone')
                        }
                      </div>
                    </div>
                  ))}
                </div>
                {contacts.length > 10 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    ... and {contacts.length - 10} more contacts
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "Welcome Message", content: "Welcome to our platform! We're excited to have you on board." },
                { name: "Meeting Reminder", content: "Don't forget about our meeting scheduled for tomorrow at 2 PM." },
                { name: "Thank You", content: "Thank you for your business! We appreciate your trust in our services." },
                { name: "Follow Up", content: "Just following up on our previous conversation. Let me know if you have any questions." },
              ].map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  className="text-left h-auto p-3"
                  onClick={() => setMessage(template.content)}
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500 truncate">{template.content}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}