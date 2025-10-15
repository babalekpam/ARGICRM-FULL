import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Languages, Globe, Loader2, Check, ArrowRight, MapPin, Users } from 'lucide-react';

export default function TranslationTest() {
  const { 
    currentLanguage, 
    setLanguage,
    translate, 
    translateBulk, 
    detectLanguage, 
    isLoading, 
    error,
    supportedLanguages
  } = useLanguage();
  
  const [testText, setTestText] = useState('Welcome to NODE CRM! This is a comprehensive customer relationship management platform with advanced AI capabilities.');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<{ language: string; confidence: number } | null>(null);
  const [bulkTexts, setBulkTexts] = useState([
    'Dashboard',
    'Contacts',
    'Analytics',
    'Settings',
    'Reports'
  ]);
  const [bulkTranslations, setBulkTranslations] = useState<string[]>([]);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [countryLanguage, setCountryLanguage] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'detecting' | 'success' | 'error'>('detecting');

  const handleTranslate = async () => {
    if (!testText.trim()) return;
    
    const result = await translate(testText, 'CRM interface');
    setTranslatedText(result);
  };

  const handleDetectLanguage = async () => {
    if (!testText.trim()) return;
    
    const result = await detectLanguage(testText);
    setDetectedLanguage(result);
  };

  const handleBulkTranslate = async () => {
    const results = await translateBulk(bulkTexts, 'Navigation items');
    setBulkTranslations(results);
  };

  // Country detection demo
  const detectCountryInfo = async () => {
    setDetectionStatus('detecting');
    try {
      // Get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Try geolocation API
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        setDetectedCountry(data.country_name + ' (' + data.country_code + ')');
        
        // Mock country-to-language mapping (simplified)
        const countryLanguageMap: Record<string, string> = {
          'US': 'English', 'CA': 'English', 'GB': 'English',
          'ES': 'Spanish', 'MX': 'Spanish', 'AR': 'Spanish',
          'FR': 'French', 'BE': 'French', 'CH': 'French',
          'DE': 'German', 'AT': 'German', 
          'IT': 'Italian', 'PT': 'Portuguese', 'BR': 'Portuguese',
          'RU': 'Russian', 'CN': 'Chinese', 'JP': 'Japanese',
          'KR': 'Korean', 'IN': 'Hindi', 'SA': 'Arabic'
        };
        
        setCountryLanguage(countryLanguageMap[data.country_code] || 'English (default)');
        setDetectionStatus('success');
      } else {
        throw new Error('Geolocation API failed');
      }
    } catch (error) {
      console.error('Country detection failed:', error);
      setDetectedCountry('Detection failed');
      setCountryLanguage('Fallback to browser language');
      setDetectionStatus('error');
    }
  };

  // Auto-detect on component mount
  React.useEffect(() => {
    detectCountryInfo();
  }, []);

  const sampleUIElements = {
    welcome: 'Welcome to NODE CRM',
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    analytics: 'Analytics',
    settings: 'Settings',
    logout: 'Logout'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <TranslatedText text="Multilingual Translation Testing" context="page title" />
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText text="Test the real-time translation capabilities of NODE CRM" context="page description" />
            </p>
          </div>

          {/* Auto-Translation Demo */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <TranslatedText text="Live Auto-Translation Demo" context="demo title" showLoader />
              </CardTitle>
              <CardDescription>
                <TranslatedText 
                  text="These texts automatically update when you change the language above" 
                  context="demo description" 
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    <TranslatedText text="Navigation Items" context="section title" />
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Dashboard" context="navigation" className="font-medium" showLoader />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Contacts" context="navigation" className="font-medium" showLoader />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Analytics" context="navigation" className="font-medium" showLoader />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    <TranslatedText text="Common Actions" context="section title" />
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Save Changes" context="button" className="font-medium" showLoader />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Create New Contact" context="button" className="font-medium" showLoader />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <TranslatedText text="Generate Report" context="button" className="font-medium" showLoader />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Language Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Current Language Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Selected Language</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl">{currentLanguage.flag}</span>
                    <div>
                      <div className="font-semibold">{currentLanguage.nativeName}</div>
                      <div className="text-sm text-gray-500">{currentLanguage.name}</div>
                    </div>
                    <Badge variant="secondary">{currentLanguage.region}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Change Language</Label>
                  <div className="mt-2">
                    <LanguageSelector variant="compact" showLabel={false} />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Languages className="h-4 w-4" />
                <span>{supportedLanguages.length} languages supported</span>
                {currentLanguage.rtl && (
                  <Badge variant="outline" className="ml-2">RTL</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Country-Based Language Detection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <TranslatedText text="Country-Based Language Detection" context="section title" />
              </CardTitle>
              <CardDescription>
                <TranslatedText 
                  text="Automatic language selection based on your location and preferences" 
                  context="feature description" 
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-300">
                      <TranslatedText text="Detected Country" context="label" />
                    </span>
                  </div>
                  <div className="text-sm">
                    {detectionStatus === 'detecting' && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <TranslatedText text="Detecting location..." context="status" />
                      </div>
                    )}
                    {detectionStatus === 'success' && (
                      <div className="text-blue-700 dark:text-blue-300 font-medium">
                        {detectedCountry}
                      </div>
                    )}
                    {detectionStatus === 'error' && (
                      <div className="text-red-600 dark:text-red-400">
                        <TranslatedText text="Detection failed" context="error" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-900 dark:text-green-300">
                      <TranslatedText text="Suggested Language" context="label" />
                    </span>
                  </div>
                  <div className="text-sm">
                    {detectionStatus === 'detecting' && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <TranslatedText text="Analyzing..." context="status" />
                      </div>
                    )}
                    {detectionStatus !== 'detecting' && (
                      <div className="text-green-700 dark:text-green-300 font-medium">
                        {countryLanguage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-purple-900 dark:text-purple-300">
                      <TranslatedText text="Current Selection" context="label" />
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="text-purple-700 dark:text-purple-300 font-medium">
                      {currentLanguage.flag} {currentLanguage.nativeName}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      <TranslatedText text="Saved to your profile" context="status" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong><TranslatedText text="How it works:" context="explanation title" /></strong>{' '}
                  <TranslatedText 
                    text="The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits." 
                    context="explanation" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Translation Test */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Text Translation</CardTitle>
              <CardDescription>
                Test single text translation with context awareness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-text">Text to Translate</Label>
                <Textarea
                  id="test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="min-h-[100px] mt-2"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleTranslate} disabled={isLoading || !testText.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Translate to {currentLanguage.nativeName}
                </Button>
                <Button variant="outline" onClick={handleDetectLanguage} disabled={isLoading || !testText.trim()}>
                  <Languages className="h-4 w-4 mr-2" />
                  Detect Language
                </Button>
              </div>

              {translatedText && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <Check className="h-4 w-4" />
                    <span className="font-semibold">Translation Result</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">{translatedText}</p>
                </div>
              )}

              {detectedLanguage && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Languages className="h-4 w-4" />
                    <span className="font-semibold">Language Detection</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100">
                    Detected Language: <strong>{detectedLanguage.language}</strong> 
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      (Confidence: {Math.round(detectedLanguage.confidence * 100)}%)
                    </span>
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="text-red-700 dark:text-red-300">
                    Error: {error}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Translation Test */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bulk Translation</CardTitle>
              <CardDescription>
                Test bulk translation of multiple UI elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Navigation Items to Translate</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bulkTexts.map((text, index) => (
                    <Badge key={index} variant="outline">{text}</Badge>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleBulkTranslate} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Bulk Translate to {currentLanguage.nativeName}
              </Button>

              {bulkTranslations.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-3">
                    <Check className="h-4 w-4" />
                    <span className="font-semibold">Bulk Translation Results</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bulkTexts.map((original, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-gray-600 dark:text-gray-400">{original}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold">{bulkTranslations[index] || original}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample UI Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Sample UI Elements</CardTitle>
              <CardDescription>
                These elements demonstrate how the interface would look in different languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(sampleUIElements).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}