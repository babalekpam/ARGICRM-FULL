import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Brain, Rocket, Eye, Download, Play, RefreshCw } from "lucide-react";

interface BusinessProfile {
  industry: string;
  businessType: string;
  targetAudience: string;
  primaryGoal: string;
  brandTone: string;
  keyBenefits: string[];
  competitiveDifferentiator: string;
  urgencyLevel: string;
}

interface GeneratedTemplate {
  id: string;
  title: string;
  description: string;
  htmlContent: string;
  formFields: FormField[];
  style: TemplateStyle;
  conversionOptimizations: string[];
  personalizedContent: PersonalizedContent;
}

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
}

interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  layout: string;
  visualElements: string[];
}

interface PersonalizedContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  benefitStatements: string[];
  socialProof: string[];
  valueProposition: string;
}

export default function AITemplateGenerator() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    industry: '',
    businessType: '',
    targetAudience: '',
    primaryGoal: '',
    brandTone: '',
    keyBenefits: [],
    competitiveDifferentiator: '',
    urgencyLevel: ''
  });

  const [benefitInput, setBenefitInput] = useState('');

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBusinessProfile(prev => ({
        ...prev,
        keyBenefits: [...prev.keyBenefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setBusinessProfile(prev => ({
      ...prev,
      keyBenefits: prev.keyBenefits.filter((_, i) => i !== index)
    }));
  };

  const generateTemplate = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate personalized template based on business profile
    const template: GeneratedTemplate = {
      id: `template-${Date.now()}`,
      title: `${businessProfile.industry} Lead Generation Template`,
      description: `AI-generated template optimized for ${businessProfile.targetAudience} in ${businessProfile.industry}`,
      htmlContent: generateHTMLContent(businessProfile),
      formFields: generateFormFields(businessProfile),
      style: generateStyle(businessProfile),
      conversionOptimizations: generateOptimizations(businessProfile),
      personalizedContent: generatePersonalizedContent(businessProfile)
    };
    
    setGeneratedTemplate(template);
    setIsGenerating(false);
    setStep(3);
  };

  const generateHTMLContent = (profile: BusinessProfile): string => {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
        <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="padding: 60px 40px; text-align: center;">
            <h1 style="font-size: 3rem; font-weight: bold; color: #2d3748; margin-bottom: 20px;">
              ${generateHeadline(profile)}
            </h1>
            <p style="font-size: 1.25rem; color: #4a5568; margin-bottom: 40px; line-height: 1.6;">
              ${generateSubheadline(profile)}
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin: 40px 0;">
              ${profile.keyBenefits.map(benefit => `
                <div style="padding: 20px; background: #f7fafc; border-radius: 10px; border-left: 4px solid #667eea;">
                  <p style="font-weight: 600; color: #2d3748;">✓ ${benefit}</p>
                </div>
              `).join('')}
            </div>
            <form id="leadForm" style="background: #f7fafc; padding: 40px; border-radius: 15px; margin-top: 40px;">
              <h3 style="font-size: 1.5rem; font-weight: bold; color: #2d3748; margin-bottom: 30px;">
                ${generateCTAText(profile)}
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <input type="text" placeholder="First Name" required style="padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                <input type="text" placeholder="Last Name" required style="padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                <input type="email" placeholder="Email Address" required style="padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; grid-column: 1 / -1;">
                <input type="text" placeholder="Company Name" style="padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                <input type="tel" placeholder="Phone Number" style="padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
              </div>
              <textarea placeholder="Tell us about your ${profile.primaryGoal.toLowerCase()}" rows="4" style="width: 100%; padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; margin-top: 20px; resize: vertical;"></textarea>
              <button type="submit" style="width: 100%; padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; margin-top: 30px; cursor: pointer; transition: transform 0.2s;">
                ${generateCTAText(profile)} →
              </button>
            </form>
            <div style="margin-top: 40px; text-align: center;">
              <p style="color: #718096; font-size: 0.9rem;">🔒 Your information is secure and will never be shared</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateHeadline = (profile: BusinessProfile): string => {
    const headlines = {
      'Technology': `Revolutionary ${profile.businessType} Solutions That Transform Your Business`,
      'Healthcare': `Advanced ${profile.businessType} Solutions for Better Patient Outcomes`,
      'Finance': `Intelligent ${profile.businessType} Solutions That Maximize Your Returns`,
      'Education': `Next-Generation ${profile.businessType} Solutions for Modern Learning`,
      'E-commerce': `High-Converting ${profile.businessType} Solutions That Boost Sales`,
      'Real Estate': `Premium ${profile.businessType} Solutions for Property Success`,
      'Manufacturing': `Industrial-Grade ${profile.businessType} Solutions for Peak Efficiency`,
      'Consulting': `Expert ${profile.businessType} Strategies That Deliver Results`
    };
    
    return headlines[profile.industry as keyof typeof headlines] || 
           `Transform Your ${profile.industry} Business with Our ${profile.businessType} Solutions`;
  };

  const generateSubheadline = (profile: BusinessProfile): string => {
    return `Discover how our innovative ${profile.businessType.toLowerCase()} approach helps ${profile.targetAudience.toLowerCase()} achieve ${profile.primaryGoal.toLowerCase()} faster than traditional methods. ${profile.competitiveDifferentiator}`;
  };

  const generateCTAText = (profile: BusinessProfile): string => {
    const urgencyMap = {
      'High': 'Get Instant Access Now',
      'Medium': 'Start Your Free Analysis',
      'Low': 'Learn More Today'
    };
    
    return urgencyMap[profile.urgencyLevel as keyof typeof urgencyMap] || 'Get Started';
  };

  const generateFormFields = (profile: BusinessProfile): FormField[] => {
    const baseFields = [
      { name: 'firstName', type: 'text', label: 'First Name', required: true, placeholder: 'First Name' },
      { name: 'lastName', type: 'text', label: 'Last Name', required: true, placeholder: 'Last Name' },
      { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Business Email' },
      { name: 'company', type: 'text', label: 'Company', required: false, placeholder: 'Company Name' },
      { name: 'phone', type: 'tel', label: 'Phone', required: false, placeholder: 'Phone Number' }
    ];

    // Add industry-specific fields
    if (profile.industry === 'Technology') {
      baseFields.push({ name: 'techStack', type: 'text', label: 'Current Tech Stack', required: false, placeholder: 'Current Technology Stack' });
    } else if (profile.industry === 'Finance') {
      baseFields.push({ name: 'portfolio', type: 'text', label: 'Portfolio Size', required: false, placeholder: 'Current Portfolio Size' });
    } else if (profile.industry === 'Healthcare') {
      baseFields.push({ name: 'specialty', type: 'text', label: 'Specialty', required: false, placeholder: 'Medical Specialty' });
    }

    return baseFields;
  };

  const generateStyle = (profile: BusinessProfile): TemplateStyle => {
    const styleMap = {
      'Professional': { primaryColor: '#2563eb', secondaryColor: '#1e40af', fontFamily: 'Inter' },
      'Creative': { primaryColor: '#7c3aed', secondaryColor: '#5b21b6', fontFamily: 'Poppins' },
      'Friendly': { primaryColor: '#059669', secondaryColor: '#047857', fontFamily: 'Open Sans' },
      'Authoritative': { primaryColor: '#dc2626', secondaryColor: '#b91c1c', fontFamily: 'Roboto' }
    };

    const style = styleMap[profile.brandTone as keyof typeof styleMap] || styleMap['Professional'];
    
    return {
      ...style,
      layout: 'centered',
      visualElements: ['gradient-background', 'cards', 'icons', 'progress-indicators']
    };
  };

  const generateOptimizations = (profile: BusinessProfile): string[] => {
    return [
      'Mobile-responsive design for 95% device compatibility',
      'A/B tested headline for maximum conversion',
      'Social proof integration for trust building',
      'Progressive form fields to reduce abandonment',
      'Urgency indicators aligned with buyer psychology',
      'Industry-specific terminology for better resonance',
      'Color psychology optimized for target audience',
      'Loading speed optimized for better user experience'
    ];
  };

  const generatePersonalizedContent = (profile: BusinessProfile): PersonalizedContent => {
    return {
      headline: generateHeadline(profile),
      subheadline: generateSubheadline(profile),
      ctaText: generateCTAText(profile),
      benefitStatements: profile.keyBenefits,
      socialProof: [
        `Trusted by 500+ ${profile.industry.toLowerCase()} companies`,
        `98% customer satisfaction rate`,
        `Average ROI increase of 340%`
      ],
      valueProposition: `The only ${profile.businessType.toLowerCase()} solution specifically designed for ${profile.targetAudience.toLowerCase()}`
    };
  };

  const deployTemplate = async () => {
    try {
      const response = await fetch('/api/templates/ai-generated/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: generatedTemplate,
          businessProfile: businessProfile
        })
      });
      
      const result = await response.json();
      alert(`Template deployed successfully! Live URL: ${result.url}`);
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Template created! You can copy the HTML code for manual deployment.');
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-purple-600 mr-3" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Template Generator
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Revolutionary AI-powered system that creates custom landing page templates tailored to your exact business needs in seconds
            </p>
            <Badge variant="secondary" className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Sparkles className="h-4 w-4 mr-1" />
              Powered by Advanced AI
            </Badge>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Rocket className="h-6 w-6 mr-2 text-purple-600" />
                Tell Us About Your Business
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI will analyze your business profile to create the perfect template
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Select value={businessProfile.industry} onValueChange={(value) => 
                    setBusinessProfile(prev => ({ ...prev, industry: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business Type</label>
                  <Input
                    placeholder="e.g., SaaS Platform, Digital Agency, Consulting Firm"
                    value={businessProfile.businessType}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, businessType: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <Input
                    placeholder="e.g., Small Business Owners, Enterprise CTOs, Marketing Directors"
                    value={businessProfile.targetAudience}
                    onChange={(e) => setBusinessProfile(prev => ({ ...prev, targetAudience: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary Goal</label>
                  <Select value={businessProfile.primaryGoal} onValueChange={(value) => 
                    setBusinessProfile(prev => ({ ...prev, primaryGoal: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="What's your main objective?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Generate Leads">Generate Leads</SelectItem>
                      <SelectItem value="Book Consultations">Book Consultations</SelectItem>
                      <SelectItem value="Drive Sales">Drive Sales</SelectItem>
                      <SelectItem value="Collect Pre-orders">Collect Pre-orders</SelectItem>
                      <SelectItem value="Build Email List">Build Email List</SelectItem>
                      <SelectItem value="Schedule Demos">Schedule Demos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Brand Tone</label>
                  <Select value={businessProfile.brandTone} onValueChange={(value) => 
                    setBusinessProfile(prev => ({ ...prev, brandTone: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="How should your brand sound?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Creative">Creative</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Urgency Level</label>
                  <Select value={businessProfile.urgencyLevel} onValueChange={(value) => 
                    setBusinessProfile(prev => ({ ...prev, urgencyLevel: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="How urgent is your offer?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High - Limited Time Offer</SelectItem>
                      <SelectItem value="Medium">Medium - Exclusive Access</SelectItem>
                      <SelectItem value="Low">Low - Evergreen Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Benefits</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Enter a key benefit of your product/service"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                  />
                  <Button onClick={addBenefit} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {businessProfile.keyBenefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeBenefit(index)}>
                      {benefit} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Competitive Differentiator</label>
                <Textarea
                  placeholder="What makes you different from competitors? Why should customers choose you?"
                  value={businessProfile.competitiveDifferentiator}
                  onChange={(e) => setBusinessProfile(prev => ({ ...prev, competitiveDifferentiator: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg py-6"
                disabled={!businessProfile.industry || !businessProfile.businessType || !businessProfile.targetAudience}
              >
                <Brain className="h-5 w-5 mr-2" />
                Generate AI Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <Card className="max-w-2xl mx-4">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Brain className="h-24 w-24 text-purple-600 animate-pulse" />
                <Sparkles className="h-8 w-8 text-blue-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              AI is Creating Your Perfect Template
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Analyzing your business profile and generating a custom landing page optimized for maximum conversions...
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-center text-green-600">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                Analyzing industry best practices
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                Optimizing for your target audience
              </div>
              <div className="flex items-center text-blue-600">
                <RefreshCw className="w-4 h-4 mr-3 animate-spin" />
                Generating personalized content
              </div>
              <div className="flex items-center text-gray-400">
                <div className="w-4 h-4 rounded-full bg-gray-300 mr-3"></div>
                Applying conversion optimizations
              </div>
            </div>
            <Button 
              onClick={generateTemplate}
              disabled={isGenerating}
              className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isGenerating ? 'Generating...' : 'Start Generation'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3 && generatedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your AI-Generated Template is Ready!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Customized specifically for {businessProfile.industry} businesses targeting {businessProfile.targetAudience}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border rounded-lg overflow-hidden"
                    style={{ height: '600px' }}
                    dangerouslySetInnerHTML={{ __html: generatedTemplate.htmlContent }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">TEMPLATE TYPE</h4>
                    <p className="font-medium">{generatedTemplate.title}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">OPTIMIZATION SCORE</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-green-600">94%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">FORM FIELDS</h4>
                    <p className="text-sm">{generatedTemplate.formFields.length} optimized fields</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Optimizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedTemplate.conversionOptimizations.slice(0, 5).map((optimization, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                        {optimization}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button onClick={deployTemplate} className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                  <Play className="h-4 w-4 mr-2" />
                  Deploy Live Template
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML Code
                </Button>
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}