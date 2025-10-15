import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Phone, 
  Video, 
  BarChart3, 
  Target, 
  Zap,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Mic,
  HeadphonesIcon,
  Activity,
  Smile,
  Frown,
  Meh,
  Send,
  User
} from "lucide-react";

interface EmotionalProfile {
  customerId: string;
  customerName: string;
  personalityType: 'analytical' | 'expressive' | 'driver' | 'amiable';
  empathyScore: number;
  trustLevel: number;
  emotionalState: string;
  lastInteraction: string;
  preferredChannel: string;
  riskLevel: 'low' | 'medium' | 'high';
  emotionalJourney: Array<{
    timestamp: string;
    emotion: string;
    intensity: number;
    context: string;
  }>;
}

interface VoiceAnalysis {
  callId: string;
  customerName: string;
  duration: number;
  overallSentiment: number;
  stressLevel: number;
  enthusiasm: number;
  satisfaction: number;
  keyMoments: Array<{
    timestamp: number;
    type: string;
    description: string;
    recommendation: string;
  }>;
  emotionalTimeline: Array<{
    timestamp: number;
    emotion: string;
    intensity: number;
  }>;
}

interface CommunicationCoaching {
  sessionId: string;
  participant: string;
  currentEmotion: string;
  recommendedTone: string;
  suggestedResponses: string[];
  warningSignals: string[];
  positiveIndicators: string[];
  engagementScore: number;
  empathyLevel: number;
  effectivenessScore: number;
}

export default function EmotionalIntelligenceHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("analyze");
  const [analysisText, setAnalysisText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [coachingSession, setCoachingSession] = useState<string | null>(null);

  console.log('EmotionalIntelligenceHub rendering');

  // Fetch contacts list
  const { data: contactsList } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/contacts');
      return await response.json();
    }
  });

  // Fetch emotional profiles
  const { data: emotionalProfiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['/api/emotional-intelligence/profiles'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/emotional-intelligence/profiles');
        return await response.json();
      } catch (error) {
        console.error('Profiles fetch error:', error);
        return [];
      }
    },
    enabled: true
  });

  // Fetch voice analyses
  const { data: voiceAnalyses, isLoading: voiceLoading, error: voiceError } = useQuery({
    queryKey: ['/api/emotional-intelligence/voice-analyses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/emotional-intelligence/voice-analyses');
        return await response.json();
      } catch (error) {
        console.error('Voice analyses fetch error:', error);
        return [];
      }
    },
    enabled: true
  });

  // Fetch communication coaching data
  const { data: communicationCoaching, isLoading: coachingLoading, error: coachingError } = useQuery({
    queryKey: ['/api/emotional-intelligence/communication-coaching'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/emotional-intelligence/communication-coaching');
        return await response.json();
      } catch (error) {
        console.error('Coaching fetch error:', error);
        return [];
      }
    },
    enabled: true
  });

  // Text analysis mutation
  const analyzeTextMutation = useMutation({
    mutationFn: async (data: { text: string; customerId?: string }) => {
      const response = await apiRequest('POST', '/api/emotional-intelligence/analyze', data);
      return await response.json();
    },
    onSuccess: (result) => {
      setAnalysisResult(result.analysis);
      toast({
        title: "Analysis Complete",
        description: "Text emotional analysis has been completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze text. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generate emotional profile mutation
  const generateProfileMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest('POST', `/api/emotional-intelligence/generate-profile/${customerId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-intelligence/profiles'] });
      toast({
        title: "Emotional Profile Generated",
        description: "Customer emotional profile has been analyzed and updated",
      });
    }
  });

  // Start voice analysis mutation
  const startVoiceAnalysisMutation = useMutation({
    mutationFn: async (callData: any) => {
      const response = await apiRequest('POST', '/api/emotional-intelligence/voice-analysis', callData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-intelligence/voice-analyses'] });
      toast({
        title: "Voice Analysis Started",
        description: "Real-time emotional analysis is now active",
      });
    }
  });

  // Start communication coaching
  const startCoachingMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('POST', '/api/emotional-intelligence/communication-coaching', sessionData);
      return await response.json();
    },
    onSuccess: (data) => {
      setCoachingSession(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-intelligence/communication-coaching'] });
      toast({
        title: "Communication Coaching Active",
        description: "Real-time coaching suggestions are now available",
      });
    }
  });

  const getPersonalityIcon = (type: string) => {
    switch (type) {
      case 'analytical': return Brain;
      case 'expressive': return MessageSquare;
      case 'driver': return Target;
      case 'amiable': return Heart;
      default: return Users;
    }
  };

  const getEmotionIcon = (emotion: string) => {
    if (emotion.includes('positive') || emotion.includes('happy') || emotion.includes('satisfied')) {
      return Smile;
    } else if (emotion.includes('negative') || emotion.includes('angry') || emotion.includes('frustrated')) {
      return Frown;
    } else {
      return Meh;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Emotional Intelligence Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced emotional analytics, voice analysis, and communication coaching
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => generateProfileMutation.mutate(selectedCustomer || "")}
              disabled={!selectedCustomer || generateProfileMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Brain className="h-4 w-4 mr-2" />
              Generate Profile
            </Button>
            <Button 
              onClick={() => startVoiceAnalysisMutation.mutate({ customerId: selectedCustomer || "" })}
              disabled={!selectedCustomer || startVoiceAnalysisMutation.isPending}
              variant="outline"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Voice Analysis
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Analysis
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Emotional Profiles
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Analysis
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Communication Coaching
            </TabsTrigger>
            <TabsTrigger value="journey" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Emotional Journey
            </TabsTrigger>
          </TabsList>

          {/* Text Analysis Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Text Analysis
                  </CardTitle>
                  <CardDescription>
                    Analyze customer messages for emotional intelligence insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-input">Customer ID (Optional)</Label>
                    <input
                      id="customer-input"
                      type="text"
                      value={selectedCustomer || ""}
                      onChange={(e) => setSelectedCustomer(e.target.value || undefined)}
                      placeholder="Enter customer ID or leave blank"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="text-xs text-gray-500">
                      You have {(contactsList || []).length} contacts available. Enter a contact ID above.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="analysis-text">Message to Analyze</Label>
                    <Textarea
                      id="analysis-text"
                      placeholder="Enter customer message, email, or communication text..."
                      value={analysisText}
                      onChange={(e) => setAnalysisText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (analysisText.trim()) {
                        analyzeTextMutation.mutate({
                          text: analysisText,
                          customerId: selectedCustomer || undefined
                        });
                      }
                    }}
                    disabled={!analysisText.trim() || analyzeTextMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {analyzeTextMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Analyze Message
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Emotional intelligence insights and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Sentiment</div>
                        <Badge className={analysisResult.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' : 
                                        analysisResult.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' : 
                                        'bg-yellow-100 text-yellow-800'}>
                          {analysisResult.sentiment}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Confidence</div>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResult.confidence * 100} className="flex-1" />
                          <span className="text-sm font-medium">{Math.round(analysisResult.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Urgency Level</div>
                      <Badge className={analysisResult.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-800' : 
                                      analysisResult.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-green-100 text-green-800'}>
                        {analysisResult.urgencyLevel}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Satisfaction Score</div>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResult.satisfactionScore * 100} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(analysisResult.satisfactionScore * 100)}%</span>
                      </div>
                    </div>

                    {analysisResult.emotions && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Emotion Breakdown</div>
                        <div className="space-y-1">
                          {Object.entries(analysisResult.emotions).map(([emotion, value]: [string, any]) => (
                            <div key={emotion} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{emotion}</span>
                              <span className="font-medium">{Math.round(value * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.recommendedActions && analysisResult.recommendedActions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Recommended Actions</div>
                        <ul className="space-y-1 text-sm">
                          {analysisResult.recommendedActions.map((action: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.stressIndicators && analysisResult.stressIndicators.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Stress Indicators</div>
                        <ul className="space-y-1 text-sm">
                          {analysisResult.stressIndicators.map((indicator: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Emotional Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(emotionalProfiles as EmotionalProfile[] || []).map((profile: EmotionalProfile) => {
                const PersonalityIcon = getPersonalityIcon(profile.personalityType);
                return (
                  <Card key={profile.customerId} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <PersonalityIcon className="h-5 w-5 text-purple-600" />
                          {profile.customerName}
                        </CardTitle>
                        <Badge className={getRiskColor(profile.riskLevel)}>
                          {profile.riskLevel} risk
                        </Badge>
                      </div>
                      <CardDescription>
                        {profile.personalityType} personality • {profile.preferredChannel}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Empathy Score</div>
                          <div className="flex items-center gap-2">
                            <Progress value={profile.empathyScore} className="flex-1" />
                            <span className="text-sm font-medium">{profile.empathyScore}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Trust Level</div>
                          <div className="flex items-center gap-2">
                            <Progress value={profile.trustLevel} className="flex-1" />
                            <span className="text-sm font-medium">{profile.trustLevel}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Current State</div>
                        <Badge variant="outline" className="w-full justify-center">
                          {profile.emotionalState}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Recent Emotions</div>
                        <div className="flex flex-wrap gap-1">
                          {profile.emotionalJourney?.slice(0, 3).map((emotion, index) => {
                            const EmotionIcon = getEmotionIcon(emotion.emotion);
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <EmotionIcon className="h-3 w-3 mr-1" />
                                {emotion.emotion}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedCustomer(profile.customerId)}
                      >
                        View Full Profile
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Voice Analysis Tab */}
          <TabsContent value="voice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(voiceAnalyses as VoiceAnalysis[] || []).map((analysis: VoiceAnalysis) => (
                <Card key={analysis.callId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      {analysis.customerName}
                    </CardTitle>
                    <CardDescription>
                      Call duration: {Math.floor(analysis.duration / 60)}m {analysis.duration % 60}s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Overall Sentiment</div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(analysis.overallSentiment + 1) * 50} 
                            className="flex-1" 
                          />
                          <span className="text-sm font-medium">
                            {analysis.overallSentiment > 0 ? '+' : ''}{analysis.overallSentiment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Stress Level</div>
                        <div className="flex items-center gap-2">
                          <Progress value={analysis.stressLevel} className="flex-1" />
                          <span className="text-sm font-medium">{analysis.stressLevel}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Enthusiasm</div>
                        <div className="flex items-center gap-2">
                          <Progress value={analysis.enthusiasm} className="flex-1" />
                          <span className="text-sm font-medium">{analysis.enthusiasm}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Satisfaction</div>
                        <div className="flex items-center gap-2">
                          <Progress value={analysis.satisfaction} className="flex-1" />
                          <span className="text-sm font-medium">{analysis.satisfaction}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Key Moments</div>
                      <div className="space-y-1">
                        {analysis.keyMoments?.slice(0, 2).map((moment, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{Math.floor(moment.timestamp / 60)}:{String(moment.timestamp % 60).padStart(2, '0')}</span>
                            <span className="text-gray-600">{moment.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Communication Coaching Tab */}
          <TabsContent value="coaching" className="space-y-6">
            {coachingSession && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Live Coaching Session Active
                  </CardTitle>
                  <CardDescription>
                    Real-time communication coaching is providing suggestions
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(communicationCoaching as CommunicationCoaching[] || []).map((coaching: CommunicationCoaching, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HeadphonesIcon className="h-5 w-5 text-purple-600" />
                      {coaching.participant}
                    </CardTitle>
                    <CardDescription>
                      Current emotion: {coaching.currentEmotion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Recommended Tone</div>
                      <Badge variant="outline" className="w-full justify-center">
                        {coaching.recommendedTone}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Suggested Responses</div>
                      <div className="space-y-1">
                        {coaching.suggestedResponses?.slice(0, 2).map((response, i) => (
                          <div key={i} className="text-xs bg-blue-50 p-2 rounded text-blue-800">
                            "{response}"
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{coaching.engagementScore}%</div>
                        <div className="text-xs text-gray-600">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{coaching.empathyLevel}%</div>
                        <div className="text-xs text-gray-600">Empathy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{coaching.effectivenessScore}%</div>
                        <div className="text-xs text-gray-600">Effectiveness</div>
                      </div>
                    </div>

                    {coaching.warningSignals?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Warning Signals
                        </div>
                        <div className="space-y-1">
                          {coaching.warningSignals.slice(0, 2).map((signal, i) => (
                            <div key={i} className="text-xs bg-red-50 p-2 rounded text-red-800">
                              {signal}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Start New Coaching Session</CardTitle>
                <CardDescription>
                  Begin real-time communication coaching for customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={selectedCustomer || ""}
                    onChange={(e) => setSelectedCustomer(e.target.value || undefined)}
                    placeholder="Enter customer ID"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button 
                    onClick={() => startCoachingMutation.mutate({ customerId: selectedCustomer || "none" })}
                    disabled={startCoachingMutation.isPending}
                  >
                    Start Coaching
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emotional Journey Tab */}
          <TabsContent value="journey" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emotional Journey Mapping</CardTitle>
                <CardDescription>
                  Visual representation of customer emotional experiences over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium">Emotional Journey Visualization</h3>
                    <p className="text-sm">
                      Interactive emotional timeline coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}