import SentimentAnalysis from "@/components/sentiment-analysis";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, AlertTriangle, Smile } from "lucide-react";

export default function SentimentPage() {
  const { data: sentimentData = [], isLoading: sentimentLoading, error: sentimentError } = useQuery({
    queryKey: ["/api/sentiment"],
  });

  const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Debug logging
  console.log("Sentiment Page Debug:");
  console.log("- Sentiment data:", sentimentData);
  console.log("- Sentiment loading:", sentimentLoading);
  console.log("- Sentiment error:", sentimentError);
  console.log("- Contacts data:", contacts);
  console.log("- Contacts loading:", contactsLoading);
  console.log("- Contacts error:", contactsError);
  console.log("- Contacts length:", Array.isArray(contacts) ? contacts.length : "Not an array");

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIVE": return "bg-green-100 text-green-800";
      case "NEGATIVE": return "bg-red-100 text-red-800";
      case "NEUTRAL": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIVE": return <Smile className="h-4 w-4" />;
      case "NEGATIVE": return <AlertTriangle className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH": return "bg-red-100 text-red-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const sentimentStats = {
    positive: sentimentData.filter((s: any) => s.sentiment === "POSITIVE").length,
    negative: sentimentData.filter((s: any) => s.sentiment === "NEGATIVE").length,
    neutral: sentimentData.filter((s: any) => s.sentiment === "NEUTRAL").length,
    high_urgency: sentimentData.filter((s: any) => s.urgencyLevel === "HIGH").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sentiment Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze customer emotions and sentiment with AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <Smile className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{sentimentStats.positive}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3" />
                Customer satisfaction
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{sentimentStats.negative}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Needs attention
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neutral Sentiment</CardTitle>
              <Heart className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{sentimentStats.neutral}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Heart className="mr-1 h-3 w-3" />
                Baseline emotions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Urgency</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{sentimentStats.high_urgency}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Urgent responses needed
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              New Analysis
            </h2>
            <SentimentAnalysis />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recent Analysis Results
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sentimentData.slice(0, 10).map((analysis: any) => {
                const contact = contacts.find((c: any) => c.id === analysis.contactId);
                
                return (
                  <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getSentimentIcon(analysis.sentiment)}
                          <span className="font-medium">
                            {contact ? contact.name : `Contact #${analysis.contactId}`}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getSentimentColor(analysis.sentiment)}>
                            {analysis.sentiment}
                          </Badge>
                          <Badge className={getUrgencyColor(analysis.urgencyLevel)}>
                            {analysis.urgencyLevel}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {analysis.message}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Score: {analysis.score}%</span>
                          {analysis.emotionalTone && (
                            <span>Tone: {analysis.emotionalTone}</span>
                          )}
                        </div>
                        <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {analysis.keywords && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Keywords: </span>
                          <span className="text-xs text-blue-600">{analysis.keywords}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}