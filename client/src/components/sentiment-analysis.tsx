import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Brain, Search, Smile, Meh, Frown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Contact, SentimentAnalysis } from "@shared/schema";

interface AnalysisFormData {
  contactId: string;
  message: string;
}

export default function SentimentAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<SentimentAnalysis | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactsData } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
  const contacts = contactsData || [];

  const { data: analysesData } = useQuery<SentimentAnalysis[]>({
    queryKey: ["/api/sentiment"],
  });
  const recentAnalyses = analysesData || [];

  const form = useForm<AnalysisFormData>({
    defaultValues: {
      contactId: "",
      message: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { contactId: string; message: string }) => {
      console.log("[SentimentAnalysis] Sending data to API:", data);
      
      // Backend expects 'text' field, not 'message'
      const apiData = {
        text: data.message,
        contactId: data.contactId
      };
      
      console.log("[SentimentAnalysis] Formatted API data:", apiData);
      const response = await apiRequest("POST", "/api/sentiment/analyze", apiData);
      return response.json();
    },
    onSuccess: (result) => {
      console.log("[SentimentAnalysis] Raw API result:", result);
      
      // Transform the API result to match the expected frontend format
      const transformedResult = {
        id: result.id || 0,
        sentiment: result.sentiment?.toUpperCase() || 'NEUTRAL',
        score: Math.round((result.confidence || 0) * 100), // Convert to percentage
        keywords: Array.isArray(result.keywords) ? result.keywords.join(', ') : (result.keywords || 'None detected'),
        emotionalTone: result.emotionalTone || (result.sentiment === 'positive' ? 'Happy' : result.sentiment === 'negative' ? 'Frustrated' : 'Neutral'),
        urgencyLevel: result.urgency || 'low',
        contactId: result.contactId,
        message: result.text || '',
        tenantId: result.tenantId || '',
        createdAt: result.createdAt ? new Date(result.createdAt) : new Date(),
        updatedAt: result.updatedAt ? new Date(result.updatedAt) : null
      } as SentimentAnalysis;
      
      console.log("[SentimentAnalysis] Transformed result:", transformedResult);
      setAnalysisResult(transformedResult);
      queryClient.invalidateQueries({ queryKey: ["/api/sentiment"] });
      toast({
        title: "Analysis Complete!",
        description: "Sentiment analysis has been completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze sentiment",
      });
    },
  });

  const onSubmit = (data: AnalysisFormData) => {
    console.log("[SentimentAnalysis] Form data:", data);
    console.log("[SentimentAnalysis] ContactId:", data.contactId);
    console.log("[SentimentAnalysis] Message:", data.message);
    
    if (!data.contactId || !data.message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a contact and enter a message",
      });
      return;
    }

    // For sentiment analysis, contactId is optional, just pass string ID
    analyzeMutation.mutate({
      contactId: data.contactId, // Keep as string ID, don't parse to int
      message: data.message,
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <Smile className="text-success" size={20} />;
      case 'NEGATIVE':
        return <Frown className="text-destructive" size={20} />;
      default:
        return <Meh className="text-warning" size={20} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-success/10 border-success/20 text-success';
      case 'NEGATIVE':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      default:
        return 'bg-warning/10 border-warning/20 text-warning';
    }
  };

  const getContactName = (contactId: string | number) => {
    const contact = contacts.find(c => c.id === contactId.toString());
    return contact?.name || 'Unknown Contact';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <>
      {/* Message Analysis */}
      <Card className="border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Brain className="text-primary" size={20} />
            <span>Sentiment Analysis</span>
          </h2>
        </div>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Select Contact</Label>
              <Select 
                value={form.watch("contactId")} 
                onValueChange={(value) => form.setValue("contactId", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Message to Analyze</Label>
              <Textarea
                {...form.register("message")}
                placeholder="Paste customer message here for sentiment analysis..."
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Search size={16} className="mr-2" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze Sentiment"}
            </Button>
          </form>

          {/* Analysis Results */}
          <div className="mt-6">
            {!analysisResult ? (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Brain className="mx-auto mb-3 opacity-50" size={48} />
                  <p>No analysis results yet</p>
                  <p className="text-sm">Enter a message above to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-lg border ${getSentimentColor(analysisResult.sentiment)}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysisResult.sentiment === 'POSITIVE' ? 'bg-success' : analysisResult.sentiment === 'NEGATIVE' ? 'bg-destructive' : 'bg-warning'}`}>
                      {getSentimentIcon(analysisResult.sentiment)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {analysisResult.sentiment === 'POSITIVE' ? 'Positive' : 
                         analysisResult.sentiment === 'NEGATIVE' ? 'Negative' : 'Neutral'} Sentiment
                      </p>
                      <p className="text-sm opacity-80">Confidence: {analysisResult.score}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {analysisResult.sentiment === 'POSITIVE' ? '+' : 
                       analysisResult.sentiment === 'NEGATIVE' ? '-' : ''}
                      {(analysisResult.score / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Analysis Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Keywords:</span>
                      <span className="font-medium">{analysisResult.keywords || 'None detected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emotional Tone:</span>
                      <span className="font-medium capitalize">{analysisResult.emotionalTone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Urgency Level:</span>
                      <span className={`font-medium ${
                        analysisResult.urgencyLevel === 'HIGH' ? 'text-destructive' :
                        analysisResult.urgencyLevel === 'MEDIUM' ? 'text-warning' : 'text-success'
                      }`}>
                        {analysisResult.urgencyLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Analysis History */}
      <Card className="border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-md font-semibold text-foreground">Recent Analysis</h3>
        </div>
        <CardContent className="p-6">
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No analysis history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      analysis.sentiment === 'POSITIVE' ? 'bg-success' :
                      analysis.sentiment === 'NEGATIVE' ? 'bg-destructive' : 'bg-warning'
                    }`}>
                      {getSentimentIcon(analysis.sentiment)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {getContactName(analysis.contactId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(analysis.createdAt!)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      analysis.sentiment === 'POSITIVE' ? 'text-success' :
                      analysis.sentiment === 'NEGATIVE' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {analysis.sentiment === 'POSITIVE' ? 'Positive' : 
                       analysis.sentiment === 'NEGATIVE' ? 'Negative' : 'Neutral'}
                    </p>
                    <p className="text-xs text-muted-foreground">{analysis.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
