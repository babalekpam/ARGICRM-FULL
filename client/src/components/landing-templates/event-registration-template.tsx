import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Calendar, MapPin, Users, Clock, Gift, Star } from "lucide-react";

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  ticketType: string;
}

export default function EventRegistrationTemplate() {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    ticketType: ''
  });
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Event registration submitted:', formData);
    
    try {
      const response = await fetch('/api/templates/event-registration/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Event registration successful:', result);
        setIsRegistered(true);
        
        // Reset after 4 seconds
        setTimeout(() => {
          setIsRegistered(false);
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            jobTitle: '',
            ticketType: ''
          });
        }, 4000);
      } else {
        console.error('Failed to register for event');
        setIsRegistered(true);
        setTimeout(() => {
          setIsRegistered(false);
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            jobTitle: '',
            ticketType: ''
          });
        }, 4000);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      setIsRegistered(true);
      setTimeout(() => {
        setIsRegistered(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          jobTitle: '',
          ticketType: ''
        });
      }, 4000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20 flex items-center justify-center">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              You're Registered!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for registering for the ARGILETTE AI Summit 2025. 
              Your ticket confirmation and event details have been sent to your email.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-green-800 dark:text-green-400 font-medium">
                🎟️ Ticket Type: {formData.ticketType}
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                Check your email for calendar invite and networking app access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-lg py-2 px-4">
            🎯 Exclusive Industry Event
          </Badge>
          
          <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            ARGILETTE AI Summit
            <br />
            <span className="text-green-600 dark:text-green-400">2025</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Join 500+ industry leaders, AI researchers, and business innovators for the most 
            anticipated event in emotional AI and customer relationship technology.
          </p>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Date & Time</h3>
                <p className="text-gray-600 dark:text-gray-400">March 15-16, 2025</p>
                <p className="text-gray-600 dark:text-gray-400">9:00 AM - 6:00 PM PST</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
                <p className="text-gray-600 dark:text-gray-400">Moscone Center</p>
                <p className="text-gray-600 dark:text-gray-400">San Francisco, CA</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Attendees</h3>
                <p className="text-gray-600 dark:text-gray-400">500+ Leaders</p>
                <p className="text-gray-600 dark:text-gray-400">50+ Speakers</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Event Info */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-6 w-6 text-green-600 mr-2" />
                  Event Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Day 1: AI Innovation Keynotes</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Industry leaders share breakthrough advances in emotional AI
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Day 2: Hands-on Workshops</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Interactive sessions on implementing AI in customer relationships
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Featured Speakers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-6 w-6 text-green-600 mr-2" />
                  Featured Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-green-600">DR</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Dr. Sarah Chen</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Research Director, Stanford</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-green-600">MJ</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Michael Johnson</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CTO, TechInnovate Corp</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-green-600">LP</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Lisa Patel</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">VP Product, EmotionAI Inc</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:pl-8">
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Reserve Your Spot
                </CardTitle>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Limited to 500 attendees - Register now to secure your place
                </p>
              </CardHeader>
              <CardContent>
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
                    placeholder="Business Email *"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    name="company"
                    placeholder="Company Name *"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    name="jobTitle"
                    placeholder="Job Title"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                  />
                  
                  <Select value={formData.ticketType} onValueChange={(value) => handleSelectChange('ticketType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ticket Type *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Admission - $299</SelectItem>
                      <SelectItem value="premium">Premium Pass - $599</SelectItem>
                      <SelectItem value="vip">VIP Experience - $999</SelectItem>
                      <SelectItem value="student">Student Discount - $99</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button type="submit" className="w-full text-lg py-6 bg-green-600 hover:bg-green-700">
                    <Gift className="mr-2 h-5 w-5" />
                    Register Now
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500">
                      Early bird pricing expires March 1st
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>✓ Networking App Access</span>
                      <span>✓ Lunch Included</span>
                      <span>✓ Certificate</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Urgency indicator */}
            <Card className="mt-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 text-center">
                <p className="text-orange-800 dark:text-orange-400 font-medium">
                  🔥 Only 47 spots remaining!
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  This event sells out every year. Register today to avoid disappointment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* What You'll Learn Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What You'll Learn
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Two days packed with actionable insights, networking opportunities, 
              and hands-on experience with cutting-edge AI technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Emotional AI Implementation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Learn to integrate emotional intelligence into your existing CRM workflows.
              </p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Customer Psychology
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Understand the science behind customer emotions and decision-making.
              </p>
            </div>
            
            <div className="text-center">
              <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ROI Optimization
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Strategies to measure and maximize return on your CRM investments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}