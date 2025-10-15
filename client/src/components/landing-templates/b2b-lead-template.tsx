import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building, Users, TrendingUp, Shield, ArrowRight, Star } from "lucide-react";
import { handlePhoneInput } from "@/lib/phone-validation";

interface B2BLeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  employeeCount: string;
  challenges: string;
}

export default function B2BLeadTemplate() {
  const [formData, setFormData] = useState<B2BLeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    employeeCount: '',
    challenges: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/templates/b2b-lead/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          jobTitle: '',
          phone: '',
          employeeCount: '',
          challenges: ''
        });
      }, 4000);
    } catch (error) {
      console.error('Error submitting B2B lead:', error);
      setIsSubmitted(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enterprise Demo Scheduled!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Our enterprise team will contact you within 2 hours to schedule your personalized demo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Enterprise Solution
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Scale Your B2B Sales with 
                <span className="text-blue-600 dark:text-blue-400"> Enterprise CRM</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Join Fortune 500 companies using ARGILETTE to manage complex B2B sales cycles, 
                automate lead qualification, and close deals 60% faster.
              </p>
            </div>

            {/* Enterprise Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Enterprise-grade security & compliance</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Multi-department collaboration tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Advanced sales forecasting & analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited users & custom integrations</span>
              </div>
            </div>

            {/* Client Logos */}
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Trusted by industry leaders:</p>
              <div className="flex items-center space-x-8">
                <div className="text-xl font-bold text-gray-400">TechCorp</div>
                <div className="text-xl font-bold text-gray-400">GlobalSoft</div>
                <div className="text-xl font-bold text-gray-400">InnovatePlus</div>
              </div>
            </div>

            {/* Testimonial */}
            <Card className="bg-white/50 dark:bg-gray-800/50 border">
              <CardContent className="p-6">
                <div className="flex items-center mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                  "ARGILETTE helped us increase our enterprise deal closure rate by 60% 
                  and reduced our sales cycle from 9 months to 5 months."
                </p>
                <div className="text-sm">
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-gray-500">VP of Sales, TechCorp</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enterprise Lead Form */}
          <div className="lg:pl-8">
            <Card className="shadow-2xl border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardTitle className="text-2xl text-center">
                  Get Enterprise Demo
                </CardTitle>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  See how ARGILETTE scales with your business needs
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="lastName"
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <Input
                    name="email"
                    type="email"
                    placeholder="Corporate Email *"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="company"
                      placeholder="Company Name *"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="jobTitle"
                      placeholder="Job Title *"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number (10 digits) *"
                    value={formData.phone}
                    onChange={(e) => handlePhoneInput(e.target.value, (value) => setFormData(prev => ({ ...prev, phone: value })))}
                    maxLength={10}
                    required
                  />
                  
                  <select
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Company Size *</option>
                    <option value="50-200">50-200 employees</option>
                    <option value="200-1000">200-1,000 employees</option>
                    <option value="1000-5000">1,000-5,000 employees</option>
                    <option value="5000+">5,000+ employees</option>
                  </select>
                  
                  <select
                    name="challenges"
                    value={formData.challenges}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Primary Challenge *</option>
                    <option value="lead-management">Lead Management</option>
                    <option value="sales-forecasting">Sales Forecasting</option>
                    <option value="team-collaboration">Team Collaboration</option>
                    <option value="reporting-analytics">Reporting & Analytics</option>
                    <option value="integration-challenges">System Integration</option>
                  </select>
                  
                  <Button type="submit" className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Schedule Enterprise Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Personalized demo includes ROI analysis and custom implementation plan.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enterprise Features Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built for large organizations with complex sales processes and stringent security requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Security & Compliance
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                SOC 2, GDPR, HIPAA compliant with advanced encryption and audit trails.
              </p>
            </div>
            
            <div className="text-center">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Custom Integrations
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with Salesforce, HubSpot, SAP, and 500+ business applications.
              </p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered forecasting, territory management, and performance analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}