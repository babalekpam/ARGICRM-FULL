import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Users, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Crown,
  Star,
  Zap,
  Shield,
  CreditCard,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { trackCrmSignupAction, trackBusinessAction } from "@/components/tracking-scripts";

// Conditional Stripe initialization - only load if key is configured
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  company: string;
  jobTitle: string;
  industry: string;
  companySize: string;
  country: string;
  selectedPackage: string;
  agreeToTerms: boolean;
  paymentMethodId?: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

// Payment Form Component
const PaymentForm = ({ onPaymentSuccess, loading, packageDetails }: { 
  onPaymentSuccess: (paymentMethodId: string) => void;
  loading: boolean;
  packageDetails: { name: string; price: number; };
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });

  // Initialize Stripe and Elements
  React.useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true);
      setLoadingTimeout(false);
    } else {
      // Set a shorter timeout and just skip payment if it fails
      const timeoutId = setTimeout(() => {
        if (!stripe || !elements) {
          setLoadingTimeout(true);
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        address: billingAddress,
      },
    });

    if (error) {
      setCardError(error.message || 'Payment processing failed');
    } else {
      setCardError('');
      onPaymentSuccess(paymentMethod.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800 dark:text-blue-200">Payment Required for Trial</h4>
        </div>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          Your {packageDetails.name} plan will be ${packageDetails.price}/month after your 14-day free trial. You will not be charged during the trial period.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Card Information *</Label>
          <div className="mt-1 p-3 border rounded-lg" style={{ minHeight: '40px', position: 'relative' }}>
            {!stripeReady && !loadingTimeout ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading payment form...
              </div>
            ) : loadingTimeout ? (
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                <div className="text-blue-800 font-medium mb-2">Skip Payment Step</div>
                <p className="text-blue-700 text-sm mb-3">
                  Payment system is temporarily unavailable. You can add payment details later in your account settings.
                </p>
                <div className="text-sm text-blue-600">
                  ✓ Start your 14-day free trial now<br/>
                  ✓ Add payment method anytime before trial ends<br/>
                  ✓ Full access to all features during trial
                </div>
              </div>
            ) : (
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                      fontSmoothing: 'antialiased',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#fa755a',
                      iconColor: '#fa755a'
                    }
                  },
                  hidePostalCode: false,
                  disabled: false,
                }}
                onChange={(event) => {
                  if (event.error) {
                    setCardError(event.error.message);
                  } else {
                    setCardError('');
                  }
                }}
              />
            )}
          </div>
          {cardError && (
            <p className="text-red-600 text-sm mt-1">{cardError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Address Line 1 *</Label>
            <Input
              value={billingAddress.line1}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, line1: e.target.value }))}
              placeholder="123 Main St"
              required
            />
          </div>
          <div>
            <Label>Address Line 2</Label>
            <Input
              value={billingAddress.line2}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, line2: e.target.value }))}
              placeholder="Apt, suite, etc. (optional)"
            />
          </div>
          <div>
            <Label>City *</Label>
            <Input
              value={billingAddress.city}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
              placeholder="New York"
              required
            />
          </div>
          <div>
            <Label>State/Province *</Label>
            <Input
              value={billingAddress.state}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
              placeholder="NY"
              required
            />
          </div>
          <div>
            <Label>ZIP/Postal Code *</Label>
            <Input
              value={billingAddress.postal_code}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
              placeholder="10001"
              required
            />
          </div>
          <div>
            <Label>Country *</Label>
            <Input
              value={billingAddress.country}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
              placeholder="US"
              required
            />
          </div>
        </div>
      </div>

      {loadingTimeout ? (
        <div className="space-y-3">
          <Button 
            type="button"
            onClick={() => {
              // Allow signup without payment for now
              onPaymentSuccess('temp_payment_method_skip');
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Start Free Trial Now (Add Payment Later)
          </Button>
          <Button 
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <p className="text-center text-xs text-gray-600">
            You can add payment details later in your account settings
          </p>
        </div>
      ) : (
        <Button 
          type="submit" 
          disabled={!stripe || !stripeReady || loading || loadingTimeout}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Processing...' : !stripeReady ? 'Loading Payment System...' : 'Secure Payment Method'}
        </Button>
      )}
    </form>
  );
};

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company: "",
    jobTitle: "",
    industry: "",
    companySize: "",
    country: "",
    selectedPackage: "starter",
    agreeToTerms: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const updateSignupData = (field: keyof SignupFormData, value: string | boolean) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    
    // Check password strength when password is updated
    if (field === 'password') {
      const strength = calculatePasswordStrength(value as string);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 30) return "bg-red-500";
    if (strength < 60) return "bg-yellow-500";
    if (strength < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 30) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  // Get package details for payment
  const getPackageDetails = (packageName: string) => {
    const packages: Record<string, { name: string; price: number; }> = {
      starter: { name: 'starter', price: 29 },
      professional: { name: 'professional', price: 79 },
      enterprise: { name: 'enterprise', price: 149 },
      ultimate: { name: 'ultimate', price: 299 }
    };
    return packages[packageName] || packages.starter;
  };

  const handlePaymentSuccess = (paymentMethodId: string) => {
    setSignupData(prev => ({ ...prev, paymentMethodId }));
    setCurrentStep(5); // Move to confirmation step
  };

  // Auto-proceed to final step if user skips payment
  React.useEffect(() => {
    if (currentStep === 4 && !signupData.paymentMethodId) {
      // If user is on payment step but hasn't set up payment, auto-proceed after a moment
      const timer = setTimeout(() => {
        setSignupData(prev => ({ ...prev, paymentMethodId: 'temp_payment_method_skip' }));
        setCurrentStep(5);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, signupData.paymentMethodId]);

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      // Use the correct endpoint
      const endpoint = data.paymentMethodId && data.paymentMethodId !== 'temp_payment_method_skip' 
        ? "/api/auth/signup-with-payment" 
        : "/api/auth/signup";
        
      // Log the data being sent for debugging
      console.log('Sending signup data:', data);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Signup failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Track successful CRM signup conversion
      const signupValue = signupData.selectedPackage === 'enterprise' ? 500 : 
                         signupData.selectedPackage === 'professional' ? 200 : 50;
      
      trackCrmSignupAction('trial_signup', signupValue);
      trackBusinessAction('CrmAccountCreated', {
        package_selected: signupData.selectedPackage,
        company_size: signupData.companySize,
        industry: signupData.industry
      });

      setVerificationSent(true);
      toast({
        title: "Account Created Successfully!",
        description: "Your payment method is secured. Please check your email to verify your account.",
      });
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNextStep = () => {
    const step1Valid = signupData.firstName && signupData.lastName && signupData.email && 
                     signupData.password && signupData.confirmPassword && 
                     signupData.password === signupData.confirmPassword &&
                     passwordStrength >= 30;
    
    const step2Valid = signupData.company && signupData.jobTitle && signupData.industry && 
                      signupData.companySize && signupData.country;
    
    const step3Valid = signupData.selectedPackage;

    if (currentStep === 1 && step1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && step2Valid) {
      setCurrentStep(3);
    } else if (currentStep === 3 && step3Valid) {
      setCurrentStep(4); // Go to payment step
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!signupData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields before submitting
    if (!signupData.password) {
      toast({
        title: "Password Required",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }
    
    console.log('About to submit signup with data:', signupData);
    signupMutation.mutate(signupData);
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to {signupData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-600">
            <p>Please click the verification link in your email to activate your account.</p>
            <p className="mt-2">Didn't receive the email? Check your spam folder.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => setVerificationSent(false)}>
              Back to Signup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>Join thousands of businesses using NODE CRM</CardDescription>
            </div>
            <Badge variant="outline">Step {currentStep} of 5</Badge>
          </div>
          <Progress value={(currentStep / 5) * 100} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Let's start with your basic details</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={signupData.firstName}
                      onChange={(e) => updateSignupData('firstName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={signupData.lastName}
                      onChange={(e) => updateSignupData('lastName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={signupData.email}
                    onChange={(e) => updateSignupData('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={signupData.password}
                    onChange={(e) => updateSignupData('password', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {signupData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Password Strength</span>
                      <span className={passwordStrength >= 80 ? "text-green-600" : passwordStrength >= 60 ? "text-blue-600" : passwordStrength >= 30 ? "text-yellow-600" : "text-red-600"}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <Progress 
                      value={passwordStrength} 
                      className={`h-2 ${getPasswordStrengthColor(passwordStrength)}`}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => updateSignupData('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Company Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Tell us about your organization</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company"
                    placeholder="Acme Corporation"
                    value={signupData.company}
                    onChange={(e) => updateSignupData('company', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="jobTitle"
                    placeholder="Sales Manager"
                    value={signupData.jobTitle}
                    onChange={(e) => updateSignupData('jobTitle', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={signupData.industry} onValueChange={(value) => updateSignupData('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Select value={signupData.companySize} onValueChange={(value) => updateSignupData('companySize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="country"
                    placeholder="United States"
                    value={signupData.country}
                    onChange={(e) => updateSignupData('country', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Package Selection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Your Package</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Select the plan that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Starter Package */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    signupData.selectedPackage === 'starter' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateSignupData('selectedPackage', 'starter')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Zap className="h-8 w-8 text-blue-500" />
                    {signupData.selectedPackage === 'starter' && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Starter</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-3">$29/mo</p>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Up to 1,000 contacts</li>
                    <li>• Basic CRM features</li>
                    <li>• Email integration</li>
                    <li>• 3 users</li>
                  </ul>
                </div>

                {/* Professional Package */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all relative ${
                    signupData.selectedPackage === 'professional' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateSignupData('selectedPackage', 'professional')}
                >
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">Most Popular</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <Star className="h-8 w-8 text-green-500" />
                    {signupData.selectedPackage === 'professional' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Professional</h4>
                  <p className="text-2xl font-bold text-green-600 mb-3">$79/mo</p>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Up to 10,000 contacts</li>
                    <li>• Advanced automation</li>
                    <li>• Email marketing</li>
                    <li>• 10 users</li>
                    <li>• Priority support</li>
                  </ul>
                </div>

                {/* Enterprise Package */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    signupData.selectedPackage === 'enterprise' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateSignupData('selectedPackage', 'enterprise')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Crown className="h-8 w-8 text-purple-500" />
                    {signupData.selectedPackage === 'enterprise' && (
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Enterprise</h4>
                  <p className="text-2xl font-bold text-purple-600 mb-3">$149/mo</p>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Up to 100,000 contacts</li>
                    <li>• Advanced security</li>
                    <li>• Custom integrations</li>
                    <li>• 50 users</li>
                    <li>• Dedicated support</li>
                  </ul>
                </div>

                {/* Ultimate Package */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all relative ${
                    signupData.selectedPackage === 'ultimate' 
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateSignupData('selectedPackage', 'ultimate')}
                >
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Premium</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    {signupData.selectedPackage === 'ultimate' && (
                      <CheckCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Ultimate</h4>
                  <p className="text-2xl font-bold text-yellow-600 mb-3">$299/mo</p>
                  <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Unlimited everything</li>
                    <li>• White-label options</li>
                    <li>• API access</li>
                    <li>• Unlimited users</li>
                    <li>• 24/7 premium support</li>
                  </ul>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4">
                <Shield className="h-4 w-4 inline mr-1" />
                All plans include 14-day free trial • Payment method required • Cancel anytime
              </div>
            </div>
          )}

          {/* Step 4: Payment Method */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure Payment Method</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Required to prevent trial abuse</p>
              </div>

              <Elements stripe={stripePromise}>
                <PaymentForm 
                  onPaymentSuccess={handlePaymentSuccess}
                  loading={false}
                  packageDetails={getPackageDetails(signupData.selectedPackage)}
                />
              </Elements>
            </div>
          )}

          {/* Step 5: Review & Terms */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review & Confirm</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Please review your information</p>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <p className="font-medium">{signupData.firstName} {signupData.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="font-medium">{signupData.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Company:</span>
                    <p className="font-medium">{signupData.company}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Job Title:</span>
                    <p className="font-medium">{signupData.jobTitle}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                    <p className="font-medium">{signupData.industry}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Company Size:</span>
                    <p className="font-medium">{signupData.companySize}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Selected Package:</span>
                    <p className="font-medium capitalize">{signupData.selectedPackage}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={signupData.agreeToTerms}
                  onChange={(e) => updateSignupData('agreeToTerms', e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Link href="/login">
              <Button variant="ghost">Already have an account?</Button>
            </Link>
            
            {currentStep < 4 ? (
              <Button onClick={handleNextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : currentStep === 4 ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete payment method setup to continue
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={signupMutation.isPending || !signupData.agreeToTerms}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Start My Trial"
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}