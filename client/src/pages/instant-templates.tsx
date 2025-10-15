import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Rocket, Building, Users, Calendar, Star, MessageSquare } from "lucide-react";

const templates = [
  {
    id: "lead-generation",
    title: "Lead Generation Template",
    description: "Professional lead capture form with modern design",
    url: "/template/lead-generation",
    color: "bg-blue-500",
    icon: Users,
    features: ["Contact capture", "Lead scoring", "CRM integration"],
    ready: true
  },
  {
    id: "product-launch",
    title: "Product Launch Template", 
    description: "Pre-order and early access campaign page",
    url: "/template/product-launch",
    color: "bg-purple-500",
    icon: Star,
    features: ["Pre-order forms", "Countdown timer", "Social proof"],
    ready: true
  },
  {
    id: "event-registration",
    title: "Event Registration Template",
    description: "Event signup with calendar integration",
    url: "/template/event-registration", 
    color: "bg-green-500",
    icon: Calendar,
    features: ["Event signup", "Calendar sync", "Ticket management"],
    ready: true
  },
  {
    id: "b2b-enterprise",
    title: "B2B Enterprise Template",
    description: "Enterprise lead qualification system",
    url: "/template/b2b-lead",
    color: "bg-orange-500",
    icon: Building,
    features: ["Qualification forms", "Enterprise validation", "Demo booking"],
    ready: true
  },
  {
    id: "saas-trial",
    title: "SaaS Trial Template",
    description: "Free trial signup and conversion",
    url: "/template/saas-trial",
    color: "bg-cyan-500", 
    icon: Rocket,
    features: ["Trial signup", "Feature showcase", "Conversion tracking"],
    ready: true
  },
  {
    id: "consultation",
    title: "Consultation Booking Template",
    description: "Professional service consultation booking",
    url: "/template/consultation",
    color: "bg-indigo-500",
    icon: MessageSquare,
    features: ["Consultation booking", "Calendar integration", "Service matching"],
    ready: true
  }
];

export default function InstantTemplates() {
  const openTemplate = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Ready-to-Use Templates
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Professional landing page templates that are immediately accessible. Click "Use Now" to open any template in a new tab and start capturing leads instantly.
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✅ All 6 Templates Ready - No Setup Required
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {templates.map((template) => {
            const IconComponent = template.icon;
            
            return (
              <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-purple-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${template.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ready
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {template.title}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">FEATURES</h4>
                      <ul className="space-y-1">
                        {template.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button 
                        onClick={() => openTemplate(template.url)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        🚀 Use Now (Opens in New Tab)
                      </Button>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Instantly accessible - no login required
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                How to Use These Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h4 className="font-semibold">Click "Use Now"</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Each template opens in a new tab ready for immediate use
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h4 className="font-semibold">Start Capturing Leads</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Templates are pre-connected to your CRM system
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <h4 className="font-semibold">View in Dashboard</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All leads automatically appear in your CRM dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}