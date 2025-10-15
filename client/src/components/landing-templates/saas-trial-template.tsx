import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Clock, Rocket, Star, ArrowRight, Users } from "lucide-react";

interface SaaSTrialFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  website: string;
  useCase: string;
}

export default function SaaSTrialTemplate() {
  const [formData, setFormData] = useState<SaaSTrialFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    useCase: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/templates/saas-trial/submit', {
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
          website: '',
          useCase: ''
        });
      }, 5000);
    } catch (error) {
      console.error('Error submitting SaaS trial:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Rocket className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Your Free Trial!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check your email for login credentials and setup instructions.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Access Your Trial Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                Free 14-Day Trial
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Start Your Free Trial
                <span className="text-purple-600 dark:text-purple-400"> Today</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                No credit card required. Full access to all features. 
                Set up in under 5 minutes and see results in your first week.
              </p>
            </div>

            {/* Trial Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Instant setup - no installation required</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">14 days full access to all premium features</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Free onboarding support & training</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Cancel anytime - no strings attached</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.5K+</div>
                <div className="text-sm text-gray-500">Active Trials</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">87%</div>
                <div className="text-sm text-gray-500">Convert to Paid</div>
              </div>
              <div>
                <div className="flex items-center justify-center">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="text-sm text-gray-500">User Rating</div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">What's included in your trial:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div>✓ Unlimited contacts</div>
                <div>✓ Email marketing</div>
                <div>✓ Sales automation</div>
                <div>✓ Analytics dashboard</div>
                <div>✓ Team collaboration</div>
                <div>✓ Mobile app access</div>
              </div>
            </div>
          </div>

          {/* Right Column - Trial Signup Form */}
          <div className="lg:pl-8">
            <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <CardTitle className="text-2xl text-center">
                  Start Your Free Trial
                </CardTitle>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Full access. No credit card required.
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
                    placeholder="Work Email *"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    name="company"
                    placeholder="Company Name *"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    name="website"
                    placeholder="Company Website"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                  
                  <select
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Primary Use Case *</option>
                    <option value="lead-generation">Lead Generation</option>
                    <option value="sales-management">Sales Management</option>
                    <option value="customer-support">Customer Support</option>
                    <option value="marketing-automation">Marketing Automation</option>
                    <option value="team-collaboration">Team Collaboration</option>
                  </select>
                  
                  <Button type="submit" className="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Start Free Trial Now
                    <Rocket className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy. 
                    Trial automatically expires after 14 days.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our comprehensive platform gives you all the tools to manage customers, 
              automate sales processes, and grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Lightning Fast Setup
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import your data and start using the platform in under 5 minutes.
              </p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Team Collaboration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Work together seamlessly with shared contacts, tasks, and communications.
              </p>
            </div>
            
            <div className="text-center">
              <Rocket className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Scale as You Grow
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                From startup to enterprise, our platform grows with your business needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}