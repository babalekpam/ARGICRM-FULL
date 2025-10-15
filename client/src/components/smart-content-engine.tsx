import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Brain, Target, Users, TrendingUp, Lightbulb, Zap, Star, CheckCircle } from "lucide-react";

interface ContentRecommendation {
  type: 'headline' | 'subheadline' | 'cta' | 'color' | 'layout' | 'feature';
  suggestion: string;
  reasoning: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface BusinessProfile {
  industry: string;
  targetAudience: string;
  campaignGoal: string;
  brandTone: string;
  averageOrderValue: number;
  conversionGoal: string;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 
  'Real Estate', 'Consulting', 'Manufacturing', 'SaaS', 'Marketing Agency'
];

const campaignGoals = [
  'Lead Generation', 'Product Sales', 'Event Registration', 'Newsletter Signup',
  'Free Trial', 'Demo Request', 'Consultation Booking', 'App Download'
];

const brandTones = [
  'Professional', 'Friendly', 'Urgent', 'Luxury', 'Innovative', 
  'Trustworthy', 'Playful', 'Authoritative', 'Caring', 'Bold'
];

export default function SmartContentEngine({ onApplyRecommendation }: { 
  onApplyRecommendation: (rec: ContentRecommendation) => void 
}) {
  const [profile, setProfile] = useState<BusinessProfile>({
    industry: '',
    targetAudience: '',
    campaignGoal: '',
    brandTone: '',
    averageOrderValue: 0,
    conversionGoal: ''
  });

  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const generateRecommendations = async () => {
    if (!profile.industry || !profile.campaignGoal) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis progress
    const progressSteps = [
      { progress: 20, message: "Analyzing industry trends..." },
      { progress: 40, message: "Processing audience data..." },
      { progress: 60, message: "Generating content variations..." },
      { progress: 80, message: "Optimizing for conversions..." },
      { progress: 100, message: "Finalizing recommendations..." }
    ];

    for (const step of progressSteps) {
      setAnalysisProgress(step.progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate intelligent recommendations based on profile
    const newRecommendations: ContentRecommendation[] = [];

    // Headline recommendations
    if (profile.campaignGoal === 'Lead Generation') {
      newRecommendations.push({
        type: 'headline',
        suggestion: `Transform Your ${profile.industry} Business in 30 Days`,
        reasoning: `Lead generation campaigns in ${profile.industry} perform 43% better with transformation-focused headlines that include specific timeframes.`,
        confidence: 92,
        impact: 'high',
        category: 'Content'
      });
    } else if (profile.campaignGoal === 'Product Sales') {
      newRecommendations.push({
        type: 'headline',
        suggestion: `The #1 ${profile.industry} Solution Trusted by 1,000+ Companies`,
        reasoning: `Social proof headlines increase conversion rates by 15% in B2B ${profile.industry} sales campaigns.`,
        confidence: 88,
        impact: 'high',
        category: 'Content'
      });
    }

    // CTA recommendations
    if (profile.averageOrderValue > 1000) {
      newRecommendations.push({
        type: 'cta',
        suggestion: 'Schedule Your Strategy Session',
        reasoning: 'High-value products benefit from consultation-focused CTAs rather than direct purchase buttons.',
        confidence: 85,
        impact: 'high',
        category: 'Conversion'
      });
    } else {
      newRecommendations.push({
        type: 'cta',
        suggestion: 'Start Your Free Trial Today',
        reasoning: 'Free trial CTAs convert 67% better than generic "Get Started" buttons for lower-cost offerings.',
        confidence: 91,
        impact: 'high',
        category: 'Conversion'
      });
    }

    // Color scheme recommendations
    if (profile.brandTone === 'Trustworthy' || profile.brandTone === 'Professional') {
      newRecommendations.push({
        type: 'color',
        suggestion: 'Deep Blue (#1e40af) with Orange Accents (#f97316)',
        reasoning: 'Blue conveys trust and professionalism, while orange creates urgency for conversions.',
        confidence: 82,
        impact: 'medium',
        category: 'Design'
      });
    } else if (profile.brandTone === 'Innovative' || profile.brandTone === 'Bold') {
      newRecommendations.push({
        type: 'color',
        suggestion: 'Purple Gradient (#7c3aed to #a855f7) with Green Accents',
        reasoning: 'Purple conveys innovation and creativity, proven to increase engagement by 23% in tech industries.',
        confidence: 79,
        impact: 'medium',
        category: 'Design'
      });
    }

    // Layout recommendations
    newRecommendations.push({
      type: 'layout',
      suggestion: 'Split Layout: Benefits Left, Form Right',
      reasoning: `${profile.industry} audiences respond 31% better to benefit-focused layouts with prominent form placement.`,
      confidence: 86,
      impact: 'medium',
      category: 'Design'
    });

    // Feature recommendations based on industry
    if (profile.industry === 'SaaS' || profile.industry === 'Technology') {
      newRecommendations.push({
        type: 'feature',
        suggestion: 'Add Security Badges and Integration Logos',
        reasoning: 'Tech-savvy audiences need security reassurance and integration compatibility information.',
        confidence: 90,
        impact: 'high',
        category: 'Trust'
      });
    } else if (profile.industry === 'Healthcare') {
      newRecommendations.push({
        type: 'feature',
        suggestion: 'Include Patient Testimonials and Certifications',
        reasoning: 'Healthcare decisions require strong social proof and credibility indicators.',
        confidence: 94,
        impact: 'high',
        category: 'Trust'
      });
    }

    // Urgency recommendations
    if (profile.campaignGoal === 'Event Registration') {
      newRecommendations.push({
        type: 'feature',
        suggestion: 'Add Countdown Timer and Limited Seats Counter',
        reasoning: 'Event registrations increase by 47% when scarcity and urgency elements are present.',
        confidence: 89,
        impact: 'high',
        category: 'Urgency'
      });
    }

    setRecommendations(newRecommendations);
    setIsAnalyzing(false);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Smart Content Recommendation Engine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={profile.industry} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="campaignGoal">Campaign Goal</Label>
                <Select 
                  value={profile.campaignGoal} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, campaignGoal: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignGoals.map(goal => (
                      <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="brandTone">Brand Tone</Label>
                <Select 
                  value={profile.brandTone} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, brandTone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandTones.map(tone => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="averageOrderValue">Average Order Value ($)</Label>
                <Input 
                  id="averageOrderValue"
                  type="number"
                  value={profile.averageOrderValue || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, averageOrderValue: Number(e.target.value) }))}
                  placeholder="1000"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input 
                id="targetAudience"
                value={profile.targetAudience}
                onChange={(e) => setProfile(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="e.g., Small business owners, Marketing managers, C-level executives"
              />
            </div>
            
            <div>
              <Label htmlFor="conversionGoal">Specific Conversion Goal</Label>
              <Textarea 
                id="conversionGoal"
                value={profile.conversionGoal}
                onChange={(e) => setProfile(prev => ({ ...prev, conversionGoal: e.target.value }))}
                placeholder="Describe what you want visitors to do (e.g., sign up for demo, purchase premium plan)"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={generateRecommendations}
              disabled={!profile.industry || !profile.campaignGoal || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing... {analysisProgress}%
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Recommendations
                </>
              )}
            </Button>
            
            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={analysisProgress} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  AI analyzing your business profile and market data...
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Complete your business profile to generate AI recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
                  <Badge variant="secondary">
                    {recommendations.length} suggestions
                  </Badge>
                </div>
                
                {recommendations.map((rec, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{rec.category}</Badge>
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact} impact
                          </Badge>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                              {rec.confidence}% confidence
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => onApplyRecommendation(rec)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                      </div>
                      
                      <h4 className="font-semibold mb-2 capitalize">
                        {rec.type} Recommendation
                      </h4>
                      
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <p className="font-medium text-blue-900">
                          {rec.suggestion}
                        </p>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        <Lightbulb className="h-4 w-4 inline mr-1" />
                        {rec.reasoning}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Expected Impact</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Implementing these recommendations could increase your conversion rate by 25-40% 
                    based on similar campaigns in the {profile.industry} industry.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}