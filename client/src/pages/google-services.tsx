import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { MapPin, Languages, Brain, Calendar, Loader2 } from 'lucide-react';

interface Location {
  address: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface Translation {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface SentimentAnalysis {
  sentiment: string;
  confidence: number;
  keywords: string[];
}

export function GoogleServicesPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const setLoadingState = (key: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  const setResult = (key: string, result: any) => {
    setResults(prev => ({ ...prev, [key]: result }));
  };

  const handleGeocoding = async () => {
    const address = (document.getElementById('address-input') as HTMLInputElement)?.value;
    if (!address) {
      toast({ title: 'Error', description: 'Please enter an address', variant: 'destructive' });
      return;
    }

    setLoadingState('geocoding', true);
    try {
      const response = await fetch('/api/google/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      if (data.success) {
        setResult('geocoding', data.location);
        toast({ title: 'Success', description: 'Address geocoded successfully!' });
      } else {
        throw new Error(data.error || 'Geocoding failed');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Geocoding failed',
        variant: 'destructive'
      });
    } finally {
      setLoadingState('geocoding', false);
    }
  };

  const handleTranslation = async () => {
    const text = (document.getElementById('translation-input') as HTMLTextAreaElement)?.value;
    const targetLang = (document.getElementById('target-lang') as HTMLInputElement)?.value || 'es';
    
    if (!text) {
      toast({ title: 'Error', description: 'Please enter text to translate', variant: 'destructive' });
      return;
    }

    setLoadingState('translation', true);
    try {
      const response = await fetch('/api/google/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang })
      });

      const data = await response.json();
      if (data.success) {
        setResult('translation', data.translation);
        toast({ title: 'Success', description: 'Text translated successfully!' });
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Translation failed',
        variant: 'destructive'
      });
    } finally {
      setLoadingState('translation', false);
    }
  };

  const handleSentimentAnalysis = async () => {
    const text = (document.getElementById('sentiment-input') as HTMLTextAreaElement)?.value;
    
    if (!text) {
      toast({ title: 'Error', description: 'Please enter text to analyze', variant: 'destructive' });
      return;
    }

    setLoadingState('sentiment', true);
    try {
      const response = await fetch('/api/google/ai/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.success) {
        setResult('sentiment', data.analysis);
        toast({ title: 'Success', description: 'Sentiment analysis completed!' });
      } else {
        throw new Error(data.error || 'Sentiment analysis failed');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Sentiment analysis failed',
        variant: 'destructive'
      });
    } finally {
      setLoadingState('sentiment', false);
    }
  };

  const handleCustomerInsights = async () => {
    const customerName = (document.getElementById('customer-name') as HTMLInputElement)?.value;
    const company = (document.getElementById('customer-company') as HTMLInputElement)?.value;
    
    if (!customerName && !company) {
      toast({ title: 'Error', description: 'Please enter customer name or company', variant: 'destructive' });
      return;
    }

    setLoadingState('insights', true);
    try {
      const customerData = {
        name: customerName,
        company: company,
        industry: 'Technology',
        interactions: ['Email inquiry about pricing', 'Demo request'],
        purchases: []
      };

      const response = await fetch('/api/google/ai/customer-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerData })
      });

      const data = await response.json();
      if (data.success) {
        setResult('insights', data.insights);
        toast({ title: 'Success', description: 'Customer insights generated!' });
      } else {
        throw new Error(data.error || 'Insights generation failed');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Insights generation failed',
        variant: 'destructive'
      });
    } finally {
      setLoadingState('insights', false);
    }
  };

  const checkServiceHealth = async () => {
    setLoadingState('health', true);
    try {
      const response = await fetch('/api/google/health');
      const data = await response.json();
      setResult('health', data);
      
      if (data.success) {
        toast({ 
          title: 'Services Online', 
          description: `${data.availableServices.length} Google services are available` 
        });
      } else {
        toast({ 
          title: 'Service Issue', 
          description: 'Some Google services may be unavailable',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to check service health',
        variant: 'destructive'
      });
    } finally {
      setLoadingState('health', false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Services Integration</h1>
          <p className="text-muted-foreground mt-2">
            Test and showcase Google API integrations for enhanced CRM functionality
          </p>
        </div>
        <Button onClick={checkServiceHealth} disabled={loading.health}>
          {loading.health ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Check Service Health
        </Button>
      </div>

      {/* Service Health Status */}
      {results.health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={results.health.success ? "default" : "destructive"}>
                {results.health.success ? "Online" : "Issues"}
              </Badge>
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.health.availableServices?.map((service: string) => (
                <Badge key={service} variant="outline">{service}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last checked: {results.health.timestamp}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Maps Geocoding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Geocoding
            </CardTitle>
            <CardDescription>
              Convert addresses to coordinates using Google Maps API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="address-input"
              placeholder="Enter an address (e.g., 1600 Amphitheatre Parkway, Mountain View, CA)"
            />
            <Button onClick={handleGeocoding} disabled={loading.geocoding} className="w-full">
              {loading.geocoding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Geocode Address
            </Button>
            
            {results.geocoding && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p><strong>Address:</strong> {results.geocoding.formattedAddress}</p>
                <p><strong>Coordinates:</strong> {results.geocoding.latitude}, {results.geocoding.longitude}</p>
                {results.geocoding.placeId && (
                  <p><strong>Place ID:</strong> {results.geocoding.placeId}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Translate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Text Translation
            </CardTitle>
            <CardDescription>
              Translate text using Google Translate API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              id="translation-input"
              placeholder="Enter text to translate..."
              rows={3}
            />
            <Input
              id="target-lang"
              placeholder="Target language code (e.g., es, fr, de)"
              defaultValue="es"
            />
            <Button onClick={handleTranslation} disabled={loading.translation} className="w-full">
              {loading.translation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Translate Text
            </Button>
            
            {results.translation && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p><strong>Translation:</strong> {results.translation.translatedText}</p>
                {results.translation.detectedSourceLanguage && (
                  <p><strong>Detected Language:</strong> {results.translation.detectedSourceLanguage}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Analyze sentiment using Google Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              id="sentiment-input"
              placeholder="Enter customer message or feedback to analyze..."
              rows={3}
            />
            <Button onClick={handleSentimentAnalysis} disabled={loading.sentiment} className="w-full">
              {loading.sentiment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyze Sentiment
            </Button>
            
            {results.sentiment && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <strong>Sentiment:</strong>
                  <Badge variant={
                    results.sentiment.sentiment === 'positive' ? 'default' : 
                    results.sentiment.sentiment === 'negative' ? 'destructive' : 'secondary'
                  }>
                    {results.sentiment.sentiment}
                  </Badge>
                </div>
                <p><strong>Confidence:</strong> {(results.sentiment.confidence * 100).toFixed(1)}%</p>
                {results.sentiment.keywords && results.sentiment.keywords.length > 0 && (
                  <div>
                    <strong>Keywords:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {results.sentiment.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Customer Insights
            </CardTitle>
            <CardDescription>
              Generate customer insights using Google Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="customer-name"
              placeholder="Customer name"
            />
            <Input
              id="customer-company"
              placeholder="Company name"
            />
            <Button onClick={handleCustomerInsights} disabled={loading.insights} className="w-full">
              {loading.insights ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate Insights
            </Button>
            
            {results.insights && (
              <div className="bg-muted p-3 rounded-md">
                <strong>AI Insights:</strong>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {results.insights}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default GoogleServicesPage;