import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen
} from "lucide-react";

interface InsightDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    impact: string;
    timeframe: string;
    data: any;
  } | null;
}

export function InsightDetailModal({ isOpen, onClose, insight }: InsightDetailModalProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);

  if (!insight) return null;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <Brain className="h-6 w-6 text-purple-600" />;
      case 'pattern': return <TrendingUp className="h-6 w-6 text-blue-600" />;
      case 'recommendation': return <Target className="h-6 w-6 text-green-600" />;
      case 'alert': return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default: return <Brain className="h-6 w-6 text-gray-600" />;
    }
  };

  const getActionItems = () => {
    switch (insight.type) {
      case 'prediction':
        return [
          'Review the predicted outcome and timeline',
          'Prepare necessary resources or actions',
          'Set up monitoring for key indicators',
          'Schedule follow-up reviews'
        ];
      case 'pattern':
        return [
          'Analyze the identified pattern',
          'Optimize workflows based on patterns',
          'Set up automated triggers',
          'Monitor pattern consistency'
        ];
      case 'recommendation':
        return [
          'Evaluate the recommendation impact',
          'Plan implementation strategy',
          'Allocate required resources',
          'Track implementation results'
        ];
      case 'alert':
        return [
          'Assess the risk level immediately',
          'Take preventive actions',
          'Notify relevant stakeholders',
          'Monitor situation closely'
        ];
      default:
        return ['Review insight details', 'Plan next steps'];
    }
  };

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(type);
    // In a real implementation, this would send feedback to analytics
    console.log(`User feedback for insight ${insight.id}: ${type}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getInsightIcon(insight.type)}
            <div>
              <DialogTitle className="text-xl">{insight.title}</DialogTitle>
              <DialogDescription className="mt-1">
                AI-generated insight based on your behavior patterns
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Insight Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insight Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{insight.description}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{insight.confidence}%</div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
                <div className="text-center">
                  <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                    {insight.impact} impact
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">Expected Impact</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{insight.timeframe}</span>
                  </div>
                  <div className="text-sm text-gray-500">Timeframe</div>
                </div>
              </div>

              <Progress value={insight.confidence} className="h-2" />
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getActionItems().map((action, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Insights */}
          {insight.data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Supporting Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(insight.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Was this insight helpful?</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback ? (
                <div className="text-center text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Thank you for your feedback!</p>
                </div>
              ) : (
                <div className="flex space-x-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback('helpful')}
                    className="flex items-center space-x-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback('not-helpful')}
                    className="flex items-center space-x-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>Not Helpful</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="flex items-center space-x-2">
              <span>Take Action</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}