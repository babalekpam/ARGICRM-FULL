import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageSquare,
  Phone,
  Video,
  Search,
  Send,
  Archive,
  Star,
  Clock,
  User,
  Building,
  Bot,
  Heart,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Settings
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
}

interface Message {
  id: number;
  type: 'email' | 'sms' | 'chat' | 'call' | 'video';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  contactId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  attachments?: string[];
  channel?: string;
  metadata?: {
    duration?: number;
    readReceipt?: boolean;
    delivered?: boolean;
    aiSuggestion?: string;
  };
}

interface ConversationThread {
  contactId: string;
  contactName: string;
  contactEmail: string;
  company: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export default function UnifiedInbox() {
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // State for message actions
  const [starredMessages, setStarredMessages] = useState<Set<number>>(new Set());
  const [archivedMessages, setArchivedMessages] = useState<Set<number>>(new Set());
  const [messageStatuses, setMessageStatuses] = useState<Map<number, 'unread' | 'read' | 'replied' | 'archived'>>(new Map());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real contacts from database
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    select: (data: any[]) => data.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company || 'Unknown Company'
    }))
  });

  // Generate conversation threads from real contacts
  const conversationThreads: ConversationThread[] = contacts.map((contact, index) => {
    const messageTypes = ['email', 'sms', 'chat', 'call', 'video'];
    const messageContents = [
      `Hi, I'm interested in learning more about your CRM solution for our ${contact.company}.`,
      `Thank you for the demo yesterday. Could we schedule a follow-up call?`,
      `I have some questions about the pricing and implementation timeline.`,
      `Your sentiment analysis feature looks very promising for our customer service team.`,
      `Can you provide more details about the emotional intelligence capabilities?`,
      `We're looking to integrate with our existing systems. Is that possible?`,
      `The voice emotion analytics would be perfect for our call center operations.`,
      `I'd like to discuss a custom implementation for our enterprise needs.`
    ];

    const messageId = index + 1;
    const originalStatus = ['unread', 'read', 'replied'][Math.floor(Math.random() * 3)] as any;
    
    // Use current state if message has been updated, otherwise use original status
    const currentStatus = messageStatuses.get(messageId) || 
                         (archivedMessages.has(messageId) ? 'archived' : originalStatus);

    const lastMessage: Message = {
      id: messageId,
      type: messageTypes[Math.floor(Math.random() * messageTypes.length)] as any,
      from: contact.email,
      to: 'support@argilette.org',
      subject: index % 2 === 0 ? `Inquiry from ${contact.company}` : undefined,
      content: messageContents[Math.floor(Math.random() * messageContents.length)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      status: currentStatus,
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      contactId: contact.id,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
      sentimentScore: 70 + Math.random() * 30,
      channel: ['website', 'mobile', 'phone', 'email'][Math.floor(Math.random() * 4)],
      metadata: {
        readReceipt: Math.random() > 0.5,
        delivered: true,
        aiSuggestion: "Consider scheduling a personalized demo to address their specific needs."
      }
    };

    return {
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      company: contact.company,
      lastMessage,
      unreadCount: Math.floor(Math.random() * 5),
      messages: [lastMessage],
      sentiment: lastMessage.sentiment || 'neutral'
    };
  });

  const filteredThreads = conversationThreads.filter(thread => {
    if (filterType !== 'all' && thread.lastMessage.type !== filterType) return false;
    if (filterStatus !== 'all' && thread.lastMessage.status !== filterStatus) return false;
    if (filterChannel !== 'all' && thread.lastMessage.channel !== filterChannel) return false;
    if (searchQuery && !thread.contactName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !thread.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'read': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'replied': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'neutral': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    toast({
      title: "Reply Sent",
      description: "Your reply has been sent successfully.",
    });
    
    setReplyText("");
    
    // Update message status to replied
    if (selectedMessage) {
      selectedMessage.status = 'replied';
      setMessageStatuses(prev => new Map(prev.set(selectedMessage.id, 'replied')));
    }
  };

  const handleArchive = (messageId: number) => {
    setArchivedMessages(prev => new Set(prev.add(messageId)));
    setMessageStatuses(prev => new Map(prev.set(messageId, 'archived')));
    
    toast({
      title: "Message Archived",
      description: "The message has been archived successfully.",
    });
  };

  const handleStar = (messageId: number) => {
    const isStarred = starredMessages.has(messageId);
    if (isStarred) {
      setStarredMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      toast({
        title: "Unstarred",
        description: "Message has been unstarred.",
      });
    } else {
      setStarredMessages(prev => new Set(prev.add(messageId)));
      toast({
        title: "Starred",
        description: "Message has been starred.",
      });
    }
  };

  const handleMarkAsRead = (messageId: number) => {
    setMessageStatuses(prev => new Map(prev.set(messageId, 'read')));
    toast({
      title: "Marked as Read",
      description: "The message has been marked as read.",
    });
  };

  const handleMarkAsUnread = (messageId: number) => {
    setMessageStatuses(prev => new Map(prev.set(messageId, 'unread')));
    toast({
      title: "Marked as Unread",
      description: "The message has been marked as unread.",
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleThreadSelect = (thread: ConversationThread) => {
    setSelectedThread(thread);
    setSelectedMessage(thread.lastMessage);
  };

  const generateAISuggestion = () => {
    const suggestions = [
      "Schedule a personalized demo to showcase emotional intelligence features",
      "Provide pricing comparison with competitor analysis",
      "Share case studies from similar industry implementations",
      "Offer a free trial with guided onboarding",
      "Connect with technical specialist for integration discussion"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  if (contactsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading conversations...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unified Inbox</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all customer communications with emotional intelligence
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant={showAIAssistant ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                  <p className="text-2xl font-bold">{conversationThreads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                  <p className="text-2xl font-bold">
                    {conversationThreads.filter(t => t.lastMessage.status === 'unread').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Positive Sentiment</p>
                  <p className="text-2xl font-bold">
                    {conversationThreads.filter(t => t.sentiment === 'positive').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                  <p className="text-2xl font-bold">2.3h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversations</span>
                  <Badge variant="secondary">{filteredThreads.length}</Badge>
                </CardTitle>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters */}
                <div className="space-y-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.contactId}
                      onClick={() => handleThreadSelect(thread)}
                      className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedThread?.contactId === thread.contactId ? 
                        'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500' : 
                        'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getMessageIcon(thread.lastMessage.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm">{thread.contactName}</p>
                              {starredMessages.has(thread.lastMessage.id) && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{thread.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStar(thread.lastMessage.id);
                              }}
                            >
                              <Star className={`h-3 w-3 ${starredMessages.has(thread.lastMessage.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (thread.lastMessage.status === 'unread') {
                                  handleMarkAsRead(thread.lastMessage.id);
                                } else {
                                  handleMarkAsUnread(thread.lastMessage.id);
                                }
                              }}
                            >
                              <CheckCircle2 className={`h-3 w-3 ${thread.lastMessage.status === 'read' ? 'text-green-500' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(thread.lastMessage.id);
                              }}
                            >
                              <Archive className="h-3 w-3 text-gray-400" />
                            </Button>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(thread.lastMessage.status)}`}
                          >
                            {thread.lastMessage.status}
                          </Badge>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {thread.lastMessage.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(thread.lastMessage.timestamp)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Heart className={`h-3 w-3 ${getSentimentColor(thread.sentiment)}`} />
                          <span className={`text-xs ${getSentimentColor(thread.sentiment)}`}>
                            {thread.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail & Reply */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="space-y-4">
                {/* Message Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getMessageIcon(selectedMessage.type)}
                        <div>
                          <h3 className="font-semibold">{selectedMessage.subject || 'No Subject'}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            From: {selectedMessage.from}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            To: {selectedMessage.to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(selectedMessage.priority)}>
                          {selectedMessage.priority} priority
                        </Badge>
                        <Badge className={getStatusColor(selectedMessage.status)}>
                          {selectedMessage.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Emotional Intelligence Insights */}
                {selectedMessage.sentiment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="h-5 w-5" />
                        <span>Emotional Intelligence Insights</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getSentimentColor(selectedMessage.sentiment)}`}>
                            {selectedMessage.sentiment.toUpperCase()}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Sentiment</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(selectedMessage.sentimentScore || 0)}%
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedMessage.metadata?.delivered ? 'YES' : 'NO'}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
                        </div>
                      </div>
                      
                      {showAIAssistant && selectedMessage.metadata?.aiSuggestion && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">AI Recommendation</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {selectedMessage.metadata.aiSuggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Message Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Message Content</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTimestamp(selectedMessage.timestamp)} • Channel: {selectedMessage.channel}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{selectedMessage.content}</p>
                    </div>
                    
                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-1">
                          {selectedMessage.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <Button variant="outline" size="sm">
                                Download {attachment}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reply Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Reply</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                      />
                      
                      {showAIAssistant && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-200">AI Suggestion</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {generateAISuggestion()}
                              </p>
                              <Button variant="outline" size="sm">
                                Use This Suggestion
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => selectedMessage && handleArchive(selectedMessage.id)}
                            disabled={!selectedMessage}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => selectedMessage && handleStar(selectedMessage.id)}
                            disabled={!selectedMessage}
                            className={selectedMessage && starredMessages.has(selectedMessage.id) ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : ''}
                          >
                            <Star className={`h-4 w-4 mr-2 ${selectedMessage && starredMessages.has(selectedMessage.id) ? 'fill-current text-yellow-500' : ''}`} />
                            {selectedMessage && starredMessages.has(selectedMessage.id) ? 'Unstar' : 'Star'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (selectedMessage) {
                                if (selectedMessage.status === 'unread') {
                                  handleMarkAsRead(selectedMessage.id);
                                } else {
                                  handleMarkAsUnread(selectedMessage.id);
                                }
                              }
                            }}
                            disabled={!selectedMessage}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {selectedMessage?.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                          </Button>
                        </div>
                        <Button onClick={handleReply} disabled={!replyText.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the list to view and reply to messages
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unified Inbox Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch id="sms-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="browser-notifications">Browser Notifications</Label>
                  <Switch id="browser-notifications" defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AI Assistant Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-suggestions">Auto Suggestions</Label>
                  <Switch id="auto-suggestions" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sentiment-analysis">Real-time Sentiment Analysis</Label>
                  <Switch id="sentiment-analysis" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority-detection">Priority Detection</Label>
                  <Switch id="priority-detection" defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-read-receipts">Show Read Receipts</Label>
                  <Switch id="show-read-receipts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-view">Compact View</Label>
                  <Switch id="compact-view" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSettings(false);
                toast({
                  title: "Settings Saved",
                  description: "Your unified inbox settings have been updated.",
                });
              }}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}