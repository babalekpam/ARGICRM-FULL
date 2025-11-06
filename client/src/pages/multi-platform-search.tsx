import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SEOHead, { generatePageSEO, generateStructuredData } from "@/components/seo-head";
import SeoLayout from "@/components/seo-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Award, 
  Target,
  Sparkles,
  Globe,
  Video,
  Instagram,
  Youtube,
  Search,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShoppingBag
} from "lucide-react";
import { SiGoogle, SiTiktok, SiPinterest, SiAmazon } from "react-icons/si";

export default function MultiPlatformSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const pageSEO = generatePageSEO('analytics');
  const structuredData = generateStructuredData('organization');

  // Load user's available SEO projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/argilette/projects'],
    enabled: !!user
  });

  // Use the first available project or null
  const selectedProjectId = Array.isArray(projects) && projects.length > 0 ? String(projects[0].id) : null;

  // Fetch multi-platform dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/dashboard`],
    enabled: !!user && !!selectedProjectId
  });

  // Fetch brand mention stats
  const { data: mentionStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/mention-stats`],
    enabled: !!user && !!selectedProjectId
  });

  // Fetch AI mentions
  const { data: aiMentions, isLoading: mentionsLoading } = useQuery({
    queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/ai-mentions`],
    enabled: !!user && !!selectedProjectId
  });

  // Fetch sentiment analysis
  const { data: sentimentData, isLoading: sentimentLoading } = useQuery({
    queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/sentiment`],
    enabled: !!user && !!selectedProjectId
  });

  // Fetch social search metrics
  const { data: socialMetrics, isLoading: socialLoading } = useQuery({
    queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/social-search`],
    enabled: !!user && !!selectedProjectId
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query to track.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "No Project Available",
        description: "Please create a project first to start tracking.",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    try {
      // Step 1: Initialize multi-platform tracking
      await apiRequest('POST', `/api/argilette/multi-platform/${selectedProjectId}/initialize`, {});
      
      // Step 2: Start tracking brand mentions with user's custom query
      await apiRequest('POST', `/api/argilette/multi-platform/${selectedProjectId}/track-mentions`, {
        brandName: "ARGILETTE",
        queries: [searchQuery.trim()]
      });
      
      // Step 3: Invalidate queries to fetch new data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/ai-mentions`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/mention-stats`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/dashboard`] })
      ]);
      
      toast({
        title: "Search Started",
        description: `Tracking "${searchQuery}" across all platforms. Results will appear shortly.`,
      });
      
      setSearchQuery("");
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to start tracking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  };

  const handleStartTracking = async () => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Available",
        description: "Please create a project first to start tracking.",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    try {
      // Step 1: Initialize multi-platform tracking
      await apiRequest('POST', `/api/argilette/multi-platform/${selectedProjectId}/initialize`, {});
      
      // Step 2: Start tracking brand mentions (example queries)
      await apiRequest('POST', `/api/argilette/multi-platform/${selectedProjectId}/track-mentions`, {
        brandName: "ARGILETTE",
        queries: [
          "best all-in-one business platform",
          "CRM with SEO tools",
          "comprehensive business management software"
        ]
      });
      
      // Step 3: Invalidate queries to fetch new data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/ai-mentions`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/mention-stats`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/argilette/multi-platform/${selectedProjectId}/dashboard`] })
      ]);
      
      toast({
        title: "Tracking Started Successfully",
        description: "Your brand is now being tracked across AI platforms. Data will appear shortly.",
      });
    } catch (error) {
      console.error("Tracking error:", error);
      toast({
        title: "Failed to Start Tracking",
        description: "Unable to initialize tracking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracking(false);
    }
  };

  const handleConnectPlatforms = () => {
    toast({
      title: "Redirecting to Sales Channels",
      description: "Connect your social platforms to start tracking social search metrics.",
    });
    // Navigate to Sales Channels page where user can connect platforms
    setLocation('/sales-channels');
  };

  const handleAddCompetitor = () => {
    toast({
      title: "Competitor Tracking",
      description: "Navigate to Settings → Competitors to add and track competitor performance.",
    });
    // Navigate to competitors page where user can add competitors
    setLocation('/competitors');
  };

  if (!user) {
    return <div>Please log in to access Multi-Platform Search Optimization.</div>;
  }

  const platformIcons = {
    chatgpt: Brain,
    perplexity: Search,
    gemini: Sparkles,
    copilot: MessageSquare,
    claude: Brain,
    'google-ai-overviews': Globe,
    google: Globe,
    tiktok: Video,
    instagram: Instagram,
    youtube: Youtube,
    pinterest: Video,
    amazon: ShoppingBag,
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSentimentIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <>
      <SEOHead 
        title="Search Everywhere Optimization - NODE CRM | Be Found on Google, YouTube, Instagram, TikTok, Pinterest, Amazon & ChatGPT"
        description="We make sure customers find you everywhere. Track and optimize your brand visibility across Google, YouTube, Instagram, TikTok, Pinterest, Amazon, and ChatGPT. Search starts on Google but doesn't end there."
        keywords={["search everywhere", "multi-platform search", "Google optimization", "YouTube SEO", "Instagram search", "TikTok marketing", "Pinterest SEO", "Amazon visibility", "ChatGPT optimization", "brand visibility"]}
        url="https://nodecrm.com/multi-platform-search"
        structuredData={structuredData}
      />
      
      <SeoLayout title="Multi-Platform Search Optimization">
        <div className="space-y-6" data-testid="page-multi-platform-search">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
              We Make Sure Customers Find You Everywhere
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              From Google to ChatGPT
            </p>
            <p className="text-base text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
              Search starts on Google but it doesn't end there. Show up everywhere your buyers are.
            </p>
          </div>
          
          {/* Search Everywhere Visualization */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isTracking) {
                        handleSearch();
                      }
                    }}
                    placeholder="Search for your brand across all platforms..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    disabled={isTracking || !selectedProjectId}
                    data-testid="input-search-query"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isTracking || !selectedProjectId || !searchQuery.trim()}
                  data-testid="button-search"
                >
                  {isTracking ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            
            {/* Platform Icons */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-google">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <SiGoogle className="w-6 h-6 text-[#4285F4]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Google</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-youtube">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <Youtube className="w-6 h-6 text-[#FF0000]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">YouTube</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-instagram">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <Instagram className="w-6 h-6 text-[#E4405F]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Instagram</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-tiktok">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <SiTiktok className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">TikTok</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-pinterest">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <SiPinterest className="w-6 h-6 text-[#E60023]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Pinterest</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-amazon">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <SiAmazon className="w-6 h-6 text-[#FF9900]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Amazon</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 group" data-testid="platform-icon-chatgpt">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover-elevate transition-all-smooth">
                  <Brain className="w-6 h-6 text-[#10A37F]" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">ChatGPT</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="flex justify-center gap-4 pt-4">
              <Button 
                size="lg"
                onClick={handleStartTracking}
                disabled={isTracking || !selectedProjectId}
                data-testid="button-start-tracking-hero"
              >
                <Target className="w-4 h-4 mr-2" />
                {isTracking ? 'Starting Tracking...' : 'Start Tracking Now'}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={handleConnectPlatforms}
                data-testid="button-connect-platforms-hero"
              >
                <Globe className="w-4 h-4 mr-2" />
                Connect Platforms
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-platforms">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Platforms</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-platforms-count">
                7
              </div>
              <p className="text-xs text-muted-foreground">
                Google, YouTube, Instagram, TikTok, Pinterest, Amazon, ChatGPT
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-brand-mentions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brand Mentions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-mentions-count">
                {(mentionStats as any)?.totalMentions || 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {getSentimentIcon((mentionStats as any)?.mentionTrend || 0)}
                <span>{Math.abs((mentionStats as any)?.mentionTrend || 0)}% from last week</span>
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-sentiment-score">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sentiment Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-sentiment-score">
                {(mentionStats as any)?.averageSentiment ? `${((mentionStats as any).averageSentiment * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall positive sentiment
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-social-reach">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Reach</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-social-reach">
                {Array.isArray(socialMetrics) ? socialMetrics.reduce((acc: number, m: any) => acc + (m.impressions || 0), 0).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total impressions across platforms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="ai-platforms" className="space-y-4">
          <TabsList data-testid="tabs-multi-platform">
            <TabsTrigger value="ai-platforms" data-testid="tab-ai-platforms">
              <Brain className="w-4 h-4 mr-2" />
              AI Platforms
            </TabsTrigger>
            <TabsTrigger value="social-search" data-testid="tab-social-search">
              <Video className="w-4 h-4 mr-2" />
              Social Search
            </TabsTrigger>
            <TabsTrigger value="sentiment" data-testid="tab-sentiment">
              <TrendingUp className="w-4 h-4 mr-2" />
              Sentiment Analysis
            </TabsTrigger>
            <TabsTrigger value="competitive" data-testid="tab-competitive">
              <Award className="w-4 h-4 mr-2" />
              Competitive
            </TabsTrigger>
          </TabsList>

          {/* AI Platforms Tab */}
          <TabsContent value="ai-platforms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Search Platform Visibility</CardTitle>
                <CardDescription>
                  Track how your brand appears across AI-powered search platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mentionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading brand mentions...</div>
                ) : Array.isArray(aiMentions) && aiMentions.length > 0 ? (
                  <div className="space-y-4">
                    {aiMentions.map((mention: any, index: number) => {
                      const PlatformIcon = platformIcons[mention.platform as keyof typeof platformIcons] || Brain;
                      return (
                        <div 
                          key={mention.id || index}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover-elevate"
                          data-testid={`mention-${mention.platform}-${index}`}
                        >
                          <div className="mt-1">
                            <PlatformIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium capitalize">{mention.platform?.replace('-', ' ')}</h4>
                                <Badge variant={mention.isMentioned ? "default" : "secondary"}>
                                  {mention.isMentioned ? "Mentioned" : "Not Found"}
                                </Badge>
                                {mention.visibilityScore !== null && (
                                  <Badge variant="outline">
                                    Score: {mention.visibilityScore}/100
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(mention.checkedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Query: {mention.query}
                            </p>
                            {mention.responseSnippet && (
                              <p className="text-sm bg-muted p-3 rounded">
                                {mention.responseSnippet}
                              </p>
                            )}
                            {mention.position && (
                              <div className="text-xs text-muted-foreground">
                                Position: #{mention.position}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Brain className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">No AI platform data yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start tracking your brand mentions across AI platforms
                      </p>
                    </div>
                    <Button 
                      onClick={handleStartTracking}
                      disabled={isTracking || !selectedProjectId}
                      data-testid="button-track-mentions"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      {isTracking ? 'Starting...' : 'Start Tracking'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Search Tab */}
          <TabsContent value="social-search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Search Performance</CardTitle>
                <CardDescription>
                  Monitor your visibility in TikTok, Instagram, YouTube, and Pinterest search
                </CardDescription>
              </CardHeader>
              <CardContent>
                {socialLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading social metrics...</div>
                ) : Array.isArray(socialMetrics) && socialMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialMetrics.map((metric: any, index: number) => {
                      const PlatformIcon = platformIcons[metric.platform as keyof typeof platformIcons] || Video;
                      return (
                        <div 
                          key={metric.id || index}
                          className="p-4 rounded-lg border bg-card hover-elevate"
                          data-testid={`social-metric-${metric.platform}-${index}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <PlatformIcon className="w-5 h-5 text-primary" />
                            <h4 className="font-medium capitalize">{metric.platform}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Impressions</div>
                              <div className="font-semibold">{(metric.impressions || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Engagement</div>
                              <div className="font-semibold">{(metric.engagements || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Rank</div>
                              <div className="font-semibold">#{metric.rank || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Click Rate</div>
                              <div className="font-semibold">{metric.clickThroughRate ? `${(metric.clickThroughRate * 100).toFixed(1)}%` : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">No social search data yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect your social platforms to start tracking
                      </p>
                    </div>
                    <Button 
                      onClick={handleConnectPlatforms}
                      data-testid="button-connect-social"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Connect Platforms
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Analysis Tab */}
          <TabsContent value="sentiment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Sentiment Analysis</CardTitle>
                <CardDescription>
                  Deep sentiment analysis of your brand mentions across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading sentiment data...</div>
                ) : Array.isArray(sentimentData) && sentimentData.length > 0 ? (
                  <div className="space-y-4">
                    {sentimentData.map((sentiment: any, index: number) => (
                      <div 
                        key={sentiment.id || index}
                        className={`p-4 rounded-lg border ${getSentimentColor(sentiment.overallSentiment)}`}
                        data-testid={`sentiment-${sentiment.platform}-${index}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">{sentiment.platform?.replace('-', ' ')}</h4>
                            <Badge variant="outline" className="capitalize">
                              {sentiment.overallSentiment}
                            </Badge>
                            <Badge variant="secondary">
                              Score: {sentiment.sentimentScore}/100
                            </Badge>
                          </div>
                          <span className="text-sm">
                            {new Date(sentiment.analyzedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">Positive</div>
                            <div className="font-semibold text-green-600">{sentiment.positiveCount || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Neutral</div>
                            <div className="font-semibold text-gray-600">{sentiment.neutralCount || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Negative</div>
                            <div className="font-semibold text-red-600">{sentiment.negativeCount || 0}</div>
                          </div>
                        </div>

                        {sentiment.aiInsights && (
                          <div className="mt-3 p-3 bg-background rounded text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="font-medium">AI Insights</span>
                            </div>
                            <p className="text-muted-foreground">{sentiment.aiInsights}</p>
                          </div>
                        )}

                        {sentiment.keyTopics && sentiment.keyTopics.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sentiment.keyTopics.map((topic: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">No sentiment data yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sentiment analysis will appear here once you start tracking mentions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitive Tab */}
          <TabsContent value="competitive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Benchmarking</CardTitle>
                <CardDescription>
                  Compare your multi-platform performance against competitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Competitive analysis coming soon</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add competitors to start benchmarking your performance
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddCompetitor}
                    data-testid="button-add-competitor"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Add Competitor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </SeoLayout>
    </>
  );
}
