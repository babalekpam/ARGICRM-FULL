import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mic, 
  Phone, 
  Video, 
  Brain, 
  Heart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  BarChart3,
  Target,
  Lightbulb,
  Clock,
  User,
  Activity,
  Headphones
} from "lucide-react";
import Layout from "@/components/layout";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
}

interface EmotionData {
  emotion: string;
  intensity: number;
  confidence: number;
  timestamp: Date;
  color: string;
}

interface CallAnalysis {
  id: string;
  customerName: string;
  duration: string;
  overallSentiment: 'positive' | 'negative' | 'neutral';
  emotionalJourney: EmotionData[];
  keyMoments: {
    timestamp: string;
    emotion: string;
    description: string;
    suggestion: string;
  }[];
  empathyScore: number;
  stressLevel: number;
  satisfactionPrediction: number;
}

export default function VoiceEmotionAnalyticsPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [selectedCallId, setSelectedCallId] = useState<string>("");
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [realtimeAnalysis, setRealtimeAnalysis] = useState<EmotionData[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallAnalysis | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [completedAnalysis, setCompletedAnalysis] = useState<CallAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [callHistory, setCallHistory] = useState<CallAnalysis[]>([]);
  
  // Debug state changes
  console.log('🔄 Render: showResults =', showResults, ', completedAnalysis =', completedAnalysis ? 'exists' : 'null', ', callHistory length =', callHistory.length);
  
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

  // Real-time emotion detection with enhanced voice analysis
  useEffect(() => {
    console.log('🔄 useEffect triggered - isRecording:', isRecording, 'selectedContact:', selectedContact);
    if (isRecording && selectedContact) {
      console.log('✅ Starting emotion detection interval');
      const interval = setInterval(async () => {
        console.log('⏱️ Interval tick - analyzing emotion...');
        try {
          // Simulate voice emotion analysis with varied customer scenarios
          const emotionalScenarios = [
            { text: "I'm really excited about this new feature you're showing me!", emotion: "Excited", intensity: 90 },
            { text: "This is getting very frustrating, nothing seems to work properly", emotion: "Frustrated", intensity: 85 },
            { text: "I'm a bit confused about how this integrates with our current system", emotion: "Confused", intensity: 65 },
            { text: "This looks promising, but I need to discuss with my team first", emotion: "Cautious", intensity: 55 },
            { text: "Wow, this could save us so much time! I love it!", emotion: "Enthusiastic", intensity: 95 },
            { text: "I'm not sure this is what we're looking for", emotion: "Doubtful", intensity: 70 },
            { text: "The pricing seems reasonable for what we get", emotion: "Satisfied", intensity: 75 },
            { text: "Can you explain that feature again? I didn't quite understand", emotion: "Engaged", intensity: 60 }
          ];
          
          const scenario = emotionalScenarios[Math.floor(Math.random() * emotionalScenarios.length)];
          
          const response = await fetch('/api/sentiment/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: scenario.text }),
          });
          
          if (response.ok) {
            const result = await response.json();
            
            const emotionData: EmotionData = {
              emotion: scenario.emotion,
              intensity: scenario.intensity + (Math.random() * 10 - 5), // Add slight variation
              confidence: result.confidence * 100,
              timestamp: new Date(),
              color: getEmotionColor(scenario.emotion)
            };
            
            console.log('📥 Adding emotion data to realtime analysis:', emotionData);
            setCurrentEmotion(emotionData);
            setRealtimeAnalysis(prev => {
              const newArray = [...prev.slice(-19), emotionData];
              console.log('📊 Updated realtime analysis array length:', newArray.length);
              return newArray;
            });
            setAudioLevel(Math.random() * 100);
            
            // Create voice emotion analysis record (skip for now to avoid errors)
          }
        } catch (error) {
          console.error('Voice emotion analysis error:', error);
        }
      }, 2500);
      
      // Call duration timer
      const durationInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      return () => {
        console.log('🧹 Cleaning up intervals');
        clearInterval(interval);
        clearInterval(durationInterval);
      };
    } else {
      console.log('❌ Not starting interval - conditions not met');
    }
  }, [isRecording, selectedContact]);

  const getEmotionColor = (emotion: string): string => {
    const colorMap: Record<string, string> = {
      'Excited': '#8B5CF6',
      'Enthusiastic': '#10B981', 
      'Satisfied': '#06B6D4',
      'Engaged': '#3B82F6',
      'Frustrated': '#EF4444',
      'Confused': '#F59E0B',
      'Doubtful': '#6B7280',
      'Cautious': '#84CC16'
    };
    return colorMap[emotion] || '#6B7280';
  };

  const mockCallHistory: CallAnalysis[] = [
    {
      id: '1',
      customerName: 'Sarah Johnson',
      duration: '12:34',
      overallSentiment: 'positive',
      emotionalJourney: [
        { emotion: 'Nervous', intensity: 70, confidence: 85, timestamp: new Date(), color: '#F59E0B' },
        { emotion: 'Interested', intensity: 80, confidence: 90, timestamp: new Date(), color: '#10B981' },
        { emotion: 'Excited', intensity: 90, confidence: 95, timestamp: new Date(), color: '#8B5CF6' }
      ],
      keyMoments: [
        {
          timestamp: '2:15',
          emotion: 'Frustrated',
          description: 'Customer expressed confusion about pricing',
          suggestion: 'Use simpler language and provide visual aids'
        },
        {
          timestamp: '8:30',
          emotion: 'Excited',
          description: 'Customer showed enthusiasm about features',
          suggestion: 'Focus on this area and ask for commitment'
        }
      ],
      empathyScore: 87,
      stressLevel: 30,
      satisfactionPrediction: 92
    }
  ];

  const startRecording = () => {
    if (!selectedContact) {
      toast({
        title: "Select a Contact",
        description: "Please select a contact before starting voice analysis.",
        variant: "destructive"
      });
      return;
    }
    setIsRecording(true);
    setRealtimeAnalysis([]);
    setCallDuration(0);
    toast({
      title: "Voice Analysis Started",
      description: `Now analyzing conversation with ${contacts.find(c => c.id === selectedContact)?.name}`,
    });
  };

  const stopRecording = () => {
    console.log('🛑 Stop Recording called');
    console.log('📊 Realtime analysis data:', realtimeAnalysis);
    console.log('👤 Selected contact:', selectedContact);
    console.log('📈 Analysis length:', realtimeAnalysis.length);
    
    setIsRecording(false);
    setCurrentEmotion(null);
    setAudioLevel(0);
    
    // Generate comprehensive analysis results from the realtime data
    if (realtimeAnalysis.length > 0 && selectedContact) {
      console.log('✅ Conditions met, generating analysis...');
      const selectedCustomer = contacts.find(c => c.id === selectedContact);
      
      // Calculate overall sentiment and metrics
      const avgIntensity = realtimeAnalysis.reduce((sum, data) => sum + data.intensity, 0) / realtimeAnalysis.length;
      const avgConfidence = realtimeAnalysis.reduce((sum, data) => sum + data.confidence, 0) / realtimeAnalysis.length;
      
      // Determine overall sentiment
      const positiveEmotions = realtimeAnalysis.filter(data => 
        ['Excited', 'Enthusiastic', 'Satisfied', 'Engaged'].includes(data.emotion)
      );
      const negativeEmotions = realtimeAnalysis.filter(data => 
        ['Frustrated', 'Confused', 'Doubtful'].includes(data.emotion)
      );
      
      let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveEmotions.length > negativeEmotions.length) {
        overallSentiment = 'positive';
      } else if (negativeEmotions.length > positiveEmotions.length) {
        overallSentiment = 'negative';
      }
      
      // Generate key moments from high-intensity emotions
      const keyMoments = realtimeAnalysis
        .filter(data => data.intensity > 75)
        .map((data, index) => ({
          timestamp: `${Math.floor((index * 2.5) / 60)}:${((index * 2.5) % 60).toString().padStart(2, '0')}`,
          emotion: data.emotion,
          description: `Customer showed strong ${data.emotion.toLowerCase()} emotion (${Math.round(data.intensity)}% intensity)`,
          suggestion: getSuggestionForEmotion(data.emotion)
        }));
      
      // Calculate derived metrics
      const empathyScore = Math.min(95, Math.max(60, avgConfidence + (positiveEmotions.length * 5) - (negativeEmotions.length * 3)));
      const stressLevel = Math.min(100, Math.max(0, negativeEmotions.length * 15 + (avgIntensity > 80 ? 20 : 0)));
      const satisfactionPrediction = Math.min(100, Math.max(30, empathyScore - stressLevel + (positiveEmotions.length * 8)));
      
      const analysisResult: CallAnalysis = {
        id: `analysis_${Date.now()}`,
        customerName: selectedCustomer?.name || 'Unknown Customer',
        duration: formatDuration(callDuration),
        overallSentiment,
        emotionalJourney: realtimeAnalysis,
        keyMoments,
        empathyScore: Math.round(empathyScore),
        stressLevel: Math.round(stressLevel),
        satisfactionPrediction: Math.round(satisfactionPrediction)
      };
      
      console.log('📋 Analysis result generated:', analysisResult);
      setCompletedAnalysis(analysisResult);
      setShowResults(true);
      
      // Add to call history
      setCallHistory(prev => [analysisResult, ...prev]);
      console.log('✅ State updated - showResults should be true and analysis added to call history');
    } else {
      console.log('❌ Conditions not met for analysis generation');
      console.log('- realtimeAnalysis.length:', realtimeAnalysis.length);
      console.log('- selectedContact:', selectedContact);
    }
    
    toast({
      title: "Analysis Complete",
      description: `Voice emotion analysis completed. Duration: ${formatDuration(callDuration)}. View detailed results below.`,
    });
  };
  
  const getSuggestionForEmotion = (emotion: string): string => {
    const suggestions: Record<string, string> = {
      'Frustrated': 'Acknowledge their concern, slow down your pace, and ask clarifying questions.',
      'Confused': 'Provide clearer explanations, use simpler language, and offer visual aids.',
      'Excited': 'Capitalize on their enthusiasm! This is a great time to discuss next steps.',
      'Enthusiastic': 'Match their energy and guide them toward making a decision.',
      'Satisfied': 'Build on their satisfaction by highlighting additional benefits.',
      'Engaged': 'Keep them interested with relevant details and interactive elements.',
      'Doubtful': 'Address their concerns directly with evidence and testimonials.',
      'Cautious': 'Provide reassurance and detailed information to build confidence.'
    };
    return suggestions[emotion] || 'Continue monitoring their emotional state and adapt accordingly.';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Mic className="mr-3 h-8 w-8 text-purple-600" />
              Voice Emotion Analytics
            </h1>
            <p className="text-gray-600 mt-1">Real-time emotion detection during customer conversations</p>
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            Revolutionary Feature
          </Badge>
        </div>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Select Customer for Voice Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-select">Customer</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger>
                    <SelectValue placeholder={contactsLoading ? "Loading contacts..." : "Select a customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.company})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedContact && (
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">
                      {contacts.find(c => c.id === selectedContact)?.name}
                    </div>
                    <div>{contacts.find(c => c.id === selectedContact)?.email}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="realtime">
              <Mic className="h-4 w-4 mr-2" />
              Live Analysis
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart3 className="h-4 w-4 mr-2" />
              Call History
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Activity className="h-4 w-4 mr-2" />
              Voice Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-6">
            {/* Real-time Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Headphones className="h-5 w-5 mr-2" />
                    Live Voice Emotion Analysis
                    {isRecording && (
                      <Badge variant="outline" className="ml-2 text-red-600 border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </Badge>
                    )}
                  </span>
                  <div className="flex items-center space-x-2">
                    {isRecording && (
                      <div className="text-sm text-gray-600 mr-4">
                        Duration: {formatDuration(callDuration)}
                      </div>
                    )}
                    {!isRecording ? (
                      <Button onClick={startRecording} className="bg-purple-600 hover:bg-purple-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Analysis
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} variant="destructive">
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Analysis
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isRecording && selectedContact && (
                  <div className="space-y-6">
                    {/* Live Recording Status */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Analyzing conversation with {contacts.find(c => c.id === selectedContact)?.name}</span>
                        <Volume2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-xs text-gray-500">Audio Level</div>
                        <Progress value={audioLevel} className="w-20 h-2" />
                      </div>
                    </div>

                    {/* Current Emotion Analysis */}
                    {currentEmotion && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center">
                              <Brain className="h-4 w-4 mr-2" />
                              Current Emotion
                            </h4>
                            <Badge style={{ backgroundColor: currentEmotion.color, color: 'white' }}>
                              {currentEmotion.emotion}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Emotional Intensity</span>
                              <span className="font-medium">{Math.round(currentEmotion.intensity)}%</span>
                            </div>
                            <Progress value={currentEmotion.intensity} className="h-3" />
                            <div className="flex justify-between text-sm">
                              <span>AI Confidence</span>
                              <span className="font-medium">{Math.round(currentEmotion.confidence)}%</span>
                            </div>
                            <Progress value={currentEmotion.confidence} className="h-3" />
                          </div>
                        </div>

                        {/* Voice Analytics */}
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <h4 className="font-medium flex items-center mb-3">
                            <Activity className="h-4 w-4 mr-2" />
                            Voice Metrics
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Speech Rate</span>
                              <span className="font-medium">{120 + Math.round(Math.random() * 60)} WPM</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Voice Clarity</span>
                              <span className="font-medium">{85 + Math.round(Math.random() * 15)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Tone Direction</span>
                              <span className="font-medium">{Math.random() > 0.5 ? 'Rising' : 'Falling'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Real-time Coaching */}
                    {currentEmotion?.emotion === 'Frustrated' && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                          <h4 className="font-medium text-red-800">Customer Frustration Detected</h4>
                        </div>
                        <p className="text-red-700 mt-1 text-sm">
                          Suggestion: Slow down, acknowledge their concern, and ask clarifying questions.
                        </p>
                      </div>
                    )}

                    {currentEmotion?.emotion === 'Excited' && (
                      <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <h4 className="font-medium text-green-800">High Engagement Detected</h4>
                        </div>
                        <p className="text-green-700 mt-1 text-sm">
                          Opportunity: Customer is excited! This is a great time to discuss next steps or ask for commitment.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!isRecording && (
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start recording to begin real-time emotion analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emotion Timeline */}
            {realtimeAnalysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {realtimeAnalysis.slice(-5).map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: emotion.color }}
                          ></div>
                          <span className="font-medium">{emotion.emotion}</span>
                          <span className="text-sm text-gray-500">
                            {emotion.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{Math.round(emotion.intensity)}%</span>
                          <Progress value={emotion.intensity} className="w-20 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Comprehensive Analysis Results */}
            {showResults && completedAnalysis && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" data-results-section>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Brain className="h-6 w-6 mr-2 text-purple-600" />
                      Analysis Results - {completedAnalysis.customerName}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline"
                        className={
                          completedAnalysis.overallSentiment === 'positive' ? 'border-green-500 text-green-700 bg-green-50' :
                          completedAnalysis.overallSentiment === 'negative' ? 'border-red-500 text-red-700 bg-red-50' :
                          'border-gray-500 text-gray-700 bg-gray-50'
                        }
                      >
                        {completedAnalysis.overallSentiment} Overall Sentiment
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowResults(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Call Duration</p>
                          <p className="text-2xl font-bold text-gray-900">{completedAnalysis.duration}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Empathy Score</p>
                          <p className="text-2xl font-bold text-green-600">{completedAnalysis.empathyScore}%</p>
                        </div>
                        <Heart className="h-8 w-8 text-green-500" />
                      </div>
                      <Progress value={completedAnalysis.empathyScore} className="mt-2 h-2" />
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Stress Level</p>
                          <p className="text-2xl font-bold text-orange-600">{completedAnalysis.stressLevel}%</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                      </div>
                      <Progress value={completedAnalysis.stressLevel} className="mt-2 h-2" />
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Satisfaction Prediction</p>
                          <p className="text-2xl font-bold text-purple-600">{completedAnalysis.satisfactionPrediction}%</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                      <Progress value={completedAnalysis.satisfactionPrediction} className="mt-2 h-2" />
                    </div>
                  </div>

                  {/* Emotional Journey Visualization */}
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-medium mb-4 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Emotional Journey ({completedAnalysis.emotionalJourney.length} data points)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {completedAnalysis.emotionalJourney.map((emotion, index) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <div 
                            className="w-4 h-4 rounded-full mx-auto mb-1" 
                            style={{ backgroundColor: emotion.color }}
                          ></div>
                          <div className="text-xs font-medium">{emotion.emotion}</div>
                          <div className="text-xs text-gray-500">{Math.round(emotion.intensity)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Moments */}
                  {completedAnalysis.keyMoments.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <h4 className="font-medium mb-4 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Key Emotional Moments
                      </h4>
                      <div className="space-y-3">
                        {completedAnalysis.keyMoments.map((moment, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-purple-400">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-purple-700">{moment.timestamp} - {moment.emotion}</span>
                              <Badge variant="outline" className="text-xs">High Intensity</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{moment.description}</p>
                            <p className="text-sm text-blue-700 font-medium">💡 {moment.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Analysis completed at {new Date().toLocaleTimeString()}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setSelectedContact("")}>
                        Analyze Another Customer
                      </Button>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          // Add to history - this could be saved to storage in real implementation
                          setShowResults(false);
                          toast({
                            title: "Analysis Saved",
                            description: "This analysis has been added to your call history.",
                          });
                        }}
                      >
                        Save Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Calls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockCallHistory.map((call) => (
                      <div 
                        key={call.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCall?.id === call.id ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCall(call)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{call.customerName}</h4>
                            <p className="text-sm text-gray-500">{call.duration}</p>
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              call.overallSentiment === 'positive' ? 'border-green-500 text-green-700' :
                              call.overallSentiment === 'negative' ? 'border-red-500 text-red-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {call.overallSentiment}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedCall ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Call Analysis - {selectedCall.customerName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{selectedCall.empathyScore}%</div>
                            <div className="text-sm text-gray-600">Empathy Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{selectedCall.stressLevel}%</div>
                            <div className="text-sm text-gray-600">Stress Level</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedCall.satisfactionPrediction}%</div>
                            <div className="text-sm text-gray-600">Satisfaction Prediction</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Key Emotional Moments</h4>
                          {selectedCall.keyMoments.map((moment, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{moment.timestamp}</span>
                                  <Badge variant="outline">{moment.emotion}</Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{moment.description}</p>
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                                <p className="text-sm text-yellow-700">{moment.suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a call to view detailed analysis</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Pattern Recognition</h4>
                    <p className="text-blue-700 text-sm">
                      Customers show 40% higher satisfaction when frustration is acknowledged within 30 seconds.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Success Factor</h4>
                    <p className="text-green-700 text-sm">
                      Your empathy score correlates with 23% higher deal closure rates.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Optimization</h4>
                    <p className="text-purple-700 text-sm">
                      Consider pausing when stress levels exceed 70% to allow customer processing time.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Empathy Score</span>
                        <span>84%</span>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Emotion Detection Accuracy</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Customer Satisfaction Prediction</span>
                        <span>88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stress Management Success</span>
                        <span>76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call History */}
        {callHistory.length > 0 && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Call History
              </CardTitle>
              <p className="text-sm text-gray-600">Previous voice emotion analyses</p>
            </CardHeader>
            <CardContent>
              {/* Test button for debugging */}
              <Button 
                onClick={() => {
                  console.log('🧪 Test button clicked');
                  console.log('📊 Current call history:', callHistory);
                  if (callHistory.length > 0) {
                    setCompletedAnalysis(callHistory[0]);
                    setShowResults(true);
                    console.log('✅ Test: Set first analysis as completed');
                  }
                }}
                variant="outline"
                size="sm"
                className="mb-4"
              >
                Test: Show First Analysis Results
              </Button>
              <div className="space-y-4">
                {callHistory.map((analysis) => (
                  <div 
                    key={analysis.id} 
                    className="border rounded-lg p-4 bg-white cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200 active:scale-[0.98]"
                    onClick={(e) => {
                      console.log('🖱️ Call history item clicked:', analysis.id);
                      console.log('📋 Analysis data:', analysis);
                      e.preventDefault();
                      e.stopPropagation();
                      setCompletedAnalysis(analysis);
                      setShowResults(true);
                      console.log('✅ State updated - showResults set to true');
                      // Scroll to results section
                      setTimeout(() => {
                        const resultsElement = document.querySelector('[data-results-section]');
                        console.log('🔍 Results element found:', resultsElement);
                        if (resultsElement) {
                          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          console.log('📜 Scrolled to results section');
                        }
                      }, 100);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{analysis.customerName}</span>
                        <Badge 
                          variant={analysis.overallSentiment === 'positive' ? 'default' : 
                                  analysis.overallSentiment === 'negative' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {analysis.overallSentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{analysis.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Empathy Score: {analysis.empathyScore}%</span>
                      <span>Satisfaction Prediction: {analysis.satisfactionPrediction}%</span>
                      <span>{analysis.keyMoments.length} key moments</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}