import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Search,
  Settings,
  Users,
  Clock,
  CheckCheck,
  AlertCircle,
  Bot,
  Zap,
  BarChart3,
  Download,
  Plus,
  Filter
} from "lucide-react";

const messageFormSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  contactId: z.string().min(1, "Contact is required"),
  messageType: z.enum(["text", "image", "document", "template"]).default("text"),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

const automationFormSchema = z.object({
  name: z.string().min(1, "Automation name is required"),
  trigger: z.enum(["keyword", "time_delay", "new_contact", "status_change"]),
  triggerValue: z.string().min(1, "Trigger value is required"),
  responseMessage: z.string().min(1, "Response message is required"),
  isActive: z.boolean().default(true),
});

type AutomationFormData = z.infer<typeof automationFormSchema>;

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center mb-1">
            <Avatar className="w-6 h-6 mr-2">
              <AvatarFallback className="text-xs">
                {message.contactName?.substring(0, 2).toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium">
              {message.contactName || 'Unknown Contact'}
            </span>
          </div>
        )}
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <div className={`flex items-center justify-between mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            <span className="text-xs">{formatTime(message.timestamp)}</span>
            {isOwn && (
              <div className="flex items-center space-x-1">
                {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                {message.status === 'sent' && <CheckCheck className="w-3 h-3 opacity-50" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactList({ contacts, selectedContact, onSelectContact }: { 
  contacts: any[]; 
  selectedContact: any; 
  onSelectContact: (contact: any) => void; 
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-muted' : ''
              }`}
            >
              <Avatar className="w-10 h-10 mr-3">
                <AvatarImage src={contact.profileImage} />
                <AvatarFallback>
                  {contact.name?.substring(0, 2).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">{contact.name || 'Unknown'}</h4>
                  <span className="text-xs text-muted-foreground">
                    {contact.lastMessageTime && new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.lastMessage || 'No messages yet'}
                  </p>
                  {contact.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                      {contact.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatWindow({ contact }: { contact: any }) {
  const [messageContent, setMessageContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/whatsapp/messages", contact?.id],
    enabled: !!contact?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; contactId: string }) => {
      return apiRequest("POST", "/api/whatsapp/send-message", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      setMessageContent("");
      toast({ title: "Message sent successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !contact) return;

    sendMessageMutation.mutate({
      content: messageContent,
      contactId: contact.id,
    });
  };

  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div>
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Select a contact</h3>
          <p className="text-sm text-muted-foreground">Choose a contact to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={contact.profileImage} />
            <AvatarFallback>
              {contact.name?.substring(0, 2).toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{contact.name || 'Unknown Contact'}</h3>
            <p className="text-sm text-muted-foreground">
              {contact.isOnline ? 'Online' : `Last seen ${contact.lastSeen ? new Date(contact.lastSeen).toLocaleDateString() : 'unknown'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.map((message: any) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.fromUser}
          />
        ))}
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="sm">
            <Smile className="w-4 h-4" />
          </Button>
          <Button 
            type="submit" 
            size="sm"
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function AutomationDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AutomationFormData>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      trigger: "keyword",
      isActive: true,
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (data: AutomationFormData) => {
      return apiRequest("POST", "/api/whatsapp/automations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/automations"] });
      toast({ title: "Automation created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating automation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AutomationFormData) => {
    createAutomationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Automation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create WhatsApp Automation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Automation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter automation name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trigger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="time_delay">Time Delay</SelectItem>
                      <SelectItem value="new_contact">New Contact</SelectItem>
                      <SelectItem value="status_change">Status Change</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triggerValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger Value</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter trigger value" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responseMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter response message" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAutomationMutation.isPending}>
                {createAutomationMutation.isPending ? "Creating..." : "Create Automation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function WhatsAppIntegration() {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("messages");

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/whatsapp/contacts"],
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["/api/whatsapp/automations"],
  });

  const { data: analytics = {} } = useQuery({
    queryKey: ["/api/whatsapp/analytics"],
  });

  if (contactsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Integration</h1>
          <p className="text-muted-foreground">
            Manage WhatsApp communications and automations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Chat
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Active Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeContacts || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bot className="w-4 h-4 mr-2 text-purple-600" />
              Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
            <p className="text-xs text-muted-foreground">Active rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <Card className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Contacts Sidebar */}
              <div className="border-r">
                <ContactList
                  contacts={contacts}
                  selectedContact={selectedContact}
                  onSelectContact={setSelectedContact}
                />
              </div>

              {/* Chat Window */}
              <div className="col-span-2">
                <ChatWindow contact={selectedContact} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">WhatsApp Automations</h3>
              <AutomationDialog />
            </div>

            <div className="grid gap-4">
              {automations.map((automation: any) => (
                <Card key={automation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={automation.isActive ? "default" : "secondary"}>
                          {automation.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Switch checked={automation.isActive} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Zap className="w-4 h-4 mr-2" />
                        Trigger: {automation.trigger} - "{automation.triggerValue}"
                      </div>
                      <p className="text-sm bg-muted p-2 rounded">
                        {automation.responseMessage}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Triggered {automation.triggerCount || 0} times</span>
                        <span>Created {new Date(automation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.messagesSent || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Messages Sent</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.messagesReceived || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Messages Received</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics.avgResponseTime || 0}m
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.unreadMessages || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Unread Messages</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-2" />
                    <p>Detailed analytics charts will be displayed here</p>
                    <p className="text-sm">Integration with chart libraries coming soon</p>
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