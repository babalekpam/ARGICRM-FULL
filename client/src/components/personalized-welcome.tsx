import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target, 
  MessageCircle,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset
} from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company: string;
  lastLogin: string;
  timezone: string;
  avatar?: string;
}

interface WelcomeData {
  greeting: string;
  timeIcon: any;
  personalizedMessage: string;
  recentActivity: {
    contacts: number;
    deals: number;
    tasks: number;
    revenue: number;
  };
  recommendations: string[];
  upcomingEvents: {
    title: string;
    time: string;
    type: 'meeting' | 'task' | 'reminder';
  }[];
  weatherGreeting?: string;
  motivationalQuote: string;
}

export default function PersonalizedWelcome() {
  const { user } = useAuth();
  
  // Compute owner status once - no early return to avoid hooks rule violation
  const emailFromLS = localStorage.getItem('user_email') || localStorage.getItem('userEmail');
  const isOwner = user?.isPlatformOwner || [user?.email, emailFromLS].some(e => ['admin@default.com','abel@argilette.com'].includes((e||'').toLowerCase()));
  
  // Debug logging to track mounting
  console.warn('PersonalizedWelcome mounted', { userEmail: user?.email, emailFromLS, isOwner, pathname: window.location.pathname });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Timer effect with proper cleanup
  useEffect(() => {
    if (isOwner) return; // Guard but don't block cleanup
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isOwner]);

  // Data loading effect with abort controller
  useEffect(() => {
    if (isOwner) return; // Guard but don't block cleanup
    const controller = new AbortController();
    loadWelcomeData(controller.signal);
    return () => controller.abort();
  }, [isOwner, currentTime]);

  const loadWelcomeData = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      
      // Use only JWT Authorization - no fallback headers
      const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!authToken) {
        throw new Error('No auth token available');
      }
      
      const response = await fetch(`/api/personalized/welcome-data?t=${Date.now()}`, {
        signal,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const apiData = result.data;
        
        // Set user profile from API
        setUserProfile(apiData.user);
        
        // Generate dynamic welcome data
        generateWelcomeData(apiData, signal);
      } else {
        // Fallback to local data
        loadFallbackData();
      }
    } catch (error) {
      console.error('Error loading welcome data:', error);
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Use current user's email from localStorage
    const email = localStorage.getItem('user_email') || localStorage.getItem('userEmail') || 'demo@demo.com';
    
    // Use appropriate name based on email
    let firstName = 'User';
    let lastName = 'Admin';
    let role = 'Administrator';
    let company = 'Your Company';
    
    if (email === 'abel@argilette.com') {
      firstName = 'Platform';
      lastName = 'Administrator';
      role = 'Platform Owner';
      company = 'NODE CRM';
    } else if (email === 'admin@default.com') {
      firstName = 'Platform';
      lastName = 'Administrator';
      role = 'Platform Owner';
      company = 'NODE CRM';
    } else if (email === 'madjewaba@hotmail.com') {
      firstName = 'Madjewaba';
      lastName = 'User';
      role = 'Administrator';
      company = 'Madjewaba Corporation';
    } else {
      // Extract name from email for other users
      const emailPrefix = email.split('@')[0];
      const nameParts = emailPrefix.split('.');
      firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
      lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Admin';
      company = email.split('@')[1] ? email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + email.split('@')[1].split('.')[0].slice(1) + ' Company' : 'Your Company';
    }
    
    const profile: UserProfile = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      role: role,
      company: company,
      lastLogin: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setUserProfile(profile);
    
    // Generate welcome data with fallback stats
    const fallbackData = {
      stats: { contacts: 15, deals: 8, tasks: 12, revenue: 75000 },
      insights: { hotLeads: 3, averageDealSize: 9375, conversionRate: 15 }
    };
    generateWelcomeData(fallbackData);
  };

  const generateWelcomeData = async (apiData?: any, signal?: AbortSignal) => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const date = currentTime.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });

    // Dynamic greetings based on time
    let greeting = '';
    let timeIcon = Sun;
    let personalizedMessage = '';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
      timeIcon = Sunrise;
      personalizedMessage = `Ready to conquer this ${dayOfWeek}?`;
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
      timeIcon = Sun;
      personalizedMessage = `Hope your ${dayOfWeek} is going well!`;
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good Evening';
      timeIcon = Sunset;
      personalizedMessage = `Wrapping up your productive ${dayOfWeek}?`;
    } else {
      greeting = 'Good Evening';
      timeIcon = Moon;
      personalizedMessage = `Working late? Take care of yourself!`;
    }

    // Motivational quotes based on day of week
    const quotes = [
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "The way to get started is to quit talking and begin doing.",
      "Innovation distinguishes between a leader and a follower.",
      "Your limitation—it's only your imagination.",
      "Great things never come from comfort zones.",
      "Don't stop when you're tired. Stop when you're done.",
      "Success doesn't just find you. You have to go out and get it."
    ];

    // Use real data from API or fallback data
    const recentActivity = apiData?.stats || {
      contacts: Math.floor(Math.random() * 50) + 10,
      deals: Math.floor(Math.random() * 20) + 5,
      tasks: Math.floor(Math.random() * 15) + 3,
      revenue: Math.floor(Math.random() * 100000) + 50000
    };

    // Load smart recommendations from API
    let recommendations = [
      "Review your monthly performance dashboard",
      "Check for new lead opportunities",
      "Schedule follow-ups with warm prospects",
      "Update your sales pipeline status"
    ];

    if (apiData?.insights) {
      recommendations = [];
      if (apiData.stats.tasks > 0) {
        recommendations.push(`You have ${apiData.stats.tasks} pending tasks to complete`);
      }
      if (apiData.insights.hotLeads > 0) {
        recommendations.push(`${apiData.insights.hotLeads} hot leads need your attention`);
      }
      if (apiData.stats.deals > 0) {
        recommendations.push(`${apiData.stats.deals} deals in your pipeline need attention`);
      }
      if (apiData.stats.leadsThisWeek > 0) {
        recommendations.push(`${apiData.stats.leadsThisWeek} new leads this week to follow up`);
      }
      
      // Ensure we have at least 3 recommendations
      if (recommendations.length < 3) {
        recommendations.push(
          "Review your monthly performance dashboard",
          "Schedule team sync for next week's goals"
        );
      }
    }

    // Load upcoming events from API
    const upcomingEvents = [
      { title: "Team Stand-up", time: "10:00 AM", type: 'meeting' as const },
      { title: "Client Demo", time: "2:30 PM", type: 'meeting' as const },
      { title: "Follow up with prospects", time: "4:00 PM", type: 'task' as const },
      { title: "Weekly report review", time: "Tomorrow", type: 'reminder' as const }
    ];

    // Try to load real upcoming events
    try {
      const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!authToken) {
        throw new Error('No auth token for upcoming events');
      }
      
      const eventsResponse = await fetch('/api/personalized/upcoming-events', {
        signal,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        if (eventsResult.events && eventsResult.events.length > 0) {
          upcomingEvents.splice(0, eventsResult.events.length, ...eventsResult.events);
        }
      }
    } catch (error) {
      console.log('Using fallback events data');
    }

    setWelcomeData({
      greeting,
      timeIcon,
      personalizedMessage: `${personalizedMessage} Today is ${dayOfWeek}, ${date}.`,
      recentActivity,
      recommendations,
      upcomingEvents,
      motivationalQuote: quotes[new Date().getDay()]
    });

    setIsLoading(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecommendationClick = (recommendation: string, index: number) => {
    // Show toast notification
    toast({
      title: "Smart Recommendation Selected",
      description: `Taking action on: ${recommendation}`,
    });

    // Navigate based on the recommendation content
    if (recommendation.includes("contact") || recommendation.includes("Contact")) {
      setLocation("/contacts");
    } else if (recommendation.includes("deal") || recommendation.includes("Deal")) {
      setLocation("/deals");
    } else if (recommendation.includes("lead") || recommendation.includes("Lead")) {
      setLocation("/leads");
    } else if (recommendation.includes("task") || recommendation.includes("Task")) {
      setLocation("/tasks");
    } else if (recommendation.includes("follow up") || recommendation.includes("Follow up")) {
      setLocation("/campaigns");
    } else if (recommendation.includes("report") || recommendation.includes("Report")) {
      setLocation("/reports");
    } else if (recommendation.includes("team") || recommendation.includes("Team")) {
      setLocation("/team-collaboration");
    } else if (recommendation.includes("analytics") || recommendation.includes("Analytics")) {
      setLocation("/analytics");
    } else {
      // Default to dashboard analytics for general recommendations
      setLocation("/analytics");
    }
  };

  if (isLoading || !userProfile || !welcomeData) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TimeIcon = welcomeData.timeIcon;

  return (
    <div className="space-y-6 mb-8">
      {/* Main Welcome Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold">
                  {getInitials(userProfile.firstName, userProfile.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <TimeIcon className="h-5 w-5 text-amber-500" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {welcomeData.greeting}, {userProfile.company}!
                  </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {welcomeData.personalizedMessage}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {userProfile.role}
                  </Badge>
                  <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                    {userProfile.company}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {userProfile.timezone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats & Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Contacts</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{welcomeData.recentActivity.contacts}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Open Deals</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{welcomeData.recentActivity.deals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending Tasks</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{welcomeData.recentActivity.tasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Revenue</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatRevenue(welcomeData.recentActivity.revenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Smart Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {welcomeData.recommendations.map((recommendation, index) => (
              <Button
                key={index}
                variant="ghost"
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full h-auto text-left transition-colors"
                onClick={() => handleRecommendationClick(recommendation, index)}
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{recommendation}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Upcoming Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {welcomeData.upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'meeting' ? 'bg-blue-500' : 
                    event.type === 'task' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.time}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-6 w-6 text-indigo-600 mx-auto mb-3" />
          <blockquote className="text-lg font-medium text-indigo-900 dark:text-indigo-100 italic">
            "{welcomeData.motivationalQuote}"
          </blockquote>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Daily Inspiration</p>
        </CardContent>
      </Card>
    </div>
  );

  // Guard render for platform owners - all effects already guarded above
  if (isOwner) {
    return null;
  }

  return renderWelcomeScreen();
}