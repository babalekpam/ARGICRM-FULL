import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/logo";
import SiteNavigation from "@/components/site-navigation";

const solutions = [
  {
    title: "Sales Acceleration",
    description: "Streamline your sales process from lead to close",
    features: ["Lead Scoring", "Pipeline Management", "Sales Forecasting", "Territory Management"],
    icon: Target,
    color: "blue"
  },
  {
    title: "Customer Success",
    description: "Ensure customer satisfaction and reduce churn",
    features: ["Health Scoring", "Renewal Management", "Onboarding Workflows", "Success Metrics"],
    icon: Users,
    color: "green"
  },
  {
    title: "Marketing Automation",
    description: "Create personalized campaigns that convert",
    features: ["Email Campaigns", "Lead Nurturing", "Behavioral Triggers", "ROI Tracking"],
    icon: MessageSquare,
    color: "purple"
  },
  {
    title: "Analytics & Insights",
    description: "Make data-driven decisions with powerful analytics",
    features: ["Custom Dashboards", "Predictive Analytics", "Revenue Insights", "Performance Metrics"],
    icon: BarChart3,
    color: "orange"
  }
];

export default function SolutionsPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SiteNavigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">CRM Solutions</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Tailored solutions for every business challenge
          </p>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Solution
            </h2>
            <p className="text-lg text-gray-600">
              Explore our comprehensive CRM solutions designed for your specific business needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-${solution.color}-100 flex items-center justify-center mb-4`}>
                      <IconComponent className={`h-6 w-6 text-${solution.color}-600`} />
                    </div>
                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                    <CardDescription>{solution.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {solution.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        // Navigate to specific solution details or documentation
                        const solutionRoutes = {
                          'Sales Acceleration': '/products?focus=sales',
                          'Customer Success': '/products?focus=customer-success',
                          'Marketing Automation': '/products?focus=marketing',
                          'Analytics & Insights': '/products?focus=analytics'
                        };
                        const route = solutionRoutes[solution.title as keyof typeof solutionRoutes] || '/products';
                        window.location.href = route;
                      }}
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Large spacer between content and CTA */}
          <div className="py-32"></div>
          
          {/* Call to Action Section */}
          <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
            <p className="text-xl mb-8 opacity-90">
              Get started with ARGILETTE CRM today and see the difference our solutions can make
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = "/#signup"}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600"
                asChild
              >
                <Link href="/request-demo">
                  Request Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}