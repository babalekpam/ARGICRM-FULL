import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Clock, Users, Star, Gift } from "lucide-react";

export default function ProductLaunchTemplate() {
  const [email, setEmail] = useState('');
  const [isPreordered, setIsPreordered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 15,
    hours: 8,
    minutes: 42,
    seconds: 30
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePreorder = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Pre-order submitted:', email);
    
    try {
      const response = await fetch('/api/templates/product-launch/preorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Pre-order submitted successfully:', result);
        setIsPreordered(true);
        
        // Reset after 3 seconds
        setTimeout(() => {
          setIsPreordered(false);
          setEmail('');
        }, 3000);
      } else {
        console.error('Failed to submit pre-order');
        setIsPreordered(true);
        setTimeout(() => {
          setIsPreordered(false);
          setEmail('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting pre-order:', error);
      setIsPreordered(true);
      setTimeout(() => {
        setIsPreordered(false);
        setEmail('');
      }, 3000);
    }
  };

  if (isPreordered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Gift className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pre-Order Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You're now on the exclusive early access list. We'll notify you the moment 
              ARGILETTE 2.0 is ready to launch!
            </p>
            <Badge className="bg-purple-100 text-purple-800">
              Early Bird Discount Applied: 40% OFF
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-lg py-2 px-4">
            🚀 Product Launch Event
          </Badge>
          
          <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            NODE CRM 2.0
            <br />
            <span className="text-purple-600 dark:text-purple-400">Is Coming Soon</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            The most advanced emotional intelligence CRM platform ever built. 
            Experience the future of customer relationships with AI that truly understands emotions.
          </p>

          {/* Countdown Timer */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Launch Countdown
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {timeLeft.days.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500">Days</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500">Hours</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500">Minutes</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-500">Seconds</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pre-order Form */}
          <Card className="max-w-md mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Secure Your Early Access
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Join the waitlist and save 40% on launch day
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreorder} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Your business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full text-lg py-6 bg-purple-600 hover:bg-purple-700">
                  <Package className="mr-2 h-5 w-5" />
                  Pre-Order Now - 40% OFF
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Limited time offer. No payment required until launch.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* What's New Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Revolutionary New Features
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              ARGILETTE 2.0 introduces breakthrough capabilities that will transform 
              how you connect with customers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Real-Time Emotion Detection
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Understand customer emotions during live conversations with advanced AI analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Predictive Customer Behavior
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Anticipate customer needs and actions before they happen with ML algorithms.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Automated Emotional Responses
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate personalized responses that match your customer's emotional state.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Join 15,000+ Companies Already Using ARGILETTE
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">15,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.5M+</div>
              <div className="text-gray-600 dark:text-gray-400">Customer Interactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">98%</div>
              <div className="text-gray-600 dark:text-gray-400">Customer Satisfaction</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <blockquote className="text-xl italic text-gray-700 dark:text-gray-300 mb-4">
              "NODE CRM has revolutionized how we understand our customers. The emotional 
              intelligence features have increased our customer satisfaction by 60%."
            </blockquote>
            <cite className="text-gray-600 dark:text-gray-400">
              — Sarah Johnson, CEO of TechCorp
            </cite>
          </div>
        </div>
      </div>
    </div>
  );
}