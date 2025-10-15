import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { reputationPredictor, type ReputationPrediction } from "@/services/reputation-predictor";
import { 
  Star, 
  MessageCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Reply,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Clock,
  MapPin,
  User,
  Calendar,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Filter,
  Search,
  Bell,
  Settings,
  ExternalLink,
  Plus,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Activity,
  Target,
  Shield,
  Lightbulb
} from "lucide-react";
import Layout from "@/components/layout";
import { ProtectedFeature } from "@/components/protected-feature";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  platform: 'Google' | 'Yelp' | 'Facebook' | 'TripAdvisor' | 'Amazon' | 'Trustpilot';
  rating: number;
  title: string;
  content: string;
  reviewer: {
    name: string;
    avatar?: string;
    verified: boolean;
    reviewCount: number;
  };
  date: Date;
  location?: string;
  status: 'new' | 'responded' | 'flagged' | 'resolved';
  response?: {
    content: string;
    date: Date;
    author: string;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  helpful: number;
  device: 'mobile' | 'desktop';
}

interface ReputationMetrics {
  overallRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  monthlyTrend: { month: string; rating: number; count: number }[];
  platformBreakdown: { platform: string; rating: number; count: number; change: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  responseRate: number;
  averageResponseTime: number; // in hours
}

const mockReviews: Review[] = [
  {
    id: 1,
    platform: 'Google',
    rating: 5,
    title: "Excellent service and professional team!",
    content: "I had an amazing experience with this company. The team was professional, responsive, and delivered exactly what they promised. Highly recommended!",
    reviewer: {
      name: "Sarah Johnson",
      verified: true,
      reviewCount: 15
    },
    date: new Date(2025, 5, 22),
    location: "New York, NY",
    status: 'new',
    sentiment: 'positive',
    keywords: ['professional', 'responsive', 'excellent'],
    helpful: 8,
    device: 'desktop'
  },
  {
    id: 2,
    platform: 'Yelp',
    rating: 2,
    title: "Disappointing experience",
    content: "The service was slower than expected and communication could have been better. Not what I was hoping for given the reviews.",
    reviewer: {
      name: "Mike Chen",
      verified: true,
      reviewCount: 23
    },
    date: new Date(2025, 5, 20),
    status: 'flagged',
    sentiment: 'negative',
    keywords: ['slow', 'communication', 'disappointing'],
    helpful: 3,
    device: 'mobile'
  },
  {
    id: 3,
    platform: 'Facebook',
    rating: 4,
    title: "Good overall experience",
    content: "Solid service with good results. The team was helpful and the pricing was fair. Would use again.",
    reviewer: {
      name: "Jennifer Davis",
      verified: true,
      reviewCount: 8
    },
    date: new Date(2025, 5, 18),
    status: 'responded',
    sentiment: 'positive',
    keywords: ['solid', 'helpful', 'fair pricing'],
    helpful: 12,
    device: 'mobile',
    response: {
      content: "Thank you Jennifer! We're glad you had a positive experience with our team. We look forward to working with you again.",
      date: new Date(2025, 5, 19),
      author: "Customer Service Team"
    }
  },
  {
    id: 4,
    platform: 'TripAdvisor',
    rating: 1,
    title: "Poor customer service",
    content: "Very disappointed with the customer service. Issues were not resolved promptly and staff seemed unprofessional.",
    reviewer: {
      name: "Robert Wilson",
      verified: false,
      reviewCount: 3
    },
    date: new Date(2025, 5, 15),
    status: 'new',
    sentiment: 'negative',
    keywords: ['disappointed', 'unprofessional', 'poor service'],
    helpful: 1,
    device: 'desktop'
  },
  {
    id: 5,
    platform: 'Trustpilot',
    rating: 5,
    title: "Outstanding results!",
    content: "Exceeded all expectations. The project was completed ahead of schedule and the quality was top-notch. Fantastic team to work with!",
    reviewer: {
      name: "Lisa Anderson",
      verified: true,
      reviewCount: 31
    },
    date: new Date(2025, 5, 12),
    status: 'responded',
    sentiment: 'positive',
    keywords: ['exceeded expectations', 'top-notch', 'fantastic'],
    helpful: 15,
    device: 'desktop',
    response: {
      content: "Lisa, thank you so much for this wonderful review! We're thrilled we could exceed your expectations and deliver quality results.",
      date: new Date(2025, 5, 13),
      author: "Management Team"
    }
  }
];

const mockMetrics: ReputationMetrics = {
  overallRating: 4.2,
  totalReviews: 147,
  ratingDistribution: { 5: 65, 4: 32, 3: 18, 2: 12, 1: 20 },
  monthlyTrend: [
    { month: 'Jan', rating: 4.1, count: 23 },
    { month: 'Feb', rating: 4.0, count: 28 },
    { month: 'Mar', rating: 4.3, count: 31 },
    { month: 'Apr', rating: 4.2, count: 25 },
    { month: 'May', rating: 4.4, count: 22 },
    { month: 'Jun', rating: 4.2, count: 18 }
  ],
  platformBreakdown: [
    { platform: 'Google', rating: 4.5, count: 68, change: 5.2 },
    { platform: 'Yelp', rating: 3.8, count: 34, change: -2.1 },
    { platform: 'Facebook', rating: 4.3, count: 25, change: 3.4 },
    { platform: 'TripAdvisor', rating: 4.0, count: 12, change: 1.8 },
    { platform: 'Trustpilot', rating: 4.6, count: 8, change: 8.3 }
  ],
  sentimentBreakdown: { positive: 72, neutral: 18, negative: 10 },
  responseRate: 68,
  averageResponseTime: 4.2
};

export default function ReputationManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [reviews, setReviews] = useState(mockReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<ReputationPrediction[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1_week' | '1_month' | '3_months' | '6_months'>('1_month');
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isAddPlatformDialogOpen, setIsAddPlatformDialogOpen] = useState(false);
  const [newPlatformData, setNewPlatformData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    apiKey: ''
  });
  const [alertSettings, setAlertSettings] = useState({
    newReviews: true,
    negativeReviews: true,
    responseReminders: true,
    weeklySummary: false
  });
  const [keywords, setKeywords] = useState(['customer service', 'quality', 'professional', 'pricing', 'delivery', 'communication']);
  const [newKeyword, setNewKeyword] = useState('');

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
    switch (platform) {
      case 'Google': return <Globe className={iconClass} />;
      case 'Yelp': return <MapPin className={iconClass} />;
      case 'Facebook': return <User className={iconClass} />;
      default: return <Star className={iconClass} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge variant="default">New</Badge>;
      case 'responded': return <Badge variant="secondary">Responded</Badge>;
      case 'flagged': return <Badge variant="destructive">Flagged</Badge>;
      case 'resolved': return <Badge variant="outline">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const openResponseDialog = (review: Review) => {
    setSelectedReview(review);
    setResponseText("");
    setIsResponseDialogOpen(true);
  };

  const submitResponse = () => {
    if (!selectedReview || !responseText.trim()) return;

    const updatedReviews = reviews.map(review =>
      review.id === selectedReview.id
        ? {
            ...review,
            status: 'responded' as const,
            response: {
              content: responseText,
              date: new Date(),
              author: "Customer Service Team"
            }
          }
        : review
    );

    setReviews(updatedReviews);
    setIsResponseDialogOpen(false);
    setSelectedReview(null);
    setResponseText("");
  };

  const flagReview = (reviewId: number) => {
    const updatedReviews = reviews.map(review =>
      review.id === reviewId
        ? { ...review, status: 'flagged' as const }
        : review
    );
    setReviews(updatedReviews);
  };

  const filteredReviews = reviews.filter(review => {
    const matchesPlatform = filterPlatform === "all" || review.platform === filterPlatform;
    const matchesStatus = filterStatus === "all" || review.status === filterStatus;
    const matchesRating = filterRating === "all" || 
      (filterRating === "5" && review.rating === 5) ||
      (filterRating === "4" && review.rating === 4) ||
      (filterRating === "3" && review.rating === 3) ||
      (filterRating === "1-2" && review.rating <= 2);
    const matchesSearch = searchQuery === "" || 
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewer.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPlatform && matchesStatus && matchesRating && matchesSearch;
  });

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    console.log('🔮 Starting prediction analysis...');
    setIsLoadingPrediction(true);
    try {
      const timeframes: Array<'1_week' | '1_month' | '3_months' | '6_months'> = 
        ['1_week', '1_month', '3_months', '6_months'];
      
      console.log('📊 Generating predictions for timeframes:', timeframes);
      
      const predictionPromises = timeframes.map(timeframe => 
        reputationPredictor.predictReputationScore(timeframe)
      );
      
      const results = await Promise.all(predictionPromises);
      console.log('✅ Predictions generated successfully:', results);
      setPredictions(results);
      
      // Show success feedback
      toast({
        title: "AI Predictions Generated",
        description: "Successfully analyzed reputation trends for all timeframes. Check the detailed analysis below.",
        duration: 4000,
      });
    } catch (error) {
      console.error('❌ Failed to load predictions:', error);
      toast({
        title: "Prediction Failed",
        description: "Failed to generate AI predictions. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const getPredictionForTimeframe = (timeframe: string) => {
    return predictions.find(p => p.timeframe === timeframe);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreChangeColor = (current: number, predicted: number) => {
    const diff = predicted - current;
    if (diff > 0.1) return "text-green-600";
    if (diff < -0.1) return "text-red-600";
    return "text-gray-600";
  };

  const handleAddPlatform = () => {
    // Add platform logic here
    console.log('Adding platform:', newPlatformData);
    
    toast({
      title: "Platform Added",
      description: `Successfully connected ${newPlatformData.name} for reputation monitoring.`,
      duration: 3000,
    });
    
    // Reset form and close dialog
    setNewPlatformData({
      name: '',
      url: '',
      username: '',
      password: '',
      apiKey: ''
    });
    setIsAddPlatformDialogOpen(false);
  };

  const handleSaveSettings = () => {
    // Settings save logic here
    console.log('Saving settings...');
    
    toast({
      title: "Settings Saved",
      description: "Your reputation management settings have been updated successfully.",
      duration: 3000,
    });
    
    setIsSettingsDialogOpen(false);
  };

  const toggleAlertSetting = (settingKey: keyof typeof alertSettings) => {
    setAlertSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
    
    toast({
      title: "Alert Setting Updated",
      description: `${settingKey.replace(/([A-Z])/g, ' $1').toLowerCase()} ${alertSettings[settingKey] ? 'disabled' : 'enabled'}.`,
      duration: 2000,
    });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords(prev => [...prev, newKeyword.trim().toLowerCase()]);
      setNewKeyword('');
      
      toast({
        title: "Keyword Added",
        description: `Now monitoring "${newKeyword.trim()}" in reviews.`,
        duration: 2000,
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
    
    toast({
      title: "Keyword Removed",
      description: `No longer monitoring "${keyword}" in reviews.`,
      duration: 2000,
    });
  };

  return (
    <Layout>
      <ProtectedFeature 
        requiredFeature="reputation_basic"
        fallbackTitle="Reputation Management"
        fallbackDescription="Reputation management features require Professional plan or higher."
      >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reputation Management</h1>
            <p className="text-gray-600">Monitor and manage your online reputation across all platforms</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setIsAddPlatformDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageCircle className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="predictor">
              <Brain className="h-4 w-4 mr-2" />
              AI Predictor
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Overall Rating</span>
                    <div className={`text-2xl font-bold ${getRatingColor(mockMetrics.overallRating)}`}>
                      {mockMetrics.overallRating}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {renderStars(mockMetrics.overallRating, "md")}
                    <span className="text-sm text-gray-600">({mockMetrics.totalReviews} reviews)</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{mockMetrics.responseRate}%</div>
                  <Progress value={mockMetrics.responseRate} className="mt-2" />
                  <p className="text-sm text-gray-600 mt-1">Target: 80%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{mockMetrics.averageResponseTime}h</div>
                  <p className="text-sm text-gray-600">24h faster than average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Positive</span>
                      <span>{mockMetrics.sentimentBreakdown.positive}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Neutral</span>
                      <span>{mockMetrics.sentimentBreakdown.neutral}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Negative</span>
                      <span>{mockMetrics.sentimentBreakdown.negative}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.platformBreakdown.map((platform) => (
                      <div key={platform.platform} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getPlatformIcon(platform.platform)}
                          <div>
                            <p className="font-medium">{platform.platform}</p>
                            <p className="text-sm text-gray-600">{platform.count} reviews</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {renderStars(platform.rating, "sm")}
                            <span className="font-semibold">{platform.rating}</span>
                          </div>
                          <div className={`text-sm flex items-center ${
                            platform.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {platform.change >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(platform.change)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm w-8">{rating} ★</span>
                        <Progress 
                          value={(mockMetrics.ratingDistribution[rating] / mockMetrics.totalReviews) * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm w-8 text-right">
                          {mockMetrics.ratingDistribution[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Yelp">Yelp</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                    <SelectItem value="Trustpilot">Trustpilot</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="1-2">1-2 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredReviews.length} of {reviews.length} reviews
              </div>
            </div>

            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(review.platform)}
                          <span className="font-medium">{review.platform}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="font-semibold">{review.title}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{review.reviewer.name}</span>
                            {review.reviewer.verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{review.date.toLocaleDateString()}</span>
                            {review.location && (
                              <>
                                <span>•</span>
                                <MapPin className="h-3 w-3" />
                                <span>{review.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(review.status)}
                        {review.device === 'mobile' ? (
                          <Smartphone className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Monitor className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{review.content}</p>

                    {review.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {review.response && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Reply className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-600">Response from {review.response.author}</span>
                          <span className="text-sm text-gray-600">
                            {review.response.date.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.response.content}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.helpful} helpful</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {review.sentiment}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open('#', '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Original
                        </Button>
                        {review.status !== 'responded' && (
                          <Button
                            size="sm"
                            onClick={() => openResponseDialog(review)}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Respond
                          </Button>
                        )}
                        {review.status !== 'flagged' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => flagReview(review.id)}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            Flag
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Response Dialog */}
            <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Respond to Review</DialogTitle>
                </DialogHeader>
                {selectedReview && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(selectedReview.rating)}
                        <span className="font-medium">{selectedReview.title}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{selectedReview.content}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        by {selectedReview.reviewer.name} on {selectedReview.platform}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Response</label>
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write a professional response to this review..."
                        rows={6}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Character count: {responseText.length}/1000
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Best Practices:</strong> Be professional, acknowledge their feedback, 
                        offer solutions if applicable, and thank them for their review.
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={submitResponse} className="flex-1">
                        <Reply className="h-4 w-4 mr-2" />
                        Submit Response
                      </Button>
                      <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="predictor" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">AI-Powered Reputation Score Predictor</h2>
                <p className="text-gray-600">Advanced machine learning predictions for your reputation trajectory</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_week">1 Week</SelectItem>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                    <SelectItem value="6_months">6 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadPredictions} disabled={isLoadingPrediction}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isLoadingPrediction ? "Analyzing..." : "Predict"}
                </Button>
              </div>
            </div>

            {/* Prediction Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {predictions.map((prediction) => (
                <Card key={prediction.timeframe} className={`${selectedTimeframe === prediction.timeframe ? 'border-blue-500 shadow-lg' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{prediction.timeframe.replace('_', ' ')}</span>
                      <div className={`text-2xl font-bold ${getScoreChangeColor(mockMetrics.overallRating, prediction.predictedRating)}`}>
                        {prediction.predictedRating.toFixed(1)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence</span>
                        <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={prediction.confidence * 100} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Change: {(prediction.predictedRating - mockMetrics.overallRating > 0 ? '+' : '')}{(prediction.predictedRating - mockMetrics.overallRating).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Analysis for Selected Timeframe */}
            {(() => {
              const selectedPrediction = getPredictionForTimeframe(selectedTimeframe);
              if (!selectedPrediction) return null;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        Scenario Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-800">Best Case</span>
                          <span className="text-2xl font-bold text-green-600">
                            {selectedPrediction.scenarioAnalysis.bestCase.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-800">Most Likely</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {selectedPrediction.scenarioAnalysis.mostLikely.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-medium text-red-800">Worst Case</span>
                          <span className="text-2xl font-bold text-red-600">
                            {selectedPrediction.scenarioAnalysis.worstCase.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-purple-600" />
                        Prediction Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(selectedPrediction.factors).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={value * 100} className="w-20 h-2" />
                              <span className="text-sm font-medium">{(value * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPrediction.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-yellow-800">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-red-600" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPrediction.risks.map((risk, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-red-800">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Opportunities Section */}
            {(() => {
              const selectedPrediction = getPredictionForTimeframe(selectedTimeframe);
              if (!selectedPrediction || selectedPrediction.opportunities.length === 0) return null;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Growth Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPrediction.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  AI Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Accuracy</p>
                    <p className="text-2xl font-bold text-purple-700">78%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Precision</p>
                    <p className="text-2xl font-bold text-blue-700">82%</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Recall</p>
                    <p className="text-2xl font-bold text-green-700">75%</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">F1 Score</p>
                    <p className="text-2xl font-bold text-orange-700">78%</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Model Info:</strong> Our AI predictor uses advanced machine learning algorithms trained on 
                    historical reputation data, sentiment analysis, and market trends to provide accurate predictions 
                    with continuous learning capabilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Rating Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.monthlyTrend.map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">{month.count} reviews</span>
                          <div className="flex items-center space-x-1">
                            {renderStars(month.rating, "sm")}
                            <span className="font-semibold">{month.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review Response Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Response Rate</span>
                      <span className="font-semibold">{mockMetrics.responseRate}%</span>
                    </div>
                    <Progress value={mockMetrics.responseRate} />
                    
                    <div className="flex justify-between items-center">
                      <span>Avg Response Time</span>
                      <span className="font-semibold">{mockMetrics.averageResponseTime} hours</span>
                    </div>
                    <Progress value={75} />

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Response Goals</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Target Response Rate:</span>
                          <span>80%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Response Time:</span>
                          <span>24 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Keyword Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Most Positive</p>
                    <p className="text-lg font-bold text-green-700">Professional</p>
                    <p className="text-xs text-green-600">23 mentions</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Trending Up</p>
                    <p className="text-lg font-bold text-blue-700">Quality</p>
                    <p className="text-xs text-blue-600">+40% this month</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Needs Attention</p>
                    <p className="text-lg font-bold text-red-700">Communication</p>
                    <p className="text-xs text-red-600">8 negative mentions</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Watch</p>
                    <p className="text-lg font-bold text-yellow-700">Timing</p>
                    <p className="text-xs text-yellow-600">Mixed sentiment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Reviews</p>
                      <p className="text-sm text-gray-600">Get notified of new reviews</p>
                    </div>
                    <Button 
                      variant={alertSettings.newReviews ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('newReviews')}
                    >
                      {alertSettings.newReviews ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Negative Reviews (≤2 stars)</p>
                      <p className="text-sm text-gray-600">Immediate alerts for low ratings</p>
                    </div>
                    <Button 
                      variant={alertSettings.negativeReviews ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('negativeReviews')}
                    >
                      {alertSettings.negativeReviews ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Response Reminders</p>
                      <p className="text-sm text-gray-600">Remind to respond within 24 hours</p>
                    </div>
                    <Button 
                      variant={alertSettings.responseReminders ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('responseReminders')}
                    >
                      {alertSettings.responseReminders ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-gray-600">Weekly reputation report</p>
                    </div>
                    <Button 
                      variant={alertSettings.weeklySummary ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('weeklySummary')}
                    >
                      {alertSettings.weeklySummary ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">New 1-star review</p>
                        <p className="text-sm text-red-600">TripAdvisor • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Response reminder</p>
                        <p className="text-sm text-blue-600">Yelp review pending • 18 hours</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">New 5-star review</p>
                        <p className="text-sm text-green-600">Google • 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                      <XCircle 
                        className="h-3 w-3 ml-2 cursor-pointer hover:text-red-600" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add keyword to monitor..." 
                    className="flex-1" 
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword();
                      }
                    }}
                  />
                  <Button onClick={addKeyword} disabled={!newKeyword.trim()}>Add</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reputation Management Settings</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Notification Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Email Notifications</h4>
                      <p className="text-xs text-gray-600">Receive email alerts for new reviews</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">SMS Alerts</h4>
                      <p className="text-xs text-gray-600">Get SMS notifications for urgent issues</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Browser Push</h4>
                      <p className="text-xs text-gray-600">Browser push notifications</p>
                    </div>
                    <Checkbox />
                  </div>
                </CardContent>
              </Card>

              {/* Alert Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Alert Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">New Reviews</p>
                      <p className="text-xs text-gray-600">Get notified of new reviews</p>
                    </div>
                    <Button 
                      variant={alertSettings.newReviews ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('newReviews')}
                    >
                      {alertSettings.newReviews ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Negative Reviews (≤2 stars)</p>
                      <p className="text-xs text-gray-600">Immediate alerts for low ratings</p>
                    </div>
                    <Button 
                      variant={alertSettings.negativeReviews ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('negativeReviews')}
                    >
                      {alertSettings.negativeReviews ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Response Reminders</p>
                      <p className="text-xs text-gray-600">Remind to respond within 24 hours</p>
                    </div>
                    <Button 
                      variant={alertSettings.responseReminders ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('responseReminders')}
                    >
                      {alertSettings.responseReminders ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Weekly Summary</p>
                      <p className="text-xs text-gray-600">Weekly reputation report</p>
                    </div>
                    <Button 
                      variant={alertSettings.weeklySummary ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlertSetting('weeklySummary')}
                    >
                      {alertSettings.weeklySummary ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Response Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Auto-Response Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Enable Auto-Response</h4>
                      <p className="text-xs text-gray-600">Automatically respond to 5-star reviews</p>
                    </div>
                    <Checkbox />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Auto-Response Template</label>
                    <Textarea 
                      placeholder="Thank you for your positive review! We appreciate your feedback."
                      className="min-h-[80px] text-sm"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Monitoring Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Check Frequency</label>
                    <Select defaultValue="hourly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Keywords to Monitor</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                          <XCircle 
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" 
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Add keyword..." 
                        className="flex-1 text-sm" 
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addKeyword();
                          }
                        }}
                      />
                      <Button onClick={addKeyword} disabled={!newKeyword.trim()} size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Platform Dialog */}
        <Dialog open={isAddPlatformDialogOpen} onOpenChange={setIsAddPlatformDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Monitoring Platform</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform Name</label>
                <Select 
                  value={newPlatformData.name}
                  onValueChange={(value) => setNewPlatformData(prev => ({ ...prev, name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google">Google Business</SelectItem>
                    <SelectItem value="Yelp">Yelp</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                    <SelectItem value="Trustpilot">Trustpilot</SelectItem>
                    <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                    <SelectItem value="BBB">Better Business Bureau</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Profile URL</label>
                <Input 
                  type="url"
                  placeholder="https://..."
                  value={newPlatformData.url}
                  onChange={(e) => setNewPlatformData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username/Email (if required)</label>
                <Input 
                  placeholder="your@email.com"
                  value={newPlatformData.username}
                  onChange={(e) => setNewPlatformData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password (if required)</label>
                <Input 
                  type="password"
                  placeholder="Password"
                  value={newPlatformData.password}
                  onChange={(e) => setNewPlatformData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key (if available)</label>
                <Input 
                  placeholder="API Key for automated monitoring"
                  value={newPlatformData.apiKey}
                  onChange={(e) => setNewPlatformData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Secure Connection</p>
                    <p className="text-blue-700">Your credentials are encrypted and stored securely. We only access public review data.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddPlatformDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPlatform} disabled={!newPlatformData.name || !newPlatformData.url}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </ProtectedFeature>
    </Layout>
  );
}