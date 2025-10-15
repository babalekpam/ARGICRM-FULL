import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Globe, CheckCircle, AlertCircle, Loader2, Shield, Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/logo";
import { useLocation } from "wouter";

interface CompanyInfo {
  name: string;
  domain: string;
  industry: string;
  size: string;
  description: string;
  founded: string;
  location: string;
  verified: boolean;
  confidence: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  industry: string;
  companySize: string;
  phone: string;
  jobTitle: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  marketingOptIn: boolean;
}

export default function AdaptiveSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [companyVerifying, setCompanyVerifying] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    industry: "",
    companySize: "",
    phone: "",
    jobTitle: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    marketingOptIn: false,
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing",
    "Real Estate", "Consulting", "Marketing", "Non-profit", "Government", "Other"
  ];

  const companySizes = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-1000 employees", "1000+ employees"
  ];

  // Company verification simulation
  const verifyCompany = async (companyName: string, email: string) => {
    if (!companyName.trim()) return;

    setCompanyVerifying(true);
    
    try {
      // Simulate API call to company verification service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domain = email.split('@')[1];
      const isBusinessEmail = !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain);
      
      const mockCompanyInfo: CompanyInfo = {
        name: companyName,
        domain: domain,
        industry: isBusinessEmail ? "Technology" : "Unknown",
        size: "51-200 employees",
        description: `${companyName} is a dynamic company focused on innovation and growth.`,
        founded: "2015",
        location: "San Francisco, CA",
        verified: isBusinessEmail,
        confidence: isBusinessEmail ? 85 : 45
      };

      setCompanyInfo(mockCompanyInfo);
      
      if (mockCompanyInfo.verified) {
        setFormData(prev => ({
          ...prev,
          industry: mockCompanyInfo.industry,
          companySize: mockCompanyInfo.size
        }));
        
        toast({
          title: "Company Verified",
          description: `${companyName} has been verified. Some fields have been pre-filled.`,
        });
      } else {
        toast({
          title: "Manual Verification Required",
          description: "We couldn't automatically verify this company. Please complete all fields manually.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify company. Please proceed with manual entry.",
        variant: "destructive",
      });
    } finally {
      setCompanyVerifying(false);
    }
  };

  // Auto-verify when company and email are provided
  useEffect(() => {
    if (formData.company && formData.email && formData.company.length > 3) {
      const timeoutId = setTimeout(() => {
        verifyCompany(formData.company, formData.email);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.company, formData.email]);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email);
      case 2:
        return !!(formData.company && formData.industry && formData.companySize);
      case 3:
        return !!(formData.password && formData.confirmPassword && 
                 formData.password === formData.confirmPassword && 
                 formData.password.length >= 8 && formData.agreeToTerms);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          industry: formData.industry,
          companySize: formData.companySize,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          password: formData.password,
          companyVerified: companyInfo?.verified || false,
          marketingOptIn: formData.marketingOptIn
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_email', formData.email);
        
        toast({
          title: "Account Created Successfully",
          description: "Welcome to ARGILETTE CRM! Redirecting to your dashboard...",
        });

        setTimeout(() => {
          setLocation('/dashboard');
        }, 1500);
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            placeholder="John"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Business Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="john.doe@company.com"
          required
        />
        <p className="text-sm text-gray-500">We'll use this to verify your company</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          value={formData.jobTitle}
          onChange={(e) => updateFormData('jobTitle', e.target.value)}
          placeholder="Sales Manager"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData('phone', e.target.value)}
          placeholder="+1 (314) 472-3839"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
        <p className="text-gray-600">Tell us about your organization</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company Name *</Label>
        <div className="relative">
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => updateFormData('company', e.target.value)}
            placeholder="Acme Corporation"
            required
          />
          {companyVerifying && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
        </div>
      </div>

      {companyInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            {companyInfo.verified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-medium">
              {companyInfo.verified ? 'Company Verified' : 'Verification Pending'}
            </span>
            <Badge variant={companyInfo.verified ? "default" : "secondary"}>
              {companyInfo.confidence}% confidence
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span>{companyInfo.domain}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{companyInfo.size}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{companyInfo.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span>Founded {companyInfo.founded}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="industry">Industry *</Label>
        <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
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

      <div className="space-y-2">
        <Label htmlFor="companySize">Company Size *</Label>
        <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select company size" />
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
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Security & Preferences</h2>
        <p className="text-gray-600">Set up your password and preferences</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          placeholder="Minimum 8 characters"
          required
        />
        <p className="text-sm text-gray-500">
          Use at least 8 characters with a mix of letters, numbers, and symbols
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          placeholder="Re-enter your password"
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-sm text-red-600">Passwords do not match</p>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateFormData('agreeToTerms', !!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="agreeToTerms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the Terms of Service and Privacy Policy *
            </label>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketingOptIn"
            checked={formData.marketingOptIn}
            onCheckedChange={(checked) => updateFormData('marketingOptIn', !!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label htmlFor="marketingOptIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Send me product updates and marketing communications
            </label>
            <p className="text-xs text-gray-500">You can unsubscribe at any time</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">Enterprise Security</span>
        </div>
        <p className="text-sm text-blue-800 mt-1">
          Your data is protected with enterprise-grade encryption and security measures.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create Your Admin Account</h1>
            <p className="text-gray-600 mt-2">Join ARGILETTE CRM and transform your customer relationships</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Main Card */}
          <Card className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
            <CardContent className="p-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="w-24"
                >
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="w-24 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!validateStep(currentStep) || isLoading}
                    className="w-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Button variant="link" onClick={() => setLocation('/')} className="p-0 h-auto text-blue-600 hover:text-blue-700">
                Sign in here
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}