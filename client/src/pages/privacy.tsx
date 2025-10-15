import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Database, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

export default function PrivacyPage() {
  return (
    <>
      <SEO 
        title="Privacy Policy - NODE CRM Data Protection & Security"
        description="Learn how NODE CRM protects your data with enterprise-grade security, GDPR compliance, and transparent privacy practices for your business information."
        canonicalUrl="https://argilette.org/privacy"
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
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">Privacy Policy</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Data, <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Privacy
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              NODE CRM is committed to protecting your privacy and ensuring the security of your business data with enterprise-grade protection.
            </p>
            <p className="text-sm text-gray-500">Last updated: September 2025</p>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Data Protection</h3>
                <p className="text-sm text-gray-600">Enterprise-grade security for all your business data</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Encryption</h3>
                <p className="text-sm text-gray-600">End-to-end encryption for data in transit and at rest</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Eye className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Transparency</h3>
                <p className="text-sm text-gray-600">Clear policies on how we collect and use your data</p>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center">
              <CardContent className="p-6">
                <Database className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Data Control</h3>
                <p className="text-sm text-gray-600">You own and control your business data completely</p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Policy Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
                  <p className="text-gray-600">We collect business data you provide including contacts, leads, deals, and customer information to deliver our CRM services.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                  <p className="text-gray-600">Basic account details like email, name, and company information to manage your NODE CRM subscription and provide support.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Usage Analytics</h4>
                  <p className="text-gray-600">Anonymous usage patterns to improve our platform performance and user experience.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>How We Protect Your Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                  <p className="text-gray-600">Military-grade encryption, secure data centers, and regular security audits protect your business information.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Access Controls</h4>
                  <p className="text-gray-600">Role-based permissions ensure only authorized team members can access specific data within your organization.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Isolation</h4>
                  <p className="text-gray-600">Multi-tenant architecture ensures complete separation between different customer accounts.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Your Rights & Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Ownership</h4>
                  <p className="text-gray-600">You retain full ownership of all business data stored in NODE CRM. We are simply the processor.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Data Export</h4>
                  <p className="text-gray-600">Export your data at any time in standard formats. No vendor lock-in.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Deletion</h4>
                  <p className="text-gray-600">Request complete account and data deletion at any time through our settings or support.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle>Compliance & Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">GDPR Compliant</h4>
                    <p className="text-gray-600">Full compliance with European data protection regulations.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">SOC 2 Type II</h4>
                    <p className="text-gray-600">Industry-standard security and availability controls.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ISO 27001</h4>
                    <p className="text-gray-600">International information security management standards.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Regular Audits</h4>
                    <p className="text-gray-600">Third-party security assessments and penetration testing.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="text-center mt-16">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
                <p className="mb-6 opacity-90">
                  Our privacy team is here to help with any questions about how we protect your data.
                </p>
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Contact Privacy Team
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