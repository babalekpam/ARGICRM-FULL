import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Save, Download, Settings, Palette, Type, Image as ImageIcon, Link as LinkIcon, Brain } from "lucide-react";
import Layout from "@/components/layout";
import { useLocation } from "wouter";
import SmartContentEngine from "@/components/smart-content-engine";

interface TemplateData {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  formFields: string[];
  features: string[];
  testimonial?: {
    text: string;
    author: string;
    company: string;
  };
}

const defaultTemplateData: TemplateData = {
  id: 'custom',
  name: 'Custom Landing Page',
  headline: 'Transform Your Business Today',
  subheadline: 'Join thousands of successful entrepreneurs who have revolutionized their workflow with our proven system.',
  ctaText: 'Get Started Free',
  ctaUrl: '#signup',
  backgroundColor: '#1e40af',
  textColor: '#ffffff',
  accentColor: '#f97316',
  formFields: ['name', 'email', 'company'],
  features: [
    'Increase productivity by 300%',
    'Save 20+ hours per week',
    'Boost revenue by 40%'
  ],
  testimonial: {
    text: "This solution completely transformed our business operations. We've seen incredible results in just 30 days.",
    author: "Sarah Johnson",
    company: "TechCorp Inc."
  }
};

export default function LandingPageEditor() {
  const [, setLocation] = useLocation();
  const [templateData, setTemplateData] = useState<TemplateData>(defaultTemplateData);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateTemplateData = (field: keyof TemplateData, value: any) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...templateData.features];
    newFeatures[index] = value;
    updateTemplateData('features', newFeatures);
  };

  const addFeature = () => {
    updateTemplateData('features', [...templateData.features, 'New feature']);
  };

  const removeFeature = (index: number) => {
    const newFeatures = templateData.features.filter((_, i) => i !== index);
    updateTemplateData('features', newFeatures);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Landing page saved successfully!');
  };

  const handlePublish = () => {
    alert(`Landing page published!\n\nYour page is now live at:\nhttps://your-domain.com/landing/${templateData.id}\n\nYou can share this URL with your audience.`);
  };

  const handleApplyRecommendation = (rec: any) => {
    switch (rec.type) {
      case 'headline':
        updateTemplateData('headline', rec.suggestion);
        break;
      case 'subheadline':
        updateTemplateData('subheadline', rec.suggestion);
        break;
      case 'cta':
        updateTemplateData('ctaText', rec.suggestion);
        break;
      case 'color':
        if (rec.suggestion.includes('#1e40af')) {
          updateTemplateData('backgroundColor', '#1e40af');
          updateTemplateData('accentColor', '#f97316');
        } else if (rec.suggestion.includes('#7c3aed')) {
          updateTemplateData('backgroundColor', '#7c3aed');
          updateTemplateData('accentColor', '#10b981');
        }
        break;
      case 'feature':
        if (rec.suggestion.includes('testimonials') || rec.suggestion.includes('security')) {
          // Add to features list
          const newFeatures = [...templateData.features, rec.suggestion];
          updateTemplateData('features', newFeatures);
        }
        break;
    }
    alert(`Applied: ${rec.suggestion}`);
  };

  const renderPreview = () => (
    <div 
      className="min-h-screen p-8"
      style={{ backgroundColor: templateData.backgroundColor, color: templateData.textColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">{templateData.headline}</h1>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">{templateData.subheadline}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Key Benefits</h2>
            <ul className="space-y-4 mb-8">
              {templateData.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-3 flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: templateData.accentColor, color: '#fff' }}
                  >
                    ✓
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            
            {templateData.testimonial && (
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <p className="italic mb-4">"{templateData.testimonial.text}"</p>
                <div className="font-semibold">
                  - {templateData.testimonial.author}, {templateData.testimonial.company}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white text-gray-900 p-8 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Get Started Today</h3>
            <form className="space-y-4">
              {templateData.formFields.includes('name') && (
                <Input placeholder="Your Full Name" className="w-full" />
              )}
              {templateData.formFields.includes('email') && (
                <Input placeholder="Business Email" type="email" className="w-full" />
              )}
              {templateData.formFields.includes('company') && (
                <Input placeholder="Company Name" className="w-full" />
              )}
              {templateData.formFields.includes('phone') && (
                <Input placeholder="Phone Number" type="tel" className="w-full" />
              )}
              <Button 
                className="w-full py-3 text-lg font-semibold"
                style={{ backgroundColor: templateData.accentColor }}
              >
                {templateData.ctaText}
              </Button>
            </form>
            <p className="text-sm text-gray-600 text-center mt-4">
              No spam. Your information is 100% secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setLocation('/landing-pages')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Landing Page Editor</h1>
              <p className="text-gray-600">Customize your landing page content and design</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="content">
                      <Type className="h-4 w-4 mr-2" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="design">
                      <Palette className="h-4 w-4 mr-2" />
                      Design
                    </TabsTrigger>
                    <TabsTrigger value="form">
                      <Settings className="h-4 w-4 mr-2" />
                      Form
                    </TabsTrigger>
                    <TabsTrigger value="ai">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Assistant
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      SEO
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label htmlFor="headline">Main Headline</Label>
                      <Input 
                        id="headline"
                        value={templateData.headline}
                        onChange={(e) => updateTemplateData('headline', e.target.value)}
                        placeholder="Enter your main headline"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subheadline">Sub-headline</Label>
                      <Textarea 
                        id="subheadline"
                        value={templateData.subheadline}
                        onChange={(e) => updateTemplateData('subheadline', e.target.value)}
                        placeholder="Supporting text for your headline"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Key Features/Benefits</Label>
                      {templateData.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 mt-2">
                          <Input 
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder="Feature description"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        onClick={addFeature}
                        className="mt-2"
                      >
                        Add Feature
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="design" className="space-y-4">
                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="backgroundColor"
                          type="color"
                          value={templateData.backgroundColor}
                          onChange={(e) => updateTemplateData('backgroundColor', e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input 
                          value={templateData.backgroundColor}
                          onChange={(e) => updateTemplateData('backgroundColor', e.target.value)}
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="textColor"
                          type="color"
                          value={templateData.textColor}
                          onChange={(e) => updateTemplateData('textColor', e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input 
                          value={templateData.textColor}
                          onChange={(e) => updateTemplateData('textColor', e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="accentColor">Accent Color (Buttons)</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="accentColor"
                          type="color"
                          value={templateData.accentColor}
                          onChange={(e) => updateTemplateData('accentColor', e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input 
                          value={templateData.accentColor}
                          onChange={(e) => updateTemplateData('accentColor', e.target.value)}
                          placeholder="#f97316"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="form" className="space-y-4">
                    <div>
                      <Label htmlFor="ctaText">Call-to-Action Button Text</Label>
                      <Input 
                        id="ctaText"
                        value={templateData.ctaText}
                        onChange={(e) => updateTemplateData('ctaText', e.target.value)}
                        placeholder="Get Started Free"
                      />
                    </div>
                    
                    <div>
                      <Label>Form Fields</Label>
                      <div className="space-y-2 mt-2">
                        {['name', 'email', 'company', 'phone'].map(field => (
                          <label key={field} className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              checked={templateData.formFields.includes(field)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateTemplateData('formFields', [...templateData.formFields, field]);
                                } else {
                                  updateTemplateData('formFields', templateData.formFields.filter(f => f !== field));
                                }
                              }}
                            />
                            <span className="capitalize">{field}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai" className="space-y-4">
                    <SmartContentEngine onApplyRecommendation={handleApplyRecommendation} />
                  </TabsContent>
                  
                  <TabsContent value="seo" className="space-y-4">
                    <div>
                      <Label htmlFor="pageTitle">Page Title</Label>
                      <Input 
                        id="pageTitle"
                        value={templateData.name}
                        onChange={(e) => updateTemplateData('name', e.target.value)}
                        placeholder="Page title for SEO"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ctaUrl">Action URL</Label>
                      <Input 
                        id="ctaUrl"
                        value={templateData.ctaUrl}
                        onChange={(e) => updateTemplateData('ctaUrl', e.target.value)}
                        placeholder="Where should the button link to?"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <div className="transform scale-25 origin-top-left" style={{ width: '400%', height: '400%' }}>
                    {renderPreview()}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Page URL</Label>
                  <div className="text-sm text-gray-600 mt-1">
                    https://your-domain.com/landing/{templateData.id}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={handlePublish} className="w-full bg-green-600 hover:bg-green-700">
                    Publish Page
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export HTML
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Full Page Preview</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh] border rounded">
              {renderPreview()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}