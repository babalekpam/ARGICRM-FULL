import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout";
import TemplateRecommendationCarousel from "@/components/template-recommendation-carousel";
import LeadGenerationTemplate from "@/components/landing-templates/lead-generation-template";
import ProductLaunchTemplate from "@/components/landing-templates/product-launch-template";
import EventRegistrationTemplate from "@/components/landing-templates/event-registration-template";
import B2BLeadTemplate from "@/components/landing-templates/b2b-lead-template";
import SaaSTrialTemplate from "@/components/landing-templates/saas-trial-template";
import ConsultationTemplate from "@/components/landing-templates/consultation-template";
import { 
  Globe, 
  Plus, 
  Edit, 
  Eye, 
  Users,
  Package,
  Calendar,
  Brush,
  ArrowRight,
  ExternalLink,
  X,
  Building,
  Rocket,
  MessageSquare,
  CheckCircle
} from "lucide-react";

export default function LandingPages() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'builder'>('templates');

  const templates = [
    {
      id: 'lead-generation',
      title: 'Lead Generation Template',
      description: 'Perfect for capturing leads with contact forms and compelling headlines.',
      icon: Users,
      image: 'lead-gen',
      features: ['Contact Forms', 'Lead Capture', 'Compelling Headlines', 'Conversion Optimized'],
      conversionRate: '24%',
      status: 'Ready to Use'
    },
    {
      id: 'b2b-lead',
      title: 'B2B Enterprise Template',
      description: 'Designed for B2B companies targeting enterprise clients with complex sales cycles.',
      icon: Building,
      image: 'enterprise',
      features: ['Enterprise Focus', 'B2B Forms', 'Company Validation', 'Executive Appeal'],
      conversionRate: '18%',
      status: 'Ready to Use'
    },
    {
      id: 'saas-trial',
      title: 'SaaS Free Trial Template',
      description: 'Convert visitors into trial users with compelling trial signup forms.',
      icon: Rocket,
      image: 'trial',
      features: ['Free Trial Focus', 'Feature Highlights', 'No Credit Card', 'Quick Setup'],
      conversionRate: '32%',
      status: 'Ready to Use'
    },
    {
      id: 'consultation',
      title: 'Consultation Booking Template',
      description: 'Schedule consultations and strategy sessions with qualified prospects.',
      icon: MessageSquare,
      image: 'consult',
      features: ['Expert Profiles', 'Time Scheduling', 'Qualification Forms', 'Trust Building'],
      conversionRate: '28%',
      status: 'Ready to Use'
    },
    {
      id: 'product-launch',
      title: 'Product Launch Template',
      description: 'Announce new products with countdown timers and pre-order buttons.',
      icon: Package,
      image: 'product',
      features: ['Countdown Timers', 'Pre-order Buttons', 'Product Showcase', 'Launch Ready'],
      conversionRate: '35%',
      status: 'Ready to Use'
    },
    {
      id: 'event-registration',
      title: 'Event Registration Template',
      description: 'Drive event signups with compelling event details and easy registration.',
      icon: Calendar,
      image: 'event',
      features: ['Event Details', 'Easy Registration', 'Date/Time Display', 'RSVP Forms'],
      conversionRate: '22%',
      status: 'Ready to Use'
    }
  ];

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    window.open(`/template/${templateId}`, '_blank');
  };

  const handlePreview = (templateId: string) => {
    setPreviewTemplate(templateId);
  };

  const renderTemplate = (templateId: string) => {
    switch (templateId) {
      case 'lead-generation':
        return <LeadGenerationTemplate />;
      case 'product-launch':
        return <ProductLaunchTemplate />;
      case 'event-registration':
        return <EventRegistrationTemplate />;
      case 'b2b-lead':
        return <B2BLeadTemplate />;
      case 'saas-trial':
        return <SaaSTrialTemplate />;
      case 'consultation':
        return <ConsultationTemplate />;
      default:
        return <div>Template not found</div>;
    }
  };

  const handleCreateCustom = () => {
    console.log('Opening custom page editor');
  };

  const handleRequestDesign = () => {
    console.log('Requesting professional design service');
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Landing Pages & Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose from professional templates or create custom landing pages to capture leads and drive conversions.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'templates' | 'builder')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              <Rocket className="h-4 w-4 mr-2" />
              Ready-to-Use Templates
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Edit className="h-4 w-4 mr-2" />
              Page Builder
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* AI-Powered Recommendation Carousel */}
            <TemplateRecommendationCarousel 
              onUseTemplate={handleUseTemplate}
              onPreview={handlePreview}
              userProfile={{
                industry: 'SaaS',
                businessSize: 'SMB',
                goals: ['lead-generation', 'trial-signups'],
                previousTemplates: []
              }}
            />

            {/* Quick Start Information */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 text-white rounded-full p-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Ready to Use - No Demo Required</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All templates are instantly available for authenticated users. Click "Use Template" to access the working template immediately. Form submissions automatically create qualified leads in your CRM system.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            {template.status}
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                            {template.conversionRate} conversion
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Template Preview Image Placeholder */}
                      <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center border">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {template.image}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {template.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          onClick={() => handleUseTemplate(template.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Use Template Now
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => handlePreview(template.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center justify-between">
                                {template.title} Preview
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setPreviewTemplate(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {renderTemplate(template.id)}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Page Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            {/* AI Generator Option */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 text-white rounded-full p-1">
                  <Brush className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">AI Template Generator</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Let our AI create a custom landing page based on your business profile and goals.
                  </p>
                  <Button 
                    onClick={() => navigate('/ai-generator')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Brush className="h-4 w-4 mr-2" />
                    Generate Custom Page
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start from Scratch */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Edit className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Start from Scratch</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Create a completely custom landing page with our drag-and-drop editor. No coding required.
                  </p>
                  <Button 
                    onClick={handleCreateCustom}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Page
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Design Service */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Brush className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Professional Design Service</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Our design team can create a completely custom landing page template tailored to your brand and conversion goals.
                  </p>
                  <Button 
                    onClick={handleRequestDesign}
                    className="w-full"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Custom Design
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Template Preview */}
        {selectedTemplate && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Live Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                  {renderTemplate(selectedTemplate)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}