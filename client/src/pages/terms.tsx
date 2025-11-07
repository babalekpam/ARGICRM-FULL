import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, Shield, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function TermsPage() {
  return (
    <>
      <SEO 
        title="Terms of Service - NODE CRM Legal Terms & Conditions"
        description="Read NODE CRM's terms of service, usage policies, and legal agreements for our AI-powered business management platform."
        canonicalUrl="https://argilette.org/terms"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">NODE CRM</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">Terms of Service</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              These terms govern your use of NODE CRM services. Please read them carefully before using our platform.
            </p>
            <p className="text-sm text-gray-500">Last updated: September 2025</p>
          </div>

          {/* Quick Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Fair Usage</h3>
                <p className="text-sm text-gray-600">Clear guidelines for appropriate use of our platform</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Scale className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
                <p className="text-sm text-gray-600">What you can expect from our service and support</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Data Protection</h3>
                <p className="text-sm text-gray-600">How we handle and protect your business information</p>
              </CardContent>
            </Card>
          </div>

          {/* Terms Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>1. Service Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  By accessing NODE CRM, you agree to these terms of service. Our platform provides customer relationship management, 
                  e-commerce tools, and AI-powered business automation services to help you manage and grow your business.
                </p>
                <p className="text-gray-600">
                  These terms apply to all users, including free trial users, paid subscribers, and platform administrators.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>2. Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">You may use NODE CRM to:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Manage customer relationships and business data</li>
                    <li>Build and operate e-commerce stores</li>
                    <li>Send marketing communications to consenting contacts</li>
                    <li>Collaborate with team members on projects</li>
                    <li>Generate reports and analytics for business insights</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">You may not:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Send spam or unsolicited commercial messages</li>
                    <li>Store illegal or harmful content</li>
                    <li>Attempt to breach security or access other accounts</li>
                    <li>Use the service for fraudulent activities</li>
                    <li>Reverse engineer or copy our software</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>3. Payment & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Subscription fees are billed monthly or annually based on your chosen plan. All fees are non-refundable except 
                  as required by law or our refund policy.
                </p>
                <p className="text-gray-600">
                  Free trials are available for new customers. You will be charged when your trial expires unless you cancel before the trial end date.
                </p>
                <p className="text-gray-600">
                  We may change our pricing with 30 days advance notice to existing customers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>4. Data Ownership & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  You retain full ownership of all data you store in NODE CRM. We act as a data processor and will not access, 
                  use, or share your data except as necessary to provide our services.
                </p>
                <p className="text-gray-600">
                  Your data is protected by enterprise-grade security measures and is stored in compliance with international 
                  data protection regulations including GDPR.
                </p>
                <p className="text-gray-600">
                  You can export your data at any time and request account deletion through our settings or support team.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>5. Service Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  We strive to maintain 99.9% uptime for our services. Planned maintenance will be announced in advance when possible.
                </p>
                <p className="text-gray-600">
                  We are not liable for service interruptions caused by factors beyond our control, including internet connectivity issues, 
                  third-party service outages, or force majeure events.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>6. Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  You may cancel your account at any time through our settings. Upon cancellation, your access will continue until 
                  the end of your current billing period.
                </p>
                <p className="text-gray-600">
                  We may suspend or terminate accounts that violate these terms, with notice when possible. In case of termination 
                  for cause, no refunds will be provided.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>7. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  We may update these terms from time to time. Material changes will be communicated via email or in-app notifications 
                  at least 30 days before taking effect.
                </p>
                <p className="text-gray-600">
                  Continued use of NODE CRM after changes take effect constitutes acceptance of the updated terms.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="text-center mt-16">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
                <p className="mb-6 opacity-90">
                  Our legal team is available to clarify any questions about our terms of service.
                </p>
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Contact Legal Team
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}