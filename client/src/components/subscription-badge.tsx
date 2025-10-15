import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { saasFeatures } from "@/services/saas-features";
import { 
  Crown, 
  Users, 
  Database, 
  Mail, 
  MessageSquare, 
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export function SubscriptionBadge() {
  const currentPlan = saasFeatures.getCurrentPlan();
  const usageMetrics = saasFeatures.getUsageMetrics();
  
  if (!currentPlan || !usageMetrics) return null;

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter': return 'bg-gray-100 text-gray-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'unlimited': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const checkUsageAlert = () => {
    const userCheck = saasFeatures.checkLimit('users');
    const contactCheck = saasFeatures.checkLimit('contacts');
    const storageCheck = saasFeatures.checkLimit('storage');
    
    const alerts = [userCheck, contactCheck, storageCheck].filter(check => 
      check.percentage > 80 && check.limit !== -1
    );
    
    return alerts.length > 0;
  };

  const hasAlert = checkUsageAlert();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          {hasAlert && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getPlanColor(currentPlan.id)}>
            <Crown className="h-3 w-3 mr-1" />
            {currentPlan.name}
          </Badge>
          <div className="text-right">
            <div className="font-bold">${currentPlan.price}</div>
            <div className="text-xs text-gray-500">/user/month</div>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Usage Overview</div>
          
          {/* Users */}
          {currentPlan.limits.users !== -1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Users
                </span>
                <span>{usageMetrics.users} / {currentPlan.limits.users}</span>
              </div>
              <Progress 
                value={(usageMetrics.users / currentPlan.limits.users) * 100} 
                className="h-1" 
              />
            </div>
          )}

          {/* Contacts */}
          {currentPlan.limits.contacts !== -1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center">
                  <Database className="h-3 w-3 mr-1" />
                  Contacts
                </span>
                <span>{usageMetrics.contacts.toLocaleString()} / {currentPlan.limits.contacts.toLocaleString()}</span>
              </div>
              <Progress 
                value={(usageMetrics.contacts / currentPlan.limits.contacts) * 100} 
                className="h-1" 
              />
            </div>
          )}

          {/* Storage */}
          {currentPlan.limits.storage !== -1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Storage</span>
                <span>{usageMetrics.storage} GB / {currentPlan.limits.storage} GB</span>
              </div>
              <Progress 
                value={(usageMetrics.storage / currentPlan.limits.storage) * 100} 
                className="h-1" 
              />
            </div>
          )}

          {/* Emails */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                Emails (this month)
              </span>
              <span>
                {usageMetrics.emailsSent.toLocaleString()} 
                {currentPlan.limits.emailsPerMonth !== -1 && ` / ${currentPlan.limits.emailsPerMonth.toLocaleString()}`}
              </span>
            </div>
            {currentPlan.limits.emailsPerMonth !== -1 && (
              <Progress 
                value={(usageMetrics.emailsSent / currentPlan.limits.emailsPerMonth) * 100} 
                className="h-1" 
              />
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full text-xs"
          onClick={() => window.open('/pricing', '_blank')}
        >
          {currentPlan.id === 'unlimited' ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              You have the best plan
            </>
          ) : (
            <>
              Upgrade Plan
              <ArrowRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}