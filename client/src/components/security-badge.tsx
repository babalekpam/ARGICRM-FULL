import { Shield, Lock, Eye, Server, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityBadge() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "AES-256-GCM encryption for all sensitive data",
      status: "active"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant infrastructure and practices",
      status: "active"
    },
    {
      icon: Eye,
      title: "Audit Logging",
      description: "Complete audit trail of all data access",
      status: "active"
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Rate limiting and DDoS protection",
      status: "active"
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-green-800 dark:text-green-200">
            <Shield className="h-5 w-5 mr-2" />
            Enterprise-Grade Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                    <Icon className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{feature.title}</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 dark:text-green-300">
                Your data is protected with bank-level security
              </span>
              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                Secure
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}