import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar, 
  Building, 
  Rocket, 
  MessageSquare,
  Sparkles,
  Target,
  BarChart,
  ArrowRight,
  Eye,
  X
} from "lucide-react";

interface TemplateRecommendation {
  id: string;
  title: string;
  description: string;
  icon: any;
  matchScore: number;
  reasons: string[];
  conversionRate: number;
  industryFit: string;
  complexity: 'Simple' | 'Moderate' | 'Advanced';
  timeToLaunch: string;
  aiInsights: {
    primaryReason: string;
    targetAudience: string;
    expectedResults: string;
    optimizationTips: string[];
  };
}

interface TemplateRecommendationCarouselProps {
  onUseTemplate: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  userProfile?: {
    industry?: string;
    businessSize?: string;
    goals?: string[];
    previousTemplates?: string[];
  };
}

export default function TemplateRecommendationCarousel({ 
  onUseTemplate, 
  onPreview,
  userProfile = {}
}: TemplateRecommendationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRecommendation, setSelectedRecommendation] = useState<TemplateRecommendation | null>(null);

  // Fetch AI recommendations from backend
  const { data: apiRecommendations, isLoading, error } = useQuery({
    queryKey: ['/api/ai/template-recommendations'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // AI-powered template recommendations based on user profile
  const generateRecommendations = (): TemplateRecommendation[] => {
    const baseTemplates = [
      {
        id: 'lead-generation',
        title: 'Lead Generation Template',
        description: 'Perfect for capturing leads with contact forms and compelling headlines.',
        icon: Users,
        baseScore: 85,
        industryMultiplier: userProfile.industry === 'SaaS' ? 1.2 : 1.0,
        conversionRate: 18.5,
        complexity: 'Simple' as const,
        timeToLaunch: '15 minutes'
      },
      {
        id: 'b2b-lead',
        title: 'B2B Enterprise Template',
        description: 'Designed for B2B companies targeting enterprise clients.',
        icon: Building,
        baseScore: 78,
        industryMultiplier: userProfile.businessSize === 'Enterprise' ? 1.3 : 0.9,
        conversionRate: 12.8,
        complexity: 'Moderate' as const,
        timeToLaunch: '25 minutes'
      },
      {
        id: 'saas-trial',
        title: 'SaaS Free Trial Template',
        description: 'Convert visitors into trial users with compelling signup forms.',
        icon: Rocket,
        baseScore: 82,
        industryMultiplier: userProfile.industry === 'SaaS' ? 1.4 : 0.8,
        conversionRate: 22.1,
        complexity: 'Simple' as const,
        timeToLaunch: '20 minutes'
      },
      {
        id: 'consultation',
        title: 'Consultation Booking Template',
        description: 'Schedule consultations and strategy sessions.',
        icon: MessageSquare,
        baseScore: 75,
        industryMultiplier: userProfile.industry === 'Consulting' ? 1.3 : 1.0,
        conversionRate: 15.7,
        complexity: 'Moderate' as const,
        timeToLaunch: '30 minutes'
      },
      {
        id: 'product-launch',
        title: 'Product Launch Template',
        description: 'Announce new products with countdown timers.',
        icon: Package,
        baseScore: 80,
        industryMultiplier: userProfile.goals?.includes('product-launch') ? 1.3 : 1.0,
        conversionRate: 16.3,
        complexity: 'Advanced' as const,
        timeToLaunch: '35 minutes'
      },
      {
        id: 'event-registration',
        title: 'Event Registration Template',
        description: 'Drive event signups with compelling details.',
        icon: Calendar,
        baseScore: 73,
        industryMultiplier: userProfile.goals?.includes('events') ? 1.2 : 1.0,
        conversionRate: 19.2,
        complexity: 'Simple' as const,
        timeToLaunch: '20 minutes'
      }
    ];

    return baseTemplates
      .map(template => {
        const matchScore = Math.min(100, Math.round(template.baseScore * template.industryMultiplier));
        
        // Generate AI insights based on match score and user profile
        const reasons = [];
        if (template.industryMultiplier > 1.1) {
          reasons.push(`Perfect fit for ${userProfile.industry || 'your industry'}`);
        }
        if (template.conversionRate > 18) {
          reasons.push('High conversion rate in similar businesses');
        }
        if (template.complexity === 'Simple') {
          reasons.push('Quick to launch and customize');
        }
        
        const aiInsights = generateAIInsights(template, userProfile, matchScore);
        
        return {
          id: template.id,
          title: template.title,
          description: template.description,
          icon: template.icon,
          matchScore,
          reasons,
          conversionRate: template.conversionRate,
          industryFit: getIndustryFit(matchScore),
          complexity: template.complexity,
          timeToLaunch: template.timeToLaunch,
          aiInsights
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4); // Show top 4 recommendations
  };

  const generateAIInsights = (template: any, profile: any, matchScore: number) => {
    const insights = {
      'lead-generation': {
        primaryReason: 'Optimal for building your customer pipeline with proven conversion methods',
        targetAudience: 'Small to medium businesses looking to scale their lead generation',
        expectedResults: 'Expect 15-25% conversion rate with proper optimization',
        optimizationTips: [
          'Use compelling headlines that address pain points',
          'Add social proof and testimonials',
          'Keep forms short (3-5 fields maximum)',
          'Include a strong value proposition above the fold'
        ]
      },
      'b2b-lead': {
        primaryReason: 'Designed specifically for B2B sales cycles and enterprise decision-making',
        targetAudience: 'B2B companies targeting enterprise clients with complex sales processes',
        expectedResults: 'Higher quality leads with 10-15% conversion but longer sales cycles',
        optimizationTips: [
          'Focus on business value and ROI',
          'Include case studies and enterprise testimonials',
          'Use professional design with trust indicators',
          'Implement progressive profiling for lead qualification'
        ]
      },
      'saas-trial': {
        primaryReason: 'Maximizes trial signups with friction-free onboarding experience',
        targetAudience: 'SaaS companies offering free trials or freemium products',
        expectedResults: 'High signup rates (20-30%) with focus on trial-to-paid conversion',
        optimizationTips: [
          'Highlight "No credit card required"',
          'Show product demo or video walkthrough',
          'Display feature benefits clearly',
          'Add progress indicators for signup flow'
        ]
      },
      'consultation': {
        primaryReason: 'Perfect for service-based businesses building trust through personal connection',
        targetAudience: 'Consultants, agencies, and professional service providers',
        expectedResults: 'Quality over quantity - expect 10-20% conversion to booked consultations',
        optimizationTips: [
          'Showcase expertise with credentials and experience',
          'Include calendar integration for easy booking',
          'Display client success stories',
          'Offer multiple consultation types or durations'
        ]
      },
      'product-launch': {
        primaryReason: 'Creates urgency and excitement around new product announcements',
        targetAudience: 'Companies launching new products or major feature updates',
        expectedResults: 'High engagement with 15-25% pre-order or waitlist conversion',
        optimizationTips: [
          'Use countdown timers for launch date',
          'Show product benefits with visual demonstrations',
          'Offer early-bird discounts or exclusive access',
          'Include social sharing buttons for viral growth'
        ]
      },
      'event-registration': {
        primaryReason: 'Optimized for event promotion with clear value proposition and easy registration',
        targetAudience: 'Event organizers, conferences, webinars, and workshop providers',
        expectedResults: 'Strong registration rates of 18-28% depending on event type',
        optimizationTips: [
          'Highlight key speakers and agenda',
          'Show date, time, and location prominently',
          'Include networking and learning benefits',
          'Add calendar integration for registered attendees'
        ]
      }
    };

    return insights[template.id as keyof typeof insights] || {
      primaryReason: 'AI-recommended based on your business profile and industry trends',
      targetAudience: 'Businesses looking to improve their lead generation and conversion rates',
      expectedResults: 'Expected improvement in conversion rates with proper optimization',
      optimizationTips: [
        'Optimize for mobile responsiveness',
        'Test different headlines and call-to-actions',
        'Add trust signals and social proof',
        'Monitor and analyze performance metrics'
      ]
    };
  };

  const getIndustryFit = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    return 'Fair';
  };

  // Use API data if available, otherwise generate recommendations locally
  const [recommendations] = useState<TemplateRecommendation[]>(() => {
    if (apiRecommendations?.recommendations) {
      return transformApiRecommendations(apiRecommendations.recommendations);
    }
    return generateRecommendations();
  });

  // Transform API recommendations to match our interface
  function transformApiRecommendations(apiRecs: any[]): TemplateRecommendation[] {
    return apiRecs.map((rec: any) => ({
      id: rec.templateId,
      title: getTemplateTitle(rec.templateId),
      description: getTemplateDescription(rec.templateId),
      icon: getTemplateIcon(rec.templateId),
      matchScore: rec.score,
      reasons: [`${rec.score}% match for your business profile`],
      conversionRate: rec.conversionRate,
      industryFit: rec.industryFit > 0.8 ? 'Excellent' : rec.industryFit > 0.6 ? 'Good' : 'Fair',
      complexity: 'Simple' as const,
      timeToLaunch: `${rec.setupTime || 20} minutes`,
      aiInsights: generateAIInsights({ id: rec.templateId }, userProfile, rec.score)
    }));
  }

  function getTemplateTitle(id: string): string {
    const titles: Record<string, string> = {
      'lead-generation': 'Lead Generation Template',
      'b2b-lead': 'B2B Enterprise Template',
      'saas-trial': 'SaaS Free Trial Template',
      'consultation': 'Consultation Booking Template',
      'product-launch': 'Product Launch Template',
      'event-registration': 'Event Registration Template'
    };
    return titles[id] || 'Template';
  }

  function getTemplateDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'lead-generation': 'Perfect for capturing leads with contact forms and compelling headlines.',
      'b2b-lead': 'Designed for B2B companies targeting enterprise clients.',
      'saas-trial': 'Convert visitors into trial users with compelling signup forms.',
      'consultation': 'Schedule consultations and strategy sessions.',
      'product-launch': 'Announce new products with countdown timers.',
      'event-registration': 'Drive event signups with compelling details.'
    };
    return descriptions[id] || 'Professional template for your business needs.';
  }

  function getTemplateIcon(id: string) {
    const icons: Record<string, any> = {
      'lead-generation': Users,
      'b2b-lead': Building,
      'saas-trial': Rocket,
      'consultation': MessageSquare,
      'product-launch': Package,
      'event-registration': Calendar
    };
    return icons[id] || Users;
  }

  const nextRecommendation = () => {
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  };

  const prevRecommendation = () => {
    setCurrentIndex((prev) => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const currentRecommendation = recommendations[currentIndex];

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-500 text-white rounded-full p-1">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Analyzing Your Business Profile...</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Our AI is generating personalized template recommendations based on your CRM data and industry trends.
              </p>
            </div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-500 text-white rounded-full p-1">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Using Smart Recommendations</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Showing intelligent template suggestions based on best practices and industry performance data.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRecommendation) return null;

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-purple-500 text-white rounded-full p-1">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">AI-Powered Recommendations</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Based on your business profile and industry trends, here are the templates most likely to drive conversions for your specific needs.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation Carousel */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <currentRecommendation.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {currentRecommendation.title}
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {currentRecommendation.matchScore}% Match
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {currentRecommendation.description}
                </p>
              </div>
            </div>
            
            {/* Carousel Navigation */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevRecommendation}
                disabled={recommendations.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {recommendations.length}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextRecommendation}
                disabled={recommendations.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* AI Insights Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Why This Template?</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                {currentRecommendation.aiInsights.primaryReason}
              </p>
              
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Target Audience</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                {currentRecommendation.aiInsights.targetAudience}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Expected Results</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                {currentRecommendation.aiInsights.expectedResults}
              </p>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-green-600">{currentRecommendation.conversionRate}%</div>
                  <div className="text-xs text-gray-500">Avg. Conversion</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-blue-600">{currentRecommendation.timeToLaunch}</div>
                  <div className="text-xs text-gray-500">Setup Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Reasons */}
          {currentRecommendation.reasons.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Why We Recommend This</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentRecommendation.reasons.map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              onClick={() => onUseTemplate(currentRecommendation.id)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    AI Optimization Tips for {currentRecommendation.title}
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Template Performance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Industry Fit</span>
                          <Badge variant="secondary">{currentRecommendation.industryFit}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Complexity</span>
                          <Badge variant="outline">{currentRecommendation.complexity}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Setup Time</span>
                          <span className="text-sm font-medium">{currentRecommendation.timeToLaunch}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">AI Optimization Tips</h4>
                      <ul className="space-y-2">
                        {currentRecommendation.aiInsights.optimizationTips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      onPreview(currentRecommendation.id);
                    }}
                    className="w-full"
                  >
                    View Full Template Preview
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* All Recommendations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {recommendations.map((rec, idx) => (
          <Card 
            key={rec.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              idx === currentIndex ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
            onClick={() => setCurrentIndex(idx)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <rec.icon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium truncate">{rec.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {rec.matchScore}% Match
                </Badge>
                <span className="text-xs text-gray-500">{rec.conversionRate}% CVR</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}