import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Zap, Target, TrendingUp, Clock, Users, ShoppingCart, Mail, MessageSquare, BarChart } from 'lucide-react';

interface AITemplateGeneratorProps {
  onTemplateCreated: (template: any) => void;
}

const templateCategories = [
  { id: 'inventory', name: 'Inventory Management', icon: ShoppingCart, description: 'Automated stock monitoring and reordering' },
  { id: 'pricing', name: 'Dynamic Pricing', icon: TrendingUp, description: 'AI-powered price optimization rules' },
  { id: 'marketing', name: 'Marketing Automation', icon: Mail, description: 'Targeted campaigns and customer engagement' },
  { id: 'customer_service', name: 'Customer Service', icon: MessageSquare, description: 'Automated support and response systems' },
  { id: 'analytics', name: 'Analytics & Reporting', icon: BarChart, description: 'Data collection and insight generation' },
  { id: 'order_processing', name: 'Order Processing', icon: Clock, description: 'Streamlined order management workflows' }
];

const businessTypes = [
  'E-commerce Store', 'Retail Business', 'Subscription Service', 'Marketplace', 
  'B2B Service', 'SaaS Company', 'Manufacturing', 'Digital Agency'
];

const automationGoals = [
  'Reduce manual work', 'Increase revenue', 'Improve customer satisfaction',
  'Optimize inventory', 'Reduce costs', 'Scale operations', 'Enhance analytics'
];

export function AITemplateGenerator({ onTemplateCreated }: AITemplateGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [businessProfile, setBusinessProfile] = useState({
    businessType: '',
    industry: '',
    teamSize: '',
    currentChallenges: '',
    primaryGoals: [] as string[],
    budget: '',
    timeframe: ''
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [generatedTemplates, setGeneratedTemplates] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateTemplates = useMutation({
    mutationFn: async (profile: any) => {
      return await apiRequest('POST', '/api/automation/ai-templates/generate', {
        businessProfile: profile,
        category: selectedCategory
      });
    },
    onSuccess: (response) => {
      setGeneratedTemplates(response.templates || []);
      setCurrentStep(3);
      toast({
        title: "AI Templates Generated",
        description: `Generated ${response.templates?.length || 0} automation templates`
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate templates. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deployTemplate = useMutation({
    mutationFn: async (template: any) => {
      return await apiRequest('POST', '/api/automation/rules', template);
    },
    onSuccess: (response, template) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
      onTemplateCreated(template);
      toast({
        title: "Template Deployed",
        description: "Automation rule is now active"
      });
      setIsOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCurrentStep(1);
    setBusinessProfile({
      businessType: '',
      industry: '',
      teamSize: '',
      currentChallenges: '',
      primaryGoals: [],
      budget: '',
      timeframe: ''
    });
    setSelectedCategory('');
    setGeneratedTemplates([]);
  };

  const handleGoalToggle = (goal: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal]
    }));
  };

  const handleGenerate = () => {
    if (!selectedCategory || !businessProfile.businessType) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }
    generateTemplates.mutate(businessProfile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Template Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Automation Template Generator
          </DialogTitle>
          <DialogDescription>
            Create custom automation rules tailored to your business needs using AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={`step-${currentStep}`} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step-1" disabled={currentStep < 1}>Business Profile</TabsTrigger>
            <TabsTrigger value="step-2" disabled={currentStep < 2}>Category Selection</TabsTrigger>
            <TabsTrigger value="step-3" disabled={currentStep < 3}>Generated Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="step-1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tell us about your business</CardTitle>
                <CardDescription>This information helps AI generate better automation templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select value={businessProfile.businessType} onValueChange={(value) => 
                      setBusinessProfile(prev => ({ ...prev, businessType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={businessProfile.industry}
                      onChange={(e) => setBusinessProfile(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Fashion, Electronics, Food & Beverage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Select value={businessProfile.teamSize} onValueChange={(value) => 
                      setBusinessProfile(prev => ({ ...prev, teamSize: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo (1 person)</SelectItem>
                        <SelectItem value="small">Small (2-10 people)</SelectItem>
                        <SelectItem value="medium">Medium (11-50 people)</SelectItem>
                        <SelectItem value="large">Large (50+ people)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeframe">Implementation Timeframe</Label>
                    <Select value={businessProfile.timeframe} onValueChange={(value) => 
                      setBusinessProfile(prev => ({ ...prev, timeframe: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (this week)</SelectItem>
                        <SelectItem value="short">Short-term (1 month)</SelectItem>
                        <SelectItem value="medium">Medium-term (3 months)</SelectItem>
                        <SelectItem value="long">Long-term (6+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="challenges">Current Challenges</Label>
                  <Textarea
                    id="challenges"
                    value={businessProfile.currentChallenges}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, currentChallenges: e.target.value }))}
                    placeholder="Describe your main business challenges and pain points..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Primary Goals (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {automationGoals.map(goal => (
                      <Badge
                        key={goal}
                        variant={businessProfile.primaryGoals.includes(goal) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleGoalToggle(goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)} disabled={!businessProfile.businessType}>
                    Next: Select Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="step-2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Automation Category</CardTitle>
                <CardDescription>Select the area where you want to create automation rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateCategories.map(category => {
                    const Icon = category.icon;
                    return (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all border-2 ${
                          selectedCategory === category.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className={`h-8 w-8 mx-auto mb-2 ${
                            selectedCategory === category.id ? 'text-purple-600' : 'text-gray-600'
                          }`} />
                          <h3 className="font-semibold mb-1">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedCategory || generateTemplates.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {generateTemplates.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate AI Templates
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="step-3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Automation Templates</CardTitle>
                <CardDescription>AI-generated templates tailored to your business needs</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTemplates.length > 0 ? (
                  <div className="space-y-4">
                    {generatedTemplates.map((template, index) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
                              <p className="text-muted-foreground mb-3">{template.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="secondary">
                                  <Target className="h-3 w-3 mr-1" />
                                  {template.category}
                                </Badge>
                                <Badge variant="outline">
                                  Expected ROI: {template.expectedROI}
                                </Badge>
                                <Badge variant="outline">
                                  Complexity: {template.complexity}
                                </Badge>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                <p><strong>Trigger:</strong> {template.triggerType}</p>
                                <p><strong>Action:</strong> {template.actionType}</p>
                                <p><strong>Expected Impact:</strong> {template.expectedImpact}</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => deployTemplate.mutate(template)}
                              disabled={deployTemplate.isPending}
                              className="ml-4"
                            >
                              {deployTemplate.isPending ? 'Deploying...' : 'Deploy Template'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">No templates generated yet</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back to Categories
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}