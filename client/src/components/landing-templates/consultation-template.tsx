import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, MessageSquare, Award, Clock, ArrowRight, Star } from "lucide-react";
import { handlePhoneInput } from "@/lib/phone-validation";

interface ConsultationFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  industry: string;
  budget: string;
  timeframe: string;
  challenges: string;
  preferredTime: string;
}

export default function ConsultationTemplate() {
  const [formData, setFormData] = useState<ConsultationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    industry: '',
    budget: '',
    timeframe: '',
    challenges: '',
    preferredTime: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/templates/consultation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          phone: '',
          industry: '',
          budget: '',
          timeframe: '',
          challenges: '',
          preferredTime: ''
        });
      }, 4000);
    } catch (error) {
      console.error('Error submitting consultation:', error);
      setIsSubmitted(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Calendar className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Consultation Scheduled!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our expert will contact you within 24 hours to confirm your consultation time.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                📧 Check your email for confirmation details<br/>
                📞 We'll call at your preferred time<br/>
                💼 Bring your business challenges and goals
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Free Expert Consultation
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Get Strategic Advice from 
                <span className="text-green-600 dark:text-green-400"> CRM Experts</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Book a free 30-minute consultation with our CRM specialists. 
                Get personalized recommendations for your business growth strategy.
              </p>
            </div>

            {/* Consultation Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Personalized business assessment</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Custom CRM strategy recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">30-minute focused consultation</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">No obligations or sales pressure</span>
              </div>
            </div>

            {/* Expert Profile */}
            <Card className="bg-white/70 dark:bg-gray-800/70 border">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    AS
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Alex Smith</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Senior CRM Consultant</p>
                    <div className="flex items-center mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">4.9/5 (200+ consultations)</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      "15 years helping businesses optimize their customer relationships. 
                      Specialized in sales process automation and team productivity."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You'll Get */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What you'll get from this consultation:</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>✓ Analysis of your current sales process</div>
                <div>✓ Identification of growth opportunities</div>
                <div>✓ Custom CRM implementation roadmap</div>
                <div>✓ ROI projections and timeline estimates</div>
                <div>✓ Best practices from industry leaders</div>
              </div>
            </div>
          </div>

          {/* Right Column - Consultation Booking Form */}
          <div className="lg:pl-8">
            <Card className="shadow-2xl border-2 border-green-200 dark:border-green-800">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
                <CardTitle className="text-2xl text-center">
                  Book Your Free Consultation
                </CardTitle>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  30 minutes that could transform your business
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="lastName"
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="company"
                      placeholder="Company Name *"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Phone Number (10 digits) *"
                      value={formData.phone}
                      onChange={(e) => handlePhoneInput(e.target.value, (value) => setFormData(prev => ({ ...prev, phone: value })))}
                      maxLength={10}
                      required
                    />
                  </div>
                  
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Industry *</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Professional Services</option>
                    <option value="other">Other</option>
                  </select>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Budget Range *</option>
                      <option value="under-5k">Under $5,000</option>
                      <option value="5k-15k">$5,000 - $15,000</option>
                      <option value="15k-50k">$15,000 - $50,000</option>
                      <option value="50k-plus">$50,000+</option>
                    </select>
                    
                    <select
                      name="timeframe"
                      value={formData.timeframe}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Timeframe *</option>
                      <option value="immediate">Immediate (This week)</option>
                      <option value="month">This month</option>
                      <option value="quarter">This quarter</option>
                      <option value="planning">Just planning</option>
                    </select>
                  </div>
                  
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Preferred Call Time *</option>
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 7PM)</option>
                    <option value="flexible">I'm flexible</option>
                  </select>
                  
                  <Textarea
                    name="challenges"
                    placeholder="What are your biggest business challenges? *"
                    value={formData.challenges}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                  
                  <Button type="submit" className="w-full text-lg py-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                    Schedule Free Consultation
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Free consultation. No obligations. We'll contact you within 24 hours to confirm.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Consultation Service?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our consultants have helped thousands of businesses optimize their customer relationships 
              and increase revenue through strategic CRM implementation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Guidance
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                15+ years of CRM expertise with proven track record of business growth.
              </p>
            </div>
            
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Personalized Strategy
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Custom recommendations based on your industry, size, and specific challenges.
              </p>
            </div>
            
            <div className="text-center">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fast Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get actionable insights and implementation plan in just 30 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}