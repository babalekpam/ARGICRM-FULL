import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Crown, 
  Lock,
  CheckCircle
} from "lucide-react";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";

export default function FeatureTogglesPage() {
  const { user } = useAuth();
  const isPlatformOwner = user?.email === 'admin@default.com';
  
  const [features, setFeatures] = useState([
    {
      id: 'ai_predictions',
      name: 'AI Predictions',
      description: 'Advanced AI-powered customer behavior predictions',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Enterprise'
    },
    {
      id: 'reputation_management',
      name: 'Reputation Management',
      description: 'Multi-platform review monitoring and response management',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Professional'
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Detailed reporting and business intelligence',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Professional'
    },
    {
      id: 'white_label',
      name: 'White Label',
      description: 'Custom branding and white-label solutions',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Enterprise'
    },
    {
      id: 'custom_domain',
      name: 'Custom Domain',
      description: 'Use your own domain for the CRM platform',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Enterprise'
    },
    {
      id: 'api_access',
      name: 'API Access',
      description: 'Full API access for custom integrations',
      enabled: isPlatformOwner,
      isPremium: !isPlatformOwner,
      requiredPlan: 'Professional'
    }
  ]);

  const handleToggleFeature = (featureId: string) => {
    if (isPlatformOwner) {
      setFeatures(prev => prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      ));
    }
  };

  const handleUpgrade = (featureName: string, requiredPlan: string) => {
    if (isPlatformOwner) {
      // Platform owners have direct access to all features
      if (featureName === 'White Label') {
        window.location.href = '/white-label-settings';
      } else if (featureName === 'AI Predictions') {
        window.location.href = '/ai-predictions';
      } else if (featureName === 'Reputation Management') {
        window.location.href = '/reputation-management';
      } else if (featureName === 'Advanced Analytics') {
        window.location.href = '/analytics';
      } else if (featureName === 'API Access') {
        window.location.href = '/settings';
      } else if (featureName === 'Custom Domain') {
        window.location.href = '/settings';
      }
    } else {
      alert(`${featureName} requires ${requiredPlan} plan`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="mr-3 h-8 w-8 text-purple-600" />
              Feature Toggles
            </h1>
            <p className="text-gray-600 mt-1">Manage and configure platform features</p>
          </div>
          <div className="text-right">
            {isPlatformOwner ? (
              <div>
                <div className="text-sm text-green-600 mb-2 font-medium">Platform Owner Access</div>
                <Badge className="bg-green-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  All Features Unlocked
                </Badge>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-600 mb-2">Current Plan: <span className="font-medium">Starter</span></div>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            )}
          </div>
        </div>

        {!isPlatformOwner && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Professional Plan</CardTitle>
                <div className="text-2xl font-bold text-blue-600">$49/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Advanced Analytics & Reporting</li>
                  <li>• API Access & Webhooks</li>
                  <li>• Reputation Management</li>
                  <li>• Priority Support</li>
                </ul>
                <p className="text-sm text-green-600 mt-3">Save $100/year when billed annually</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Enterprise Plan</CardTitle>
                <div className="text-2xl font-bold text-purple-600">$99/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• AI Predictions & Insights</li>
                  <li>• White Label Branding</li>
                  <li>• Custom Domain</li>
                  <li>• Everything in Professional</li>
                </ul>
                <p className="text-sm text-green-600 mt-3">Save $200/year when billed annually</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className={isPlatformOwner ? "border-green-200" : "border-purple-200"}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{feature.name}</h3>
                    {isPlatformOwner ? (
                      <Badge className="bg-green-600 text-white mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Platform Access
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-600 text-white mt-2">
                        <Crown className="h-3 w-3 mr-1" />
                        {feature.requiredPlan}
                      </Badge>
                    )}
                  </div>
                  {isPlatformOwner ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-purple-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Switch 
                    checked={feature.enabled}
                    disabled={!isPlatformOwner && feature.isPremium}
                    onCheckedChange={() => handleToggleFeature(feature.id)}
                  />
                </div>
                
                {isPlatformOwner ? (
                  <Button 
                    onClick={() => handleUpgrade(feature.name, feature.requiredPlan)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Access Feature
                  </Button>
                ) : feature.isPremium && (
                  <Button 
                    onClick={() => handleUpgrade(feature.name, feature.requiredPlan)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Required
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}