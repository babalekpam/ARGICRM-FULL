import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Target,
  Clock,
  DollarSign
} from "lucide-react";
import Logo from "@/components/logo";
import SiteNavigation from "@/components/site-navigation";

const benefits = [
  {
    title: "Centralized Customer Data",
    description: "All customer information in one place for better insights",
    icon: Users
  },
  {
    title: "Improved Sales Performance",
    description: "Track leads, opportunities, and close more deals",
    icon: TrendingUp
  },
  {
    title: "Better Customer Service",
    description: "Faster response times and personalized support",
    icon: MessageSquare
  },
  {
    title: "Data-Driven Decisions",
    description: "Analytics and reporting for informed business choices",
    icon: BarChart3
  }
];

const features = [
  "Contact & Account Management",
  "Lead & Opportunity Tracking",
  "Sales Pipeline Management",
  "Customer Service & Support",
  "Marketing Automation",
  "Analytics & Reporting",
  "Task & Activity Management",
  "Email Integration",
  "Mobile Access",
  "Customization & Integration"
];

export default function WhatIsCRMPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SiteNavigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            What is CRM?
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Customer Relationship Management (CRM) is a technology that helps businesses manage interactions with customers and prospects
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Get Started with CRM
          </Button>
        </div>
      </div>

      {/* Definition Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              CRM Explained Simply
            </h2>
            <div className="text-lg text-gray-600 space-y-6 max-w-4xl mx-auto text-left">
              <p>
                CRM stands for Customer Relationship Management, and it's a tool (software) that helps businesses organize and improve their interactions with customers. Think of it like a digital helper that keeps track of everything related to customers, from first contact to long-term relationships.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">What Does CRM Do?</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Stores Information:</h4>
                    <p>It keeps all customer data in one place like their contact details, purchase history, emails, calls, or social media interactions.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Manages Relationships:</h4>
                    <p>It reminds teams when to follow up with a customer, helps track where a customer is in the buying process (e.g., "just started talking" vs. "ready to buy"), and ensures nobody falls through the cracks.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Automates Tasks:</h4>
                    <p>Sends automatic emails, schedules reminders, or updates records without manual effort, so staff can focus on solving problems or closing deals.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Gives Insights:</h4>
                    <p>Uses data to spot patterns, like which customers are likely to buy again or which tactics work best for sales. This helps businesses make smarter decisions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Use a CRM System?
            </h2>
            <p className="text-lg text-gray-600">
              CRM systems provide numerous benefits for businesses of all sizes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={benefit.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Key CRM Features
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Modern CRM systems include a comprehensive set of features designed to streamline 
                your customer management processes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-orange-600 mb-4" />
                  <CardTitle>Increase Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Companies using CRM see an average sales increase of 29% and revenue growth of up to 41%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-green-600 mb-4" />
                  <CardTitle>Save Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Automate repetitive tasks and reduce administrative work by up to 50%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-blue-600 mb-4" />
                  <CardTitle>ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    CRM delivers an average ROI of $8.71 for every dollar spent
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Types of CRM */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Types of CRM Systems
            </h2>
            <p className="text-lg text-gray-600">
              Different CRM types serve different business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-600">Operational CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Focuses on automating customer-facing processes like sales, marketing, and service.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Sales Force Automation</li>
                  <li>• Marketing Automation</li>
                  <li>• Service Automation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-purple-600">Analytical CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Analyzes customer data to gain insights and improve business decisions.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Data Mining</li>
                  <li>• Customer Segmentation</li>
                  <li>• Predictive Analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-600">Collaborative CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Facilitates communication between different departments and external partners.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Channel Management</li>
                  <li>• Partner Portals</li>
                  <li>• Communication Tools</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Large spacer between content and CTA */}
      <div className="py-32"></div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your CRM Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Discover how ARGILETTE CRM can transform your customer relationships
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/pricing">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link to="/products">
                Explore Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}