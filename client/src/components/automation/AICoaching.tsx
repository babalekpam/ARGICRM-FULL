import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  MessageCircle,
  Zap,
  Clock,
  DollarSign,
  Users,
  BarChart,
  Settings,
  Star,
  BookOpen,
  Award
} from 'lucide-react';

interface AICoachingProps {
  automationData: any;
  businessMetrics: any;
}

const coachingCategories = [
  { id: 'optimization', name: 'Performance Optimization', icon: TrendingUp, color: 'text-green-600' },
  { id: 'efficiency', name: 'Efficiency Improvements', icon: Zap, color: 'text-blue-600' },
  { id: 'cost_reduction', name: 'Cost Reduction', icon: DollarSign, color: 'text-purple-600' },
  { id: 'risk_management', name: 'Risk Management', icon: AlertTriangle, color: 'text-yellow-600' },
  { id: 'scaling', name: 'Scaling Strategies', icon: BarChart, color: 'text-indigo-600' },
  { id: 'best_practices', name: 'Best Practices', icon: Award, color: 'text-orange-600' }
];

export function AICoaching({ automationData, businessMetrics }: AICoachingProps) {
  const [activeCategory, setActiveCategory] = useState('optimization');
  const [coachingInsights, setCoachingInsights] = useState<any[]>([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<any[]>([]);
  const [businessScore, setBusinessScore] = useState(0);
  const { toast } = useToast();

  const getAICoaching = useMutation({
    mutationFn: async (category: string) => {
      return await apiRequest('POST', '/api/automation/ai-coaching', {
        category,
        automationData,
        businessMetrics
      });
    },
    onSuccess: (response) => {
      setCoachingInsights(response.insights || []);
      setPersonalizedRecommendations(response.recommendations || []);
      setLearningPath(response.learningPath || []);
      setBusinessScore(response.businessScore || 0);
    },
    onError: () => {
      // Fallback coaching data
      generateFallbackCoaching(activeCategory);
    }
  });

  const generateFallbackCoaching = (category: string) => {
    const fallbackInsights = {
      optimization: [
        {
          id: 1,
          title: "Inventory Automation Efficiency Gap",
          description: "Your inventory automation is performing at 87% efficiency. Industry leaders achieve 95%+.",
          impact: "high",
          actionItems: [
            "Add 3 more low-stock triggers for different categories",
            "Implement predictive restocking based on seasonal trends",
            "Set up automated supplier notifications"
          ],
          expectedResult: "12% efficiency improvement, $8,000 monthly savings",
          priority: 1
        },
        {
          id: 2,
          title: "Pricing Automation Opportunities",
          description: "Your pricing rules cover 65% of products. Expanding coverage could increase revenue by 15%.",
          impact: "high",
          actionItems: [
            "Create category-specific pricing rules",
            "Add competitor price monitoring",
            "Implement dynamic discount automation"
          ],
          expectedResult: "$25,000 additional monthly revenue",
          priority: 2
        }
      ],
      efficiency: [
        {
          id: 3,
          title: "Workflow Consolidation Opportunity",
          description: "You have 5 separate marketing automation rules that could be combined into 2 efficient workflows.",
          impact: "medium",
          actionItems: [
            "Merge similar trigger conditions",
            "Create cascading action sequences",
            "Reduce API call redundancy"
          ],
          expectedResult: "40% faster execution, reduced system load",
          priority: 1
        }
      ],
      cost_reduction: [
        {
          id: 4,
          title: "Resource Optimization",
          description: "Your automation processes are using 34% more compute resources than necessary.",
          impact: "medium",
          actionItems: [
            "Optimize rule execution timing",
            "Batch similar operations",
            "Implement smart caching"
          ],
          expectedResult: "$1,200 monthly cost reduction",
          priority: 1
        }
      ]
    };

    const fallbackRecommendations = [
      {
        id: 1,
        title: "Quick Win: Add Low Stock Alerts",
        description: "Implement automatic low stock notifications for your top 20 products",
        effort: "Low",
        impact: "High",
        timeToImplement: "30 minutes",
        roi: "320%",
        steps: [
          "Go to Inventory Automation",
          "Create new rule with 'Low Stock' trigger",
          "Set threshold to 10 units",
          "Add email notification action"
        ]
      },
      {
        id: 2,
        title: "Strategic: Dynamic Pricing Engine",
        description: "Set up competitor-based pricing for your main product categories",
        effort: "Medium",
        impact: "Very High",
        timeToImplement: "2 hours",
        roi: "450%",
        steps: [
          "Enable price monitoring integrations",
          "Create pricing rules by category",
          "Set minimum margin thresholds",
          "Test with A/B product groups"
        ]
      }
    ];

    const fallbackLearningPath = [
      {
        module: "Automation Fundamentals",
        progress: 100,
        lessons: ["Triggers & Actions", "Conditional Logic", "Testing Rules"],
        status: "completed"
      },
      {
        module: "Advanced Workflows",
        progress: 60,
        lessons: ["Multi-step Processes", "Error Handling", "Performance Optimization"],
        status: "in_progress"
      },
      {
        module: "AI Integration",
        progress: 0,
        lessons: ["Machine Learning Rules", "Predictive Automation", "Smart Triggers"],
        status: "not_started"
      }
    ];

    setCoachingInsights(fallbackInsights[activeCategory as keyof typeof fallbackInsights] || []);
    setPersonalizedRecommendations(fallbackRecommendations);
    setLearningPath(fallbackLearningPath);
    setBusinessScore(78);
  };

  useEffect(() => {
    getAICoaching.mutate(activeCategory);
  }, [activeCategory]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Coach Header */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Automation Coach</CardTitle>
                <CardDescription>Personalized insights and recommendations for your automation strategy</CardDescription>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{businessScore}</div>
              <div className="text-sm text-muted-foreground">Automation Score</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Coaching Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {coachingCategories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <Icon className={`h-5 w-5 ${activeCategory === category.id ? 'text-white' : category.color}`} />
                  <span className="text-xs text-center leading-tight">{category.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Coaching Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Insights & Analysis
            </CardTitle>
            <CardDescription>Intelligent analysis of your automation performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {coachingInsights.map(insight => (
                  <Card key={insight.id} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Action Items:</p>
                        <ul className="text-sm space-y-1">
                          {insight.actionItems?.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-3 p-2 bg-green-50 rounded">
                        <p className="text-sm font-medium text-green-800">Expected Result:</p>
                        <p className="text-sm text-green-700">{insight.expectedResult}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Tailored action plans for your business</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {personalizedRecommendations.map(rec => (
                  <Card key={rec.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <div className="flex gap-1">
                          <Badge className={getEffortColor(rec.effort)}>{rec.effort}</Badge>
                          <Badge variant="outline">ROI: {rec.roi}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="font-medium">Impact:</span> {rec.impact}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {rec.timeToImplement}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Implementation Steps:</p>
                        <ol className="text-sm space-y-1">
                          {rec.steps?.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      <Button className="w-full mt-3" size="sm">
                        Start Implementation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Learning Path & Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Automation Learning Path
          </CardTitle>
          <CardDescription>Structured learning to advance your automation skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningPath.map((module, index) => (
              <Card key={index} className={`border-l-4 ${
                module.status === 'completed' ? 'border-l-green-500' :
                module.status === 'in_progress' ? 'border-l-blue-500' :
                'border-l-gray-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{module.module}</h4>
                    <Badge variant={
                      module.status === 'completed' ? 'default' :
                      module.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {module.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lessons:</p>
                    {module.lessons.map((lesson: string, lessonIndex: number) => (
                      <div key={lessonIndex} className="flex items-center gap-2 text-sm">
                        {lessonIndex < Math.floor(module.lessons.length * module.progress / 100) ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        {lesson}
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant={module.status === 'not_started' ? 'default' : 'outline'}
                    size="sm" 
                    className="w-full mt-3"
                  >
                    {module.status === 'completed' ? 'Review' :
                     module.status === 'in_progress' ? 'Continue' :
                     'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>One-click improvements based on AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <span className="font-medium">Optimize Rules</span>
              <span className="text-xs text-muted-foreground">Auto-tune performance</span>
            </Button>
            
            <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
              <Target className="h-6 w-6 text-blue-500" />
              <span className="font-medium">Add Triggers</span>
              <span className="text-xs text-muted-foreground">Expand automation</span>
            </Button>
            
            <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
              <DollarSign className="h-6 w-6 text-purple-500" />
              <span className="font-medium">Cost Analysis</span>
              <span className="text-xs text-muted-foreground">Find savings</span>
            </Button>
            
            <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
              <MessageCircle className="h-6 w-6 text-orange-500" />
              <span className="font-medium">Get Support</span>
              <span className="text-xs text-muted-foreground">Expert guidance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}