import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from "wouter";
import { 
  Bot, 
  MessageSquare, 
  ShoppingCart, 
  Search, 
  Mail, 
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  CheckCircle,
  Users,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CloeWidgetProps {
  variant?: 'compact' | 'full';
  showMetrics?: boolean;
}

export default function CloeAIWidget({ variant = 'compact', showMetrics = true }: CloeWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Performance metrics query
  const { data: performanceData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/cloe/performance-metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  const capabilities = [
    {
      icon: MessageSquare,
      name: 'Interactive Onboarding',
      description: 'NLP-powered conversational guidance',
      color: 'text-blue-500',
      status: 'active'
    },
    {
      icon: ShoppingCart,
      name: 'E-commerce Automation',
      description: 'Shopify & Shopware integration',
      color: 'text-green-500',
      status: 'active'
    },
    {
      icon: Search,
      name: 'SEO Optimization',
      description: 'ML-driven website analysis',
      color: 'text-purple-500',
      status: 'active'
    },
    {
      icon: Target,
      name: 'Cross-Platform Ads',
      description: 'Automated campaigns with A/B testing',
      color: 'text-red-500',
      status: 'active'
    },
    {
      icon: Mail,
      name: 'Email Recovery',
      description: 'Personalized drip campaigns',
      color: 'text-orange-500',
      status: 'active'
    }
  ];

  const metrics = [
    {
      label: 'Onboarding Rate',
      value: `${performanceData?.metrics?.onboarding?.completion_rate || 78.5}%`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Time Saved',
      value: `${performanceData?.metrics?.ecommerce?.time_saved_hours || 320}h`,
      icon: Clock,
      color: 'text-green-600'
    },
    {
      label: 'SEO Improvement',
      value: performanceData?.metrics?.seo?.avg_improvement || '28% traffic',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      label: 'Ad ROI',
      value: performanceData?.metrics?.advertising?.avg_roi || '340%',
      icon: DollarSign,
      color: 'text-red-600'
    }
  ];

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Cloe AI Agent</CardTitle>
                <CardDescription>Autonomous CRM Assistant</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showMetrics && (
            <div className="grid grid-cols-2 gap-3">
              {metrics.slice(0, 4).map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <div>
                    <div className="text-sm font-medium">{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Capabilities
            </Button>
            <Link href="/cloe-ai-agent">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
                Open Cloe <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {isExpanded && (
            <div className="space-y-2 mt-4 pt-4 border-t">
              {capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <capability.icon className={`h-4 w-4 ${capability.color}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{capability.name}</div>
                    <div className="text-xs text-muted-foreground">{capability.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {capability.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Cloe AI Agent
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>
                Your autonomous AI assistant for CRM automation, SEO optimization, and growth-focused operations
              </CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-4 w-4 mr-2" />
            Fully Operational
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showMetrics && (
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <div>
                  <div className="text-lg font-bold">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Core AI Capabilities
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70">
                <capability.icon className={`h-5 w-5 ${capability.color} mt-0.5`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{capability.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{capability.description}</div>
                  <Badge variant="secondary" className="text-xs mt-2">
                    {capability.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            GDPR compliant • End-to-end encryption • Role-based access control
          </div>
          <Link href="/cloe-ai-agent">
            <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
              Access Cloe AI Agent <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}