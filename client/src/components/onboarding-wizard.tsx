import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Building2, 
  Target, 
  Users, 
  Settings,
  CheckCircle,
  Plus,
  X,
  Rocket,
  Clock,
  Calendar,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, formatCurrencyDisplay } from "@shared/currencies";

interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
  };
  companyInfo: {
    companyName: string;
    industry: string;
    companySize: string;
    website: string;
    address: string;
  };
  businessGoals: {
    primaryGoals: string[];
    expectedUsers: string;
    currentChallenges: string;
    timeline: string;
  };
  teamSetup: {
    inviteTeam: boolean;
    teamMembers: Array<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  preferences: {
    timezone: string;
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      browser: boolean;
    };
  };
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const STEPS = [
  { id: 1, title: "Personal Info", icon: User, description: "Tell us about yourself" },
  { id: 2, title: "Company Details", icon: Building2, description: "Your business information" },
  { id: 3, title: "Business Goals", icon: Target, description: "What do you want to achieve?" },
  { id: 4, title: "Team Setup", icon: Users, description: "Invite your team members" },
  { id: 5, title: "Preferences", icon: Settings, description: "Customize your experience" }
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing",
  "Real Estate", "Consulting", "Marketing", "Non-profit", "Other"
];

const COMPANY_SIZES = [
  "1-10 employees", "11-50 employees", "51-200 employees", 
  "201-500 employees", "501-1000 employees", "1000+ employees"
];

const PRIMARY_GOALS = [
  "Increase sales", "Improve customer service", "Streamline operations",
  "Better team collaboration", "Data insights", "Process automation",
  "Customer retention", "Lead generation"
];

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"
];

// Removed local CURRENCIES array - now using comprehensive list from shared constants
const LANGUAGES = ["English", "Spanish", "French", "German", "Chinese", "Japanese"];

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    personalInfo: { firstName: "", lastName: "", jobTitle: "", phone: "" },
    companyInfo: { companyName: "", industry: "", companySize: "", website: "", address: "" },
    businessGoals: { primaryGoals: [], expectedUsers: "", currentChallenges: "", timeline: "" },
    teamSetup: { inviteTeam: false, teamMembers: [] },
    preferences: {
      timezone: "America/New_York",
      currency: "USD",
      language: "English",
      notifications: { email: true, sms: false, browser: true }
    }
  });
  const [newTeamMember, setNewTeamMember] = useState({ name: "", email: "", role: "" });
  const { toast } = useToast();

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (section: keyof OnboardingData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = data.businessGoals.primaryGoals;
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    
    handleInputChange('businessGoals', 'primaryGoals', newGoals);
  };

  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.email && newTeamMember.role) {
      setData(prev => ({
        ...prev,
        teamSetup: {
          ...prev.teamSetup,
          teamMembers: [...prev.teamSetup.teamMembers, { ...newTeamMember }]
        }
      }));
      setNewTeamMember({ name: "", email: "", role: "" });
      toast({
        title: "Team member added",
        description: `${newTeamMember.name} will receive an invitation`,
      });
    }
  };

  const removeTeamMember = (index: number) => {
    setData(prev => ({
      ...prev,
      teamSetup: {
        ...prev.teamSetup,
        teamMembers: prev.teamSetup.teamMembers.filter((_, i) => i !== index)
      }
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.personalInfo.firstName && data.personalInfo.lastName && data.personalInfo.jobTitle;
      case 2:
        return data.companyInfo.companyName && data.companyInfo.industry && data.companyInfo.companySize;
      case 3:
        return data.businessGoals.primaryGoals.length > 0 && data.businessGoals.expectedUsers;
      case 4:
        return true; // Team setup is optional
      case 5:
        return true; // Preferences have defaults
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Let's start with some basic information about you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={data.personalInfo.jobTitle}
                onChange={(e) => handleInputChange('personalInfo', 'jobTitle', e.target.value)}
                placeholder="Sales Manager"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold">Company Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Tell us about your organization</p>
            </div>

            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={data.companyInfo.companyName}
                onChange={(e) => handleInputChange('companyInfo', 'companyName', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select 
                  value={data.companyInfo.industry} 
                  onValueChange={(value) => handleInputChange('companyInfo', 'industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <Select 
                  value={data.companyInfo.companySize} 
                  onValueChange={(value) => handleInputChange('companyInfo', 'companySize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={data.companyInfo.website}
                onChange={(e) => handleInputChange('companyInfo', 'website', e.target.value)}
                placeholder="https://www.acme.com"
              />
            </div>

            <div>
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={data.companyInfo.address}
                onChange={(e) => handleInputChange('companyInfo', 'address', e.target.value)}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold">Business Goals</h2>
              <p className="text-gray-600 dark:text-gray-400">What do you want to achieve with NODE CRM?</p>
            </div>

            <div>
              <Label>Primary Goals * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {PRIMARY_GOALS.map(goal => (
                  <div
                    key={goal}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      data.businessGoals.primaryGoals.includes(goal)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleGoalToggle(goal)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={data.businessGoals.primaryGoals.includes(goal)}
                        onChange={() => {}} // Controlled by parent click
                      />
                      <span className="text-sm">{goal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expectedUsers">Expected Number of Users *</Label>
              <Select 
                value={data.businessGoals.expectedUsers} 
                onValueChange={(value) => handleInputChange('businessGoals', 'expectedUsers', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 users</SelectItem>
                  <SelectItem value="6-15">6-15 users</SelectItem>
                  <SelectItem value="16-50">16-50 users</SelectItem>
                  <SelectItem value="51-100">51-100 users</SelectItem>
                  <SelectItem value="100+">100+ users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="challenges">Current Business Challenges</Label>
              <Textarea
                id="challenges"
                value={data.businessGoals.currentChallenges}
                onChange={(e) => handleInputChange('businessGoals', 'currentChallenges', e.target.value)}
                placeholder="Describe any challenges you're hoping to solve..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="timeline">Implementation Timeline</Label>
              <Select 
                value={data.businessGoals.timeline} 
                onValueChange={(value) => handleInputChange('businessGoals', 'timeline', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Get started immediately</SelectItem>
                  <SelectItem value="1-week">Within 1 week</SelectItem>
                  <SelectItem value="1-month">Within 1 month</SelectItem>
                  <SelectItem value="3-months">Within 3 months</SelectItem>
                  <SelectItem value="planning">Still planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-orange-600 mb-4" />
              <h2 className="text-2xl font-bold">Team Setup</h2>
              <p className="text-gray-600 dark:text-gray-400">Invite your team members to get started together</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="inviteTeam"
                checked={data.teamSetup.inviteTeam}
                onCheckedChange={(checked) => handleInputChange('teamSetup', 'inviteTeam', checked)}
              />
              <Label htmlFor="inviteTeam">I want to invite team members now</Label>
            </div>

            {data.teamSetup.inviteTeam && (
              <div className="space-y-4">
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="memberName">Name</Label>
                    <Input
                      id="memberName"
                      value={newTeamMember.name}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="memberEmail">Email</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      value={newTeamMember.email}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="memberRole">Role</Label>
                    <Select 
                      value={newTeamMember.role} 
                      onValueChange={(value) => setNewTeamMember(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={addTeamMember} className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>

                {data.teamSetup.teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Team Members to Invite</Label>
                    {data.teamSetup.teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email} • {member.role}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold">Preferences</h2>
              <p className="text-gray-600 dark:text-gray-400">Customize your NODE CRM experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={data.preferences.timezone} 
                  onValueChange={(value) => handleInputChange('preferences', 'timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={data.preferences.currency} 
                  onValueChange={(value) => handleInputChange('preferences', 'currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">CNY (¥) - Chinese Yuan</SelectItem>
                    <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                    
                    {CURRENCIES.filter(c => c.region === "Africa").map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {formatCurrencyDisplay(currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select 
                  value={data.preferences.language} 
                  onValueChange={(value) => handleInputChange('preferences', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notification Preferences</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailNotifications"
                    checked={data.preferences.notifications.email}
                    onCheckedChange={(checked) => 
                      setData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: { ...prev.preferences.notifications, email: !!checked }
                        }
                      }))
                    }
                  />
                  <Label htmlFor="emailNotifications">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsNotifications"
                    checked={data.preferences.notifications.sms}
                    onCheckedChange={(checked) => 
                      setData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: { ...prev.preferences.notifications, sms: !!checked }
                        }
                      }))
                    }
                  />
                  <Label htmlFor="smsNotifications">SMS notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="browserNotifications"
                    checked={data.preferences.notifications.browser}
                    onCheckedChange={(checked) => 
                      setData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: { ...prev.preferences.notifications, browser: !!checked }
                        }
                      }))
                    }
                  />
                  <Label htmlFor="browserNotifications">Browser notifications</Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to NODE CRM
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Let's get your CRM set up in just a few steps
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onSkip}>
              Skip Setup
            </Button>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep === STEPS.length ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Complete Setup
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next Step
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Estimated time remaining: {Math.max(1, 6 - currentStep)} minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}