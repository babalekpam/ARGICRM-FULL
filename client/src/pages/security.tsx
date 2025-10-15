import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/layout";
import Logo from "@/components/logo";
import { 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  Database, 
  Users, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Key
} from "lucide-react";

export default function SecurityPage() {
  const securityMetrics = [
    { label: "Data Encryption", score: 100, status: "Excellent" },
    { label: "Access Control", score: 95, status: "Strong" },
    { label: "Audit Compliance", score: 98, status: "Excellent" },
    { label: "Network Security", score: 92, status: "Strong" }
  ];

  const complianceStandards = [
    { name: "SOC 2 Type II", status: "Compliant", icon: CheckCircle, color: "text-green-600" },
    { name: "GDPR", status: "Compliant", icon: CheckCircle, color: "text-green-600" },
    { name: "CCPA", status: "Compliant", icon: CheckCircle, color: "text-green-600" },
    { name: "HIPAA Ready", status: "Available", icon: Shield, color: "text-blue-600" },
    { name: "ISO 27001", status: "In Progress", icon: Clock, color: "text-yellow-600" }
  ];

  const securityFeatures = [
    {
      category: "Data Protection",
      icon: Database,
      features: [
        "AES-256-GCM encryption at rest",
        "TLS 1.3 encryption in transit",
        "Zero-knowledge architecture",
        "Automated data backup with encryption",
        "Secure data deletion and retention policies"
      ]
    },
    {
      category: "Access Control", 
      icon: Users,
      features: [
        "Multi-factor authentication (MFA)",
        "Role-based access control (RBAC)",
        "Single sign-on (SSO) integration",
        "Session management and timeout",
        "IP whitelisting and geofencing"
      ]
    },
    {
      category: "Infrastructure Security",
      icon: Server,
      features: [
        "DDoS protection and rate limiting",
        "Web application firewall (WAF)",
        "Intrusion detection and prevention",
        "24/7 security monitoring",
        "Automated vulnerability scanning"
      ]
    },
    {
      category: "Compliance & Auditing",
      icon: FileText,
      features: [
        "Complete audit trail logging",
        "Real-time security monitoring",
        "Compliance reporting dashboard",
        "Data privacy impact assessments",
        "Regular third-party security audits"
      ]
    }
  ];

  const threats = [
    { name: "SQL Injection", status: "Protected", level: "High" },
    { name: "Cross-Site Scripting (XSS)", status: "Protected", level: "High" },
    { name: "Cross-Site Request Forgery", status: "Protected", level: "Medium" },
    { name: "Data Breaches", status: "Protected", level: "Critical" },
    { name: "DDoS Attacks", status: "Protected", level: "High" },
    { name: "Malware/Ransomware", status: "Protected", level: "Critical" }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Logo size="md" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Center</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enterprise-grade security protecting your data
            </p>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {securityMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <Badge variant={metric.score >= 95 ? "default" : "secondary"}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metric.score}%</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {securityFeatures.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="h-5 w-5 mr-2 text-blue-600" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Compliance Standards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Compliance & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {complianceStandards.map((standard) => {
                const Icon = standard.icon;
                return (
                  <div key={standard.name} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${standard.color}`} />
                    <div className="font-medium text-sm">{standard.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{standard.status}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Threat Protection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Threat Protection Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {threats.map((threat) => (
                <div key={threat.name} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{threat.name}</div>
                    <div className="text-xs text-gray-500">Threat Level: {threat.level}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {threat.status}
                    </Badge>
                    <Shield className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Guarantees */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
              <Key className="h-5 w-5 mr-2" />
              Security Guarantees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">99.9% Uptime SLA</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Guaranteed availability with redundant infrastructure
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Zero Data Loss</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automated backups and disaster recovery procedures
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Global Data Residency</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose where your data is stored and processed
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Incident Response</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      24/7 security operations center with 15-minute response time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}