import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Video, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Star,
  Archive,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Bot,
  Globe
} from "lucide-react";

interface ConversationThread {
  id: string;
  customer: {
    name: string;
    avatar: string;
    email: string;
    phone: string;
  };
  channel: 'whatsapp' | 'sms' | 'email' | 'facebook' | 'instagram' | 'linkedin' | 'voice' | 'video';
  lastMessage: {
    content: string;
    timestamp: string;
    isFromCustomer: boolean;
  };
  status: 'active' | 'waiting' | 'resolved' | 'escalated';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  tags: string[];
  unreadCount: number;
}

interface ChannelStats {
  channel: string;
  icon: any;
  color: string;
  conversations: number;
  responseTime: string;
  satisfaction: number;
  growth: string;
}

const CHANNEL_STATS: ChannelStats[] = [
  {
    channel: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    conversations: 1247,
    responseTime: '2.3 min',
    satisfaction: 4.8,
    growth: '+23%'
  },
  {
    channel: 'SMS',
    icon: Phone,
    color: 'bg-blue-500',
    conversations: 856,
    responseTime: '4.1 min',
    satisfaction: 4.5,
    growth: '+12%'
  },
  {
    channel: 'Email',
    icon: Mail,
    color: 'bg-purple-500',
    conversations: 2134,
    responseTime: '1.2 hrs',
    satisfaction: 4.6,
    growth: '+8%'
  },
  {
    channel: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    conversations: 634,
    responseTime: '15.2 min',
    satisfaction: 4.3,
    growth: '+18%'
  },
  {
    channel: 'Instagram',
    icon: Instagram,
    color: 'bg-pink-500',
    conversations: 423,
    responseTime: '12.8 min',
    satisfaction: 4.7,
    growth: '+31%'
  },
  {
    channel: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    conversations: 189,
    responseTime: '3.2 hrs',
    satisfaction: 4.9,
    growth: '+45%'
  }
];

const SAMPLE_CONVERSATIONS: ConversationThread[] = [
  {
    id: '1',
    customer: {
      name: 'Sarah Johnson',
      avatar: '',
      email: 'sarah@example.com',
      phone: '+234 901 234 5678'
    },
    channel: 'whatsapp',
    lastMessage: {
      content: 'Hi, I need help with my order shipment tracking',
      timestamp: '2 minutes ago',
      isFromCustomer: true
    },
    status: 'active',
    priority: 'high',
    assignedTo: 'John Smith',
    tags: ['shipping', 'order-tracking'],
    unreadCount: 2
  },
  {
    id: '2',
    customer: {
      name: 'Michael Chen',
      avatar: '',
      email: 'michael@techcorp.com',
      phone: '+1 555 123 4567'
    },
    channel: 'email',
    lastMessage: {
      content: 'Thank you for the detailed proposal. We would like to schedule a demo.',
      timestamp: '15 minutes ago',
      isFromCustomer: true
    },
    status: 'waiting',
    priority: 'high',
    assignedTo: 'Emma Davis',
    tags: ['sales', 'demo'],
    unreadCount: 1
  },
  {
    id: '3',
    customer: {
      name: 'Fatima Al-Rashid',
      avatar: '',
      email: 'fatima@trading.ae',
      phone: '+971 50 123 4567'
    },
    channel: 'facebook',
    lastMessage: {
      content: 'Is your platform available in Arabic language?',
      timestamp: '1 hour ago',
      isFromCustomer: true
    },
    status: 'active',
    priority: 'medium',
    assignedTo: 'Ahmed Hassan',
    tags: ['localization', 'inquiry'],
    unreadCount: 3
  }
];

export default function OmnichannelHub() {
  const [activeTab, setActiveTab] = useState("conversations");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationThread | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/omnichannel/conversations", selectedChannel],
    enabled: activeTab === "conversations"
  });

  // Fetch channel analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/omnichannel/analytics"],
    enabled: activeTab === "analytics"
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => 
      fetch("/api/omnichannel/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData)
      }).then(res => res.json()),
    onSuccess: () => {
      setMessageText("");
      toast({
        title: "Message Sent",
        description: "Your message has been delivered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/omnichannel/conversations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: messageText,
      channel: selectedConversation.channel
    });
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      whatsapp: MessageCircle,
      sms: Phone,
      email: Mail,
      facebook: Facebook,
      instagram: Instagram,
      linkedin: Linkedin,
      voice: Phone,
      video: Video
    };
    return icons[channel as keyof typeof icons] || MessageCircle;
  };

  const getChannelColor = (channel: string) => {
    const colors = {
      whatsapp: 'text-green-600',
      sms: 'text-blue-600',
      email: 'text-purple-600',
      facebook: 'text-blue-700',
      instagram: 'text-pink-600',
      linkedin: 'text-blue-800',
      voice: 'text-orange-600',
      video: 'text-red-600'
    };
    return colors[channel as keyof typeof colors] || 'text-gray-600';
  };

  const ConversationList = () => (
    <div className="space-y-2">
      {SAMPLE_CONVERSATIONS.filter(conv => 
        !selectedChannel || conv.channel === selectedChannel
      ).filter(conv =>
        !searchQuery || 
        conv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(conversation => {
        const ChannelIcon = getChannelIcon(conversation.channel);
        return (
          <Card 
            key={conversation.id} 
            className={`cursor-pointer transition-colors ${
              selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={conversation.customer.avatar} />
                  <AvatarFallback>{conversation.customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium truncate">{conversation.customer.name}</h4>
                      <ChannelIcon className={`h-4 w-4 ${getChannelColor(conversation.channel)}`} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={conversation.priority === 'high' ? 'destructive' : conversation.priority === 'medium' ? 'default' : 'secondary'}>
                        {conversation.priority}
                      </Badge>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs px-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                    {conversation.lastMessage.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{conversation.lastMessage.timestamp}</span>
                    <div className="flex items-center space-x-1">
                      {conversation.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const ConversationView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <MessageCircle className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
          <p className="text-sm text-center">Choose a conversation from the list to start messaging</p>
        </div>
      );
    }

    const ChannelIcon = getChannelIcon(selectedConversation.channel);

    return (
      <div className="flex flex-col h-full">
        {/* Conversation Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedConversation.customer.avatar} />
                <AvatarFallback>
                  {selectedConversation.customer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedConversation.customer.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ChannelIcon className={`h-4 w-4 ${getChannelColor(selectedConversation.channel)}`} />
                  <span className="capitalize">{selectedConversation.channel}</span>
                  <span>•</span>
                  <span>{selectedConversation.customer.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm" variant="outline">
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button size="sm" variant="outline">
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Sample messages */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
              <p className="text-sm">Hello! How can I help you today?</p>
              <span className="text-xs opacity-75 mt-1 block">10:30 AM</span>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-xs">
              <p className="text-sm">{selectedConversation.lastMessage.content}</p>
              <span className="text-xs text-gray-500 mt-1 block">{selectedConversation.lastMessage.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="border-t p-4">
          <div className="flex items-end space-x-2">
            <Button size="sm" variant="outline">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Mic className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[60px] max-h-32 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button onClick={handleSendMessage} disabled={!messageText.trim() || sendMessageMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost">
                <Bot className="h-4 w-4 mr-1" />
                AI Assist
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Omnichannel Communication Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unified messaging across WhatsApp, SMS, Email, and Social Media
            </p>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Channel Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
              {/* Conversations List */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button size="sm" variant="outline">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedChannel === null ? "default" : "outline"}
                    onClick={() => setSelectedChannel(null)}
                  >
                    All
                  </Button>
                  {['whatsapp', 'email', 'sms', 'facebook', 'instagram'].map(channel => {
                    const Icon = getChannelIcon(channel);
                    return (
                      <Button
                        key={channel}
                        size="sm"
                        variant={selectedChannel === channel ? "default" : "outline"}
                        onClick={() => setSelectedChannel(channel)}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        <span className="capitalize">{channel}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="overflow-y-auto h-[600px]">
                  <ConversationList />
                </div>
              </div>

              {/* Conversation View */}
              <div className="lg:col-span-2 border rounded-lg">
                <ConversationView />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Channel Overview</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Monitor performance and manage settings for all communication channels
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CHANNEL_STATS.map(channel => {
                const IconComponent = channel.icon;
                return (
                  <Card key={channel.channel}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 ${channel.color} rounded-lg`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <CardTitle>{channel.channel}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {channel.growth}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold">{channel.conversations}</div>
                            <p className="text-sm text-gray-600">Conversations</p>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{channel.responseTime}</div>
                            <p className="text-sm text-gray-600">Avg Response</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{channel.satisfaction}</span>
                            <span className="text-sm text-gray-600">/5.0</span>
                          </div>
                          <Button size="sm" variant="outline">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Marketing Campaigns</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create and manage multi-channel marketing campaigns
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Launch</CardTitle>
                  <CardDescription>WhatsApp + Email campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Sent:</span>
                      <span className="font-medium">15,234</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Opened:</span>
                      <span className="font-medium">8,567 (56.2%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Clicked:</span>
                      <span className="font-medium">2,341 (15.4%)</span>
                    </div>
                    <Button size="sm" className="w-full">View Details</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Survey</CardTitle>
                  <CardDescription>SMS + Social Media</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Sent:</span>
                      <span className="font-medium">8,923</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Responses:</span>
                      <span className="font-medium">3,421 (38.3%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">2,876 (32.2%)</span>
                    </div>
                    <Button size="sm" className="w-full">View Results</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center h-full p-6">
                  <Plus className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium mb-2">Create New Campaign</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Launch multi-channel campaigns across all platforms
                  </p>
                  <Button>Get Started</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Communication Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Deep insights into customer communication patterns and channel performance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">23,567</div>
                  <p className="text-sm text-gray-600">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">94.2%</div>
                  <p className="text-sm text-gray-600">Average across channels</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">4.7/5</div>
                  <p className="text-sm text-gray-600">Based on 1,234 ratings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">12 min</div>
                  <p className="text-sm text-gray-600">Average first response</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Communication Automation</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up automated responses and intelligent routing across all channels
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Response Rules</CardTitle>
                  <CardDescription>Intelligent automated responses based on context</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Welcome Message</div>
                        <div className="text-sm text-gray-600">New customer greeting</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Order Status</div>
                        <div className="text-sm text-gray-600">Automatic order updates</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Smart Routing</CardTitle>
                  <CardDescription>Automatically route conversations to the right agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Sales Inquiries</div>
                        <div className="text-sm text-gray-600">Route to sales team</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Technical Support</div>
                        <div className="text-sm text-gray-600">Route to tech team</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    </div>
                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Routing
                    </Button>
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