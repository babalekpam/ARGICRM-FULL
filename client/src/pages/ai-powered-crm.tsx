import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Target, TrendingUp, Bot, Lightbulb, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const aiFeatures = [
  { title: "Emotional Intelligence", description: "Understand customer emotions and sentiment in real-time", icon: Brain },
  { title: "Predictive Analytics", description: "Forecast sales outcomes and customer behavior patterns", icon: TrendingUp },
  { title: "Intelligent Lead Scoring", description: "Automatically prioritize leads based on conversion probability", icon: Target },
  { title: "Automated Workflows", description: "Smart automation that adapts to your business processes", icon: Zap },
  { title: "AI Chat Assistant", description: "24/7 customer support with natural language processing", icon: Bot },
  { title: "Smart Recommendations", description: "AI-powered suggestions for next best actions", icon: Lightbulb }
];

export default function AiPoweredCrmPage() {
  return (
    <>
      <SEO 
        title="AI-Powered CRM - Emotional Intelligence Customer Management | NODE CRM"
        description="Experience the world's first emotional intelligence CRM with AI automation, predictive analytics, and smart recommendations. Transform customer relationships with NODE CRM."
        canonicalUrl="https://argilette.org/ai-powered-crm"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">NODE CRM</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1 bg-purple-100 text-purple-800">AI-Powered</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              The World's First <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Emotional Intelligence CRM
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Harness the power of artificial intelligence to understand, predict, and enhance every customer interaction. 
              NODE CRM's AI doesn't just manage data—it understands emotions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  Experience AI CRM Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                Watch AI Demo
              </Button>
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Revolutionary AI Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Icon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Emotional Intelligence Features */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardContent className="p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Emotional Intelligence Engine</h2>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">Real-time Sentiment Analysis</h4>
                          <p className="opacity-90">Understand customer emotions in emails, calls, and messages</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">Emotional Journey Mapping</h4>
                          <p className="opacity-90">Track how customer feelings evolve throughout their lifecycle</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">Empathy-Driven Responses</h4>
                          <p className="opacity-90">AI suggests the best communication approach for each customer's emotional state</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-2xl p-8">
                      <Brain className="h-24 w-24 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">98% Accuracy</h3>
                      <p className="opacity-90">In emotion detection and sentiment analysis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Automation Benefits */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Transform Your Business with AI</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">300%</div>
                  <div className="text-gray-600 mb-2">Increase in Lead Quality</div>
                  <p className="text-sm text-gray-500">AI identifies the most promising prospects automatically</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
                  <div className="text-gray-600 mb-2">Reduction in Response Time</div>
                  <p className="text-sm text-gray-500">Smart automation handles routine tasks instantly</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">200%</div>
                  <div className="text-gray-600 mb-2">Improvement in Customer Satisfaction</div>
                  <p className="text-sm text-gray-500">Emotional intelligence drives better relationships</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-gray-600 mb-2">Intelligent Assistance</div>
                  <p className="text-sm text-gray-500">AI never sleeps, always optimizing your processes</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI in Action */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">See AI in Action</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-6 w-6 text-purple-600 mr-3" />
                    Smart Lead Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Our AI analyzes hundreds of data points to predict which leads are most likely to convert, 
                    automatically prioritizing your sales team's efforts.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <strong>Lead Score: 94/100</strong><br />
                      <span className="text-green-600">● High engagement</span><br />
                      <span className="text-blue-600">● Perfect fit profile</span><br />
                      <span className="text-purple-600">● Positive sentiment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-6 w-6 text-blue-600 mr-3" />
                    Emotion Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Analyze customer communications to understand their emotional state and suggest the best response approach.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <strong>Customer Emotion: Frustrated</strong><br />
                      <span className="text-red-600">● Issue escalation detected</span><br />
                      <span className="text-blue-600">● Recommend: Empathetic response</span><br />
                      <span className="text-green-600">● Suggest: Manager involvement</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Industries Using AI CRM */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Industries Transforming with AI CRM</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-xl text-gray-900 mb-3">Healthcare</h3>
                  <p className="text-gray-600 mb-4">Improve patient relationships with empathy-driven communication and predictive care insights.</p>
                  <Badge variant="outline" className="text-xs">40% Better Patient Satisfaction</Badge>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-xl text-gray-900 mb-3">Financial Services</h3>
                  <p className="text-gray-600 mb-4">Detect customer stress and financial concerns early to provide proactive support.</p>
                  <Badge variant="outline" className="text-xs">60% Increase in Customer Retention</Badge>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-xl text-gray-900 mb-3">E-commerce</h3>
                  <p className="text-gray-600 mb-4">Personalize shopping experiences based on customer emotions and buying behavior.</p>
                  <Badge variant="outline" className="text-xs">250% Higher Conversion Rates</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white text-center">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience Emotional Intelligence?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join the AI revolution in customer relationship management. See how emotional intelligence transforms your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                    Start AI-Powered Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  Schedule AI Demo
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-4">No credit card required • Full AI features • 14-day free trial</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}