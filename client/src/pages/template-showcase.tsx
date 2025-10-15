import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Users, Building, Rocket, Calendar, MessageSquare, Star } from "lucide-react";

interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  message?: string;
  jobTitle?: string;
  employeeCount?: string;
  challenges?: string;
  website?: string;
  useCase?: string;
  industry?: string;
  budget?: string;
  timeframe?: string;
  preferredTime?: string;
}

export default function TemplateShowcase() {
  const [activeTab, setActiveTab] = useState("basic-lead");
  const [formData, setFormData] = useState<LeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    jobTitle: '',
    employeeCount: '',
    challenges: '',
    website: '',
    useCase: '',
    industry: '',
    budget: '',
    timeframe: '',
    preferredTime: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (templateType: string) => {
    setIsLoading(true);
    
    try {
      let endpoint = '';
      switch (templateType) {
        case 'basic-lead':
          endpoint = '/api/templates/lead-generation/submit';
          break;
        case 'b2b-enterprise':
          endpoint = '/api/templates/b2b-lead/submit';
          break;
        case 'saas-trial':
          endpoint = '/api/templates/saas-trial/submit';
          break;
        case 'consultation':
          endpoint = '/api/templates/consultation/submit';
          break;
        case 'product-launch':
          endpoint = '/api/templates/product-launch/preorder';
          break;
        case 'event-registration':
          endpoint = '/api/templates/event-registration/register';
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Lead submitted successfully:', result);
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            firstName: '', lastName: '', email: '', company: '', phone: '',
            message: '', jobTitle: '', employeeCount: '', challenges: '',
            website: '', useCase: '', industry: '', budget: '', timeframe: '', preferredTime: ''
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your information has been submitted and a new lead has been created in the CRM system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Lead Generation Templates
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose a template and capture leads directly into your CRM
          </p>
          <Badge variant="secondary" className="mt-2">6 Professional Templates Available</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic-lead" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              Basic Lead
            </TabsTrigger>
            <TabsTrigger value="b2b-enterprise" className="text-xs">
              <Building className="h-4 w-4 mr-1" />
              B2B Enterprise
            </TabsTrigger>
            <TabsTrigger value="saas-trial" className="text-xs">
              <Rocket className="h-4 w-4 mr-1" />
              SaaS Trial
            </TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs">
              <MessageSquare className="h-4 w-4 mr-1" />
              Consultation
            </TabsTrigger>
            <TabsTrigger value="product-launch" className="text-xs">
              <Star className="h-4 w-4 mr-1" />
              Product Launch
            </TabsTrigger>
            <TabsTrigger value="event-registration" className="text-xs">
              <Calendar className="h-4 w-4 mr-1" />
              Event
            </TabsTrigger>
          </TabsList>

          {/* Basic Lead Generation Template */}
          <TabsContent value="basic-lead">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Basic Lead Generation
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Capture basic contact information and inquiries
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('basic-lead'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  <Textarea
                    placeholder="Message or inquiry"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Submitting...' : 'Submit Lead'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* B2B Enterprise Template */}
          <TabsContent value="b2b-enterprise">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-6 w-6 mr-2" />
                  B2B Enterprise Lead
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Designed for enterprise B2B lead capture
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('b2b-enterprise'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Business Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Company Name"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Job Title"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  <Input
                    placeholder="Company Size (e.g., 50-100 employees)"
                    value={formData.employeeCount}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                  />
                  <Textarea
                    placeholder="Business challenges you're facing"
                    value={formData.challenges}
                    onChange={(e) => handleInputChange('challenges', e.target.value)}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Submitting...' : 'Submit Enterprise Lead'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SaaS Trial Template */}
          <TabsContent value="saas-trial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Rocket className="h-6 w-6 mr-2" />
                  SaaS Free Trial
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Convert visitors into trial users
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('saas-trial'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                    <Input
                      placeholder="Website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="What will you use our software for?"
                    value={formData.useCase}
                    onChange={(e) => handleInputChange('useCase', e.target.value)}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Starting Trial...' : 'Start Free Trial'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Template */}
          <TabsContent value="consultation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-6 w-6 mr-2" />
                  Book Consultation
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Schedule a consultation with our experts
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('consultation'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <Input
                    placeholder="Industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Budget Range"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    />
                    <Input
                      placeholder="Timeframe"
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="What challenges are you facing?"
                    value={formData.challenges}
                    onChange={(e) => handleInputChange('challenges', e.target.value)}
                  />
                  <Input
                    placeholder="Preferred consultation time"
                    value={formData.preferredTime}
                    onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Booking...' : 'Book Consultation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Launch Template */}
          <TabsContent value="product-launch">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-6 w-6 mr-2" />
                  Product Launch Pre-order
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Get early access to our new product
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('product-launch'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Company (Optional)"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Processing...' : 'Pre-order Now'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Registration Template */}
          <TabsContent value="event-registration">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-6 w-6 mr-2" />
                  Event Registration
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Register for our upcoming event
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('event-registration'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                    <Input
                      placeholder="Job Title"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Registering...' : 'Register for Event'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}