import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Star, Users, Calendar, Gift, Download, Play, CheckCircle, Mail, Phone, Edit } from "lucide-react";
import Layout from "@/components/layout";
import { useLocation } from "wouter";

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'lead-gen' | 'product' | 'event' | 'download';
  preview: React.ReactNode;
}

const templates: Template[] = [
  {
    id: 'lead-generation',
    name: 'Lead Generation Template',
    description: 'Perfect for capturing leads with contact forms and compelling headlines.',
    category: 'lead-gen',
    preview: (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Transform Your Business Today</h1>
            <p className="text-xl opacity-90 mb-8">Join thousands of successful entrepreneurs who have revolutionized their workflow</p>
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-1" />
                <span>210 Users</span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get Your Free Strategy Session</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  Personalized business analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  Custom growth strategy
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  Implementation roadmap
                </li>
              </ul>
            </div>
            
            <div className="bg-white text-gray-900 p-8 rounded-lg shadow-xl">
              <h3 className="text-2xl font-bold mb-6 text-center">Start Your Transformation</h3>
              <form className="space-y-4">
                <Input placeholder="Your Full Name" className="w-full" />
                <Input placeholder="Business Email" type="email" className="w-full" />
                <Input placeholder="Phone Number" type="tel" className="w-full" />
                <Input placeholder="Company Name" className="w-full" />
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold">
                  Get My Free Strategy Session
                </Button>
              </form>
              <p className="text-sm text-gray-600 text-center mt-4">
                No spam. Your information is 100% secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'product-launch',
    name: 'Product Launch Template',
    description: 'Announce new products with countdown timers and pre-order buttons.',
    category: 'product',
    preview: (
      <div className="bg-gray-900 text-white p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-red-600 text-white px-4 py-2 text-sm font-semibold mb-4">
              EXCLUSIVE LAUNCH
            </Badge>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Revolutionary CRM 2.0
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The most powerful customer relationship management platform ever created. 
              Built for the future of business.
            </p>
            
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg inline-block mb-8">
              <div className="text-center">
                <p className="text-sm font-semibold mb-2">LIMITED TIME OFFER</p>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">07</div>
                    <div className="text-xs">DAYS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">14</div>
                    <div className="text-xs">HOURS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">32</div>
                    <div className="text-xs">MINS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">18</div>
                    <div className="text-xs">SECS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Automation</h3>
              <p className="text-gray-400">AI-powered workflows that save 20+ hours per week</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">Real-time insights that drive 40% more conversions</p>
            </div>
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
            <p className="text-gray-400">Bank-level encryption and compliance standards</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white text-gray-900 p-8 rounded-lg max-w-md mx-auto">
              <h3 className="text-2xl font-bold mb-4">Early Bird Pricing</h3>
              <div className="text-5xl font-bold text-purple-600 mb-2">$99</div>
              <div className="text-gray-500 line-through mb-4">Regular Price: $299</div>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 text-lg font-semibold mb-4">
                Pre-Order Now - Save 67%
              </Button>
              <p className="text-sm text-gray-600">30-day money-back guarantee</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'event-registration',
    name: 'Event Registration Template',
    description: 'Drive event signups with compelling event details and easy registration.',
    category: 'event',
    preview: (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-green-600 text-white px-4 py-2 text-sm font-semibold mb-4">
              VIRTUAL SUMMIT 2025
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Future of Business Summit
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Join industry leaders and innovators for 3 days of cutting-edge insights, 
              networking, and practical strategies to transform your business.
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow-lg inline-block mb-8">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold">June 15-17, 2025</div>
                  <div className="text-sm text-gray-600">3 Days</div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold">50+ Speakers</div>
                  <div className="text-sm text-gray-600">Industry Experts</div>
                </div>
                <div className="text-center">
                  <Play className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold">30+ Sessions</div>
                  <div className="text-sm text-gray-600">Interactive</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What You'll Learn</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">AI & Automation Strategies</h4>
                    <p className="text-gray-600">Implement cutting-edge AI tools to streamline operations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Digital Transformation</h4>
                    <p className="text-gray-600">Navigate the digital landscape with confidence</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Leadership Excellence</h4>
                    <p className="text-gray-600">Build and lead high-performing teams</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg">
                <p className="text-yellow-800 font-semibold">
                  🎁 Early Bird Special: Register by June 1st and save $200!
                </p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-xl">
              <h3 className="text-2xl font-bold text-center mb-6">Secure Your Spot</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                </div>
                <Input placeholder="Business Email" type="email" />
                <Input placeholder="Company" />
                <Input placeholder="Job Title" />
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
                  Register Now - $497
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Includes:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ All 3 days of summit access</li>
                  <li>✓ Recorded sessions for 1 year</li>
                  <li>✓ Exclusive networking opportunities</li>
                  <li>✓ Digital resource library</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function LandingPageTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleUseTemplate = (template: Template) => {
    setLocation('/landing-page-editor');
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landing Page Templates</h1>
            <p className="text-gray-600">Choose from our professionally designed templates to get started quickly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {template.category.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleUseTemplate(template)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Use Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handlePreview(template)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Start from Scratch</h2>
            <p className="mb-6">
              Create a completely custom landing page with our drag-and-drop editor. 
              No coding required.
            </p>
            <Button 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setLocation('/landing-page-editor')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Create Custom Page
            </Button>
          </div>
          
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Professional Design Service</h2>
            <p className="mb-6">
              Our design team can create a completely custom landing page template 
              tailored to your brand and conversion goals.
            </p>
            <Button 
              className="bg-white text-green-600 hover:bg-gray-100"
              onClick={() => setLocation('/request-demo')}
            >
              <Users className="h-4 w-4 mr-2" />
              Request Custom Design
            </Button>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {selectedTemplate?.name} - Preview
                </DialogTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
                  >
                    Use This Template
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh] border rounded">
              {selectedTemplate?.preview}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}