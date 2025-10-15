import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Shield, Scale, Globe } from "lucide-react";
import Layout from "@/components/layout";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = "Terms of Service - NODE CRM";
  }, []);

  const handleDownloadPDF = () => {
    // This would generate a PDF version in a real implementation
    window.open('/terms-of-service.html', '_blank');
  };

  const handleViewFullDocument = () => {
    window.open('/terms-of-service.html', '_blank');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Scale className="mr-3 h-8 w-8 text-purple-600" />
              Terms of Service
            </h1>
            <p className="text-gray-600 mt-1">Legal terms and conditions for NODE CRM platform usage</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleViewFullDocument} className="bg-purple-600 hover:bg-purple-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Document Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Effective Date:</span>
                  <Badge variant="secondary">January 13, 2025</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Updated:</span>
                  <Badge variant="secondary">January 13, 2025</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Document Version:</span>
                  <Badge variant="secondary">1.0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Applies To:</span>
                  <Badge className="bg-purple-600">All NODE CRM Users</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-blue-900">Service Description</h3>
                    <p className="text-gray-600">Comprehensive AI-powered CRM with emotional intelligence, enterprise-grade security, and white-label capabilities.</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-green-900">Data Ownership</h3>
                    <p className="text-gray-600">You retain full ownership of your data. We provide enterprise-grade protection with GDPR and SOC 2 compliance.</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-purple-900">Service Level Agreement</h3>
                    <p className="text-gray-600">99.9% uptime guarantee for Enterprise/Ultimate plans with dedicated support and service credits for SLA breaches.</p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-orange-900">Pricing & Billing</h3>
                    <p className="text-gray-600">Transparent pricing from $15.99-$79.99/user/month with 15-day free trial and 17% annual discount.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance & Legal Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Compliance Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">GDPR Compliant</span>
                  <Badge className="bg-green-600">✓ Certified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SOC 2 Type II</span>
                  <Badge className="bg-green-600">✓ Certified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CCPA Compliant</span>
                  <Badge className="bg-green-600">✓ Certified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ISO 27001</span>
                  <Badge className="bg-blue-600">In Progress</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Global Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  NODE CRM services are available worldwide with data residency options for compliance requirements.
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">North America</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Europe</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Asia Pacific</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Africa</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Legal Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>Legal Inquiries:</strong><br />
                  <a href="mailto:legal@argilette.org" className="text-blue-600 hover:underline">
                    legal@argilette.org
                  </a>
                </div>
                <div className="text-sm">
                  <strong>Privacy Officer:</strong><br />
                  <a href="mailto:privacy@argilette.org" className="text-blue-600 hover:underline">
                    privacy@argilette.org
                  </a>
                </div>
                <div className="text-sm">
                  <strong>Enterprise Agreements:</strong><br />
                  <a href="mailto:enterprise@argilette.org" className="text-blue-600 hover:underline">
                    enterprise@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-start space-x-3">
              <Scale className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Important Legal Notice</h3>
                <p className="text-yellow-800 text-sm mt-1">
                  By using NODE CRM, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                  Enterprise customers may have additional terms in their service agreements. For questions about these terms, 
                  please contact our legal team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}