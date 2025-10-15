import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, Package, ShoppingCart, DollarSign, Users, BarChart3, Zap, Clock, Rocket, Star, Mail, Bell, Shield, Globe, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ECommerceComingSoon() {
  const { toast } = useToast();
  const [isEarlyAccessOpen, setIsEarlyAccessOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [earlyAccessForm, setEarlyAccessForm] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    expectedUsers: '',
    phone: ''
  });
  const [notifyForm, setNotifyForm] = useState({
    email: '',
    name: ''
  });

  const earlyAccessMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ecommerce/early-access", {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error("Failed to submit early access request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enterprise Request Submitted",
        description: "Thank you for your interest. Our team will contact you within 24 hours with beta access details."
      });
      setIsEarlyAccessOpen(false);
      setEarlyAccessForm({
        name: '',
        email: '',
        company: '',
        useCase: '',
        expectedUsers: '',
        phone: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  const notifyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ecommerce/notify-launch", {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error("Failed to sign up for notifications");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successfully Subscribed",
        description: "You'll receive exclusive updates and early-bird pricing when we launch."
      });
      setIsNotifyOpen(false);
      setNotifyForm({
        email: '',
        name: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  const handleEarlyAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    earlyAccessMutation.mutate(earlyAccessForm);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notifyMutation.mutate(notifyForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-8 shadow-2xl border border-blue-100">
                <Store className="w-24 h-24 text-blue-600" />
              </div>
              <div className="absolute -top-4 -right-4">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                  <Rocket className="w-4 h-4 mr-2" />
                  Q2 2025 Launch
                </Badge>
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-8 leading-tight">
            Enterprise E-commerce Platform
          </h1>
          
          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-2xl font-light text-slate-700 mb-6 leading-relaxed">
              Transform your business with our next-generation e-commerce platform
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Launching Q2 2025 with enterprise-grade features, AI-powered automation, and seamless integrations designed for modern businesses
            </p>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center space-x-3 text-slate-600 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold">SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold">99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-600 bg-white/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <Globe className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold">Global CDN Infrastructure</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Dialog open={isEarlyAccessOpen} onOpenChange={setIsEarlyAccessOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="px-12 py-5 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-xl">
                  <Star className="w-6 h-6 mr-3" />
                  Request Enterprise Access
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-3xl font-bold text-slate-900 mb-2">Enterprise Early Access Program</DialogTitle>
                  <DialogDescription className="text-lg text-slate-600">
                    Join our exclusive beta program and get priority access with personalized onboarding, dedicated support, and custom integrations.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEarlyAccessSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-bold text-slate-800">Full Name *</Label>
                      <Input
                        id="name"
                        value={earlyAccessForm.name}
                        onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-bold text-slate-800">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={earlyAccessForm.email}
                        onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        placeholder="your.email@company.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-bold text-slate-800">Company Name *</Label>
                      <Input
                        id="company"
                        value={earlyAccessForm.company}
                        onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, company: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        placeholder="Your company name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-bold text-slate-800">Phone Number</Label>
                      <Input
                        id="phone"
                        value={earlyAccessForm.phone}
                        onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedUsers" className="text-sm font-bold text-slate-800">Expected Team Size *</Label>
                    <Input
                      id="expectedUsers"
                      value={earlyAccessForm.expectedUsers}
                      onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, expectedUsers: e.target.value }))}
                      className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="e.g., 10-50 users, 100+ enterprise users"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="useCase" className="text-sm font-bold text-slate-800">Business Use Case *</Label>
                    <Textarea
                      id="useCase"
                      value={earlyAccessForm.useCase}
                      onChange={(e) => setEarlyAccessForm(prev => ({ ...prev, useCase: e.target.value }))}
                      className="min-h-[120px] border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Describe how you plan to use our e-commerce platform for your business. Include expected transaction volume, integration needs, and growth plans..."
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl" 
                    disabled={earlyAccessMutation.isPending}
                  >
                    {earlyAccessMutation.isPending ? "Submitting Enterprise Request..." : "Submit Enterprise Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="px-12 py-5 text-xl font-bold border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl">
                  <Bell className="w-6 h-6 mr-3" />
                  Get Launch Updates
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-3xl font-bold text-slate-900 mb-2">Stay Informed</DialogTitle>
                  <DialogDescription className="text-lg text-slate-600">
                    Get notified the moment our platform launches with exclusive early-bird pricing and premium features.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNotifySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="notify-name" className="text-sm font-bold text-slate-800">Full Name *</Label>
                    <Input
                      id="notify-name"
                      value={notifyForm.name}
                      onChange={(e) => setNotifyForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notify-email" className="text-sm font-bold text-slate-800">Email Address *</Label>
                    <Input
                      id="notify-email"
                      type="email"
                      value={notifyForm.email}
                      onChange={(e) => setNotifyForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl" 
                    disabled={notifyMutation.isPending}
                  >
                    {notifyMutation.isPending ? "Subscribing..." : "Get Notified"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">AI-Powered Store Builder</CardTitle>
              <CardDescription className="text-slate-600">
                Intelligent drag-and-drop store creation with AI-driven design recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Visual store designer with AI assistance</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>50+ premium theme templates</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Custom domain & SSL included</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Mobile-first responsive design</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Smart Product Management</CardTitle>
              <CardDescription className="text-slate-600">
                Advanced catalog system with AI-powered inventory optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Bulk import with AI categorization</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Predictive inventory management</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Multi-variant product support</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Automated SEO optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Unified Payment Hub</CardTitle>
              <CardDescription className="text-slate-600">
                Enterprise-grade payment processing with global coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>200+ global payment methods</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>PCI DSS Level 1 compliance</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Real-time fraud protection</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Automated tax calculations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Customer Intelligence</CardTitle>
              <CardDescription className="text-slate-600">
                AI-driven customer insights and personalization engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>360° customer profiles</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Behavioral analytics & segmentation</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Automated loyalty programs</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Personalized marketing automation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Advanced Analytics</CardTitle>
              <CardDescription className="text-slate-600">
                Real-time business intelligence with predictive insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>Real-time performance dashboards</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>Predictive sales forecasting</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>Custom report builder</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>API-driven data exports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">AI Automation Suite</CardTitle>
              <CardDescription className="text-slate-600">
                Intelligent automation for operations and marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>Smart pricing optimization</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>Automated content generation</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>Workflow automation builder</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>AI-powered recommendations</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-8">Development Roadmap</h2>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Q1 2025</h3>
                <p className="text-slate-600">Beta Development</p>
              </div>
              <div className="hidden md:block w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Q2 2025</h3>
                <p className="text-slate-600">Public Launch</p>
              </div>
              <div className="hidden md:block w-16 h-1 bg-gradient-to-r from-purple-500 to-green-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Q3 2025</h3>
                <p className="text-slate-600">Enterprise Features</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">Join the waitlist and be among the first to experience the future of e-commerce.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setIsEarlyAccessOpen(true)}
              size="lg" 
              variant="secondary" 
              className="px-8 py-4 text-lg font-semibold bg-white text-blue-700 hover:bg-gray-100"
            >
              Get Enterprise Access
            </Button>
            <Button 
              onClick={() => setIsNotifyOpen(true)}
              size="lg" 
              variant="outline" 
              className="px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white/10"
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}