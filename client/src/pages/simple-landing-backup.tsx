import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LandingLayout from "@/components/landing-layout";

export default function SimpleLanding() {
  return (
    <LandingLayout>
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Business with 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> AI-Powered CRM</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              NODE CRM combines emotional intelligence with advanced CRM capabilities to help you build stronger customer relationships and drive revenue growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/request-demo">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Emotional Intelligence</CardTitle>
                  <CardDescription>
                    Understand customer emotions and build stronger relationships
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Analytics</CardTitle>
                  <CardDescription>
                    Make data-driven decisions with powerful insights
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Automation</CardTitle>
                  <CardDescription>
                    Streamline workflows and boost productivity
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </LandingLayout>
  );
}