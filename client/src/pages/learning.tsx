import { useState, useEffect } from "react";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Video, 
  Users, 
  Award, 
  PlayCircle,
  FileText,
  Calendar,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Target,
  Clock,
  Lock,
  User
} from "lucide-react";

interface LearningResource {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  badge: string;
  duration: string;
  level: string;
  format: string;
  topics: string[];
  completion: string;
}

const learningResources: LearningResource[] = [
  {
    id: 'crm-fundamentals',
    title: "CRM Fundamentals Masterclass",
    description: "Complete introduction to customer relationship management with hands-on examples",
    icon: BookOpen,
    category: "Core Training",
    badge: "Bestseller",
    duration: "6 hours",
    level: "Beginner",
    format: "Interactive Course",
    topics: [
      "CRM Strategy & Planning",
      "Customer Data Management",
      "Sales Pipeline Optimization",
      "Customer Segmentation",
      "ROI Measurement",
      "Implementation Best Practices"
    ],
    completion: "95% completion rate"
  },
  {
    id: 'emotional-intelligence',
    title: "Emotional Intelligence in Business",
    description: "Master the art of understanding and leveraging emotional insights for business success",
    icon: Target,
    category: "AI & Analytics",
    badge: "Advanced",
    duration: "8 hours",
    level: "Intermediate",
    format: "Video Series",
    topics: [
      "Emotion Recognition Techniques",
      "Customer Sentiment Analysis",
      "Emotional Trigger Identification",
      "Empathy-Driven Communication",
      "Emotional Data Interpretation",
      "AI-Powered Insights"
    ],
    completion: "88% completion rate"
  },
  {
    id: 'sales-automation',
    title: "Sales Automation Excellence",
    description: "Streamline your sales processes with intelligent automation workflows",
    icon: Sparkles,
    category: "Automation",
    badge: "Popular",
    duration: "4 hours",
    level: "Intermediate",
    format: "Workshop",
    topics: [
      "Workflow Design Principles",
      "Lead Scoring Automation",
      "Email Sequence Creation",
      "Task Automation Setup",
      "Performance Monitoring",
      "Integration Strategies"
    ],
    completion: "92% completion rate"
  },
  {
    id: 'analytics-mastery',
    title: "Advanced Analytics & Reporting",
    description: "Transform data into actionable insights with advanced analytics techniques",
    icon: Users,
    category: "Analytics",
    badge: "Expert Level",
    duration: "10 hours",
    level: "Advanced",
    format: "Certification Course",
    topics: [
      "Data Visualization Mastery",
      "Predictive Analytics",
      "Custom Report Building",
      "KPI Dashboard Creation",
      "Trend Analysis",
      "Business Intelligence"
    ],
    completion: "85% completion rate"
  },
  {
    id: 'customer-success',
    title: "Customer Success Strategies",
    description: "Build lasting customer relationships and maximize lifetime value",
    icon: Award,
    category: "Customer Success",
    badge: "Trending",
    duration: "5 hours",
    level: "Intermediate",
    format: "Case Study Series",
    topics: [
      "Customer Onboarding Excellence",
      "Retention Strategy Development",
      "Upselling & Cross-selling",
      "Customer Health Scoring",
      "Churn Prevention",
      "Success Metrics"
    ],
    completion: "90% completion rate"
  },
  {
    id: 'team-collaboration',
    title: "Team Collaboration & Leadership",
    description: "Foster effective teamwork and leadership in customer-facing roles",
    icon: Users,
    category: "Leadership",
    badge: "New Release",
    duration: "6 hours",
    level: "All Levels",
    format: "Interactive Workshop",
    topics: [
      "Team Communication Excellence",
      "Collaborative Problem Solving",
      "Leadership in Customer Success",
      "Cross-functional Coordination",
      "Performance Management",
      "Change Management"
    ],
    completion: "87% completion rate"
  }
];

const categories = [
  'All Courses',
  'Core Training',
  'AI & Analytics',
  'Automation',
  'Analytics',
  'Customer Success',
  'Leadership'
];

export default function LearningPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Courses');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  const { user, isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  // Check authentication status on component mount
  useEffect(() => {
    // For learning page, we require explicit authentication regardless of existing session
    // This implements the universal authentication requirement for learning content
    if (!isAuthenticated) {
      setShowLoginForm(true);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      const success = await login(loginEmail, loginPassword);
      
      if (success) {
        setShowLoginForm(false);
        toast({
          title: "Authentication Successful",
          description: "Welcome to ARGILETTE Learning Center",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error", 
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const filteredResources = selectedCategory === 'All Courses' 
    ? learningResources 
    : learningResources.filter(resource => resource.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getResourceIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const handleStartLearning = () => {
    // Scroll to the courses section since user is already authenticated
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show success message
    toast({
      title: "Welcome to Learning!",
      description: "Browse our courses below to start your journey.",
    });
  };

  const handleCourseStart = (courseId: string, courseTitle: string) => {
    // Show enrollment confirmation
    toast({
      title: "Course Enrolled!",
      description: `You've successfully enrolled in ${courseTitle}. Opening course...`,
    });
    
    // Open course in new tab after short delay
    setTimeout(() => {
      window.open(`/course/${courseId}`, '_blank');
    }, 1000);
  };

  const handleCoursePreview = (courseId: string, courseTitle: string) => {
    toast({
      title: "Course Preview",
      description: `Opening preview for ${courseTitle}...`,
    });
    
    setTimeout(() => {
      window.open(`/course/${courseId}?preview=true`, '_blank');
    }, 500);
  };

  const handleScheduleDemo = () => {
    window.location.href = '/request-demo';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  // Show authentication form if not authenticated
  if (showLoginForm) {
    return (
      <LandingLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Access Required
              </CardTitle>
              <CardDescription className="text-gray-600">
                Please authenticate to access ARGILETTE Learning Center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Authenticating..." : "Access Learning Center"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          {/* Background Technology Image */}
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop&crop=center" 
              alt="Modern learning environment with students using laptops" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Authentication Status */}
            {isAuthenticated && user && (
              <div className="flex justify-end mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                  <User className="h-4 w-4 text-green-400" />
                  <span className="text-green-200 text-sm">
                    Authenticated as {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('userEmail');
                      window.location.reload();
                    }}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            )}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Learning & Development Center
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Expert Training • Practical Skills • Continuous Growth
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  50+ Courses
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                  <Award className="h-4 w-4 mr-2" />
                  Industry Certified
                </Badge>
                <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Expert Instructors
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                onClick={handleStartLearning}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Learning Journey
              </Button>
            </div>
          </div>
        </div>

        {/* Learning Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
                <Badge variant="secondary" className="ml-2">
                  {category === 'All Courses' 
                    ? learningResources.length 
                    : learningResources.filter(r => r.category === category).length
                  }
                </Badge>
              </button>
            ))}
          </div>

          {/* Featured Learning Technology Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Advanced Learning Technology Platform
                </h3>
                <p className="text-gray-600 mb-6">
                  Master CRM skills with our state-of-the-art learning platform featuring interactive courses, hands-on labs, and expert-led training sessions designed for all skill levels.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Interactive Video Courses
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Hands-on Lab Exercises
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Industry Certifications
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Expert Instructors
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop&crop=center" 
                  alt="People learning with modern laptops and technology" 
                  className="rounded-lg shadow-2xl w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-800">Interactive Learning</div>
                    <div className="text-xs text-gray-600">Hands-on technology training</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Resources Grid */}
          <div id="courses-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      {getResourceIcon(resource.icon)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700"
                    >
                      {resource.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{resource.duration}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={getLevelColor(resource.level)}
                      >
                        {resource.level}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{resource.format}</span>
                      <span className="text-green-600 font-medium">{resource.completion}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Course Topics</span>
                      <div className="space-y-1">
                        {resource.topics.slice(0, 4).map((topic, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                            {topic}
                          </div>
                        ))}
                        {resource.topics.length > 4 && (
                          <div className="text-sm text-purple-600 font-medium">
                            +{resource.topics.length - 4} more topics
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
                        onClick={() => handleCourseStart(resource.id, resource.title)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Course
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 hover:bg-purple-50 transition-colors"
                        onClick={() => handleCoursePreview(resource.id, resource.title)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="py-12">
                <h3 className="text-2xl font-bold mb-4">Ready to Master Your CRM Skills?</h3>
                <p className="text-lg mb-6 text-purple-100">
                  Join thousands of professionals who've advanced their careers with our expert training
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={handleStartLearning}
                  >
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Start Learning Today
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={handleScheduleDemo}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}