import { Link } from "wouter";
import SiteNavigation from "@/components/site-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Users,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const demoFeatures = [
  "Complete CRM walkthrough",
  "Emotional intelligence features",
  "Sales automation demo",
  "Custom integration examples",
  "Q&A with our experts",
  "Implementation planning"
];

const companySizes = [
  "1-10 employees",
  "11-50 employees", 
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees"
];

const industries = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Other"
];

export default function RequestDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SiteNavigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            See ARGILETTE CRM in Action
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Schedule a personalized demo and discover how emotional intelligence can transform your customer relationships
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>30-minute demo</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Personalized for your industry</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>No commitment required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Demo Request Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Request Your Demo</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll schedule a personalized demo for your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <Input placeholder="John" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <Input placeholder="Doe" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email *
                    </label>
                    <Input type="email" placeholder="john@company.com" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <Input placeholder="Your Company" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <Input placeholder="Sales Manager" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input placeholder="+1 (314) 472-3839" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Size
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current CRM Solution (if any)
                    </label>
                    <Input placeholder="Salesforce, HubSpot, etc." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What would you like to see in the demo?
                    </label>
                    <Textarea 
                      placeholder="Tell us about your specific needs or challenges..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    Schedule Demo
                    <Calendar className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Demo Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  What to Expect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Demo Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">30 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">Video call</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className="font-medium">Monday - Friday</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response time:</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-3">Prefer to talk now?</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">+1 (314) 472-3839</div>
                      <div className="text-sm text-blue-700">Sales team available 9 AM - 6 PM EST</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">support@argilette.org</div>
                      <div className="text-sm text-blue-700">We respond within 2 hours</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Or skip the demo and start your free trial today
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = "/#signup"}>
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}