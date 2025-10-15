import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@shared/currencies";
import { 
  Factory, 
  Pickaxe, 
  Building2, 
  Truck, 
  Wheat, 
  Leaf, 
  Globe, 
  TrendingUp,
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Download,
  Upload,
  Zap
} from "lucide-react";

interface IndustrySolution {
  id: string;
  name: string;
  description: string;
  icon: any;
  workflows: string[];
  compliance: string[];
  features: string[];
  templates: number;
  adoptionRate: number;
  roi: string;
}

interface ComplianceModule {
  id: string;
  name: string;
  region: string;
  requirements: string[];
  automatedChecks: number;
  lastUpdated: string;
  status: 'active' | 'pending' | 'outdated';
}

const INDUSTRY_SOLUTIONS: IndustrySolution[] = [
  {
    id: 'agriculture',
    name: 'Agriculture & Agribusiness',
    description: 'Specialized CRM for farming, commodity trading, and agricultural supply chains',
    icon: Wheat,
    workflows: ['Crop Cycle Management', 'Commodity Price Tracking', 'Seasonal Planning', 'Supplier Management'],
    compliance: ['Organic Certification', 'Export Regulations', 'Food Safety Standards'],
    features: ['Weather Integration', 'Yield Prediction', 'Market Price Alerts', 'Seasonal Workflows'],
    templates: 12,
    adoptionRate: 89,
    roi: '340%'
  },
  {
    id: 'mining',
    name: 'Mining & Extraction',
    description: 'Comprehensive solution for mining operations, equipment, and regulatory compliance',
    icon: Pickaxe,
    workflows: ['Equipment Maintenance', 'Safety Compliance', 'Production Tracking', 'Environmental Monitoring'],
    compliance: ['Environmental Impact', 'Worker Safety', 'Export Licenses', 'Resource Extraction Permits'],
    features: ['Safety Incident Tracking', 'Equipment IoT Integration', 'Production Analytics', 'Compliance Dashboards'],
    templates: 15,
    adoptionRate: 76,
    roi: '450%'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'End-to-end manufacturing CRM with supply chain and quality management',
    icon: Factory,
    workflows: ['Production Planning', 'Quality Control', 'Supply Chain Management', 'Inventory Optimization'],
    compliance: ['ISO 9001', 'Quality Standards', 'Export Documentation', 'Worker Safety'],
    features: ['Production Analytics', 'Quality Tracking', 'Supplier Scorecards', 'Inventory Alerts'],
    templates: 18,
    adoptionRate: 82,
    roi: '380%'
  },
  {
    id: 'trading',
    name: 'Import/Export Trading',
    description: 'International trade management with currency, logistics, and compliance tracking',
    icon: Globe,
    workflows: ['Shipment Tracking', 'Currency Hedging', 'Document Management', 'Customs Clearance'],
    compliance: ['Export Licenses', 'Customs Regulations', 'International Trade Laws', 'Anti-Money Laundering'],
    features: ['Multi-Currency Support', 'Logistics Integration', 'Document Automation', 'Trade Finance'],
    templates: 22,
    adoptionRate: 91,
    roi: '520%'
  },
  {
    id: 'finance',
    name: 'Financial Services',
    description: 'Specialized CRM for banks, insurance, and financial institutions',
    icon: Building2,
    workflows: ['Loan Processing', 'Risk Assessment', 'Compliance Monitoring', 'Customer Onboarding'],
    compliance: ['Banking Regulations', 'KYC/AML', 'Data Protection', 'Financial Reporting'],
    features: ['Risk Scoring', 'Regulatory Reporting', 'Document Verification', 'Fraud Detection'],
    templates: 25,
    adoptionRate: 88,
    roi: '425%'
  },
  {
    id: 'logistics',
    name: 'Logistics & Transport',
    description: 'Fleet management, route optimization, and delivery tracking solutions',
    icon: Truck,
    workflows: ['Fleet Management', 'Route Optimization', 'Delivery Tracking', 'Driver Management'],
    compliance: ['Transport Regulations', 'Driver Hours', 'Vehicle Safety', 'Insurance Requirements'],
    features: ['GPS Tracking', 'Route Optimization', 'Fuel Analytics', 'Driver Performance'],
    templates: 14,
    adoptionRate: 85,
    roi: '365%'
  }
];

const COMPLIANCE_MODULES: ComplianceModule[] = [
  {
    id: 'african-trade',
    name: 'African Continental Free Trade Area (AfCFTA)',
    region: 'Africa',
    requirements: ['Rules of Origin', 'Tariff Schedules', 'Trade Facilitation', 'Dispute Resolution'],
    automatedChecks: 45,
    lastUpdated: '2024-01-15',
    status: 'active'
  },
  {
    id: 'ecowas',
    name: 'ECOWAS Trade Regulations',
    region: 'West Africa',
    requirements: ['Common External Tariff', 'Trade Liberalization', 'Investment Protocols'],
    automatedChecks: 32,
    lastUpdated: '2024-01-10',
    status: 'active'
  },
  {
    id: 'sadc',
    name: 'SADC Trade Protocol',
    region: 'Southern Africa',
    requirements: ['Customs Union', 'Standards Harmonization', 'Investment Facilitation'],
    automatedChecks: 28,
    lastUpdated: '2024-01-08',
    status: 'active'
  },
  {
    id: 'gdpr',
    name: 'GDPR Compliance',
    region: 'Europe',
    requirements: ['Data Protection', 'Privacy Rights', 'Consent Management', 'Data Portability'],
    automatedChecks: 67,
    lastUpdated: '2024-01-12',
    status: 'active'
  }
];

export default function IndustrySolutions() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustrySolution | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch industry templates
  const { data: industryData, isLoading } = useQuery({
    queryKey: ["/api/industry-solutions"],
    enabled: activeTab === "templates"
  });

  // Activate industry solution
  const activateIndustryMutation = useMutation({
    mutationFn: (industryId: string) => 
      fetch("/api/industry-solutions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industryId, complianceModules: selectedCompliance })
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Industry Solution Activated",
        description: "Your industry-specific workflows and compliance modules have been configured.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/industry-solutions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate industry solution",
        variant: "destructive",
      });
    }
  });

  const IndustryCard = ({ industry }: { industry: IndustrySolution }) => {
    const IconComponent = industry.icon;
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedIndustry(industry)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{industry.name}</CardTitle>
                <CardDescription className="text-sm">{industry.templates} templates</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600">
              {industry.adoptionRate}% adoption
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{industry.description}</p>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-500">Key Features</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {industry.features.slice(0, 3).map(feature => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {industry.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{industry.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                <span className="text-gray-500">ROI: </span>
                <span className="font-medium text-green-600">{industry.roi}</span>
              </div>
              <Button size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ComplianceModuleCard = ({ module }: { module: ComplianceModule }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{module.name}</CardTitle>
          <Badge 
            variant={module.status === 'active' ? 'default' : module.status === 'pending' ? 'secondary' : 'destructive'}
          >
            {module.status}
          </Badge>
        </div>
        <CardDescription>{module.region}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Automated Checks</Label>
            <div className="flex items-center space-x-2 mt-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{module.automatedChecks} compliance rules</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Requirements</Label>
            <div className="mt-2 space-y-1">
              {module.requirements.slice(0, 3).map(req => (
                <div key={req} className="flex items-center space-x-2">
                  <ShieldCheck className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-gray-600">{req}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">
              Updated: {new Date(module.lastUpdated).toLocaleDateString()}
            </span>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CurrencyManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Currency Management</CardTitle>
          <CardDescription>
            Comprehensive support for African and global currencies with real-time exchange rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">African Currencies</h4>
              {[
                { code: 'NGN', name: 'Nigerian Naira', rate: 760.00, change: '+2.1%' },
                { code: 'ZAR', name: 'South African Rand', rate: 18.50, change: '-0.8%' },
                { code: 'KES', name: 'Kenyan Shilling', rate: 150.00, change: '+1.2%' },
                { code: 'GHS', name: 'Ghanaian Cedi', rate: 12.00, change: '+0.5%' }
              ].map(currency => (
                <div key={currency.code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-sm text-gray-600">{currency.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(currency.rate, 'USD')}</div>
                    <div className={`text-sm ${currency.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {currency.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Currency Alerts</h4>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">USD/NGN Alert</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Rate exceeded 750 threshold</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Hedging Opportunity</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Favorable rates for EUR/ZAR</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Hedging Recommendations</h4>
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">USD/NGN Forward Contract</div>
                    <div className="text-xs text-gray-600 mb-2">
                      Lock in rate of 755 for 90-day period
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Potential savings: 3.2%</span>
                      <Button size="sm">Setup</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">Multi-Currency Portfolio</div>
                    <div className="text-xs text-gray-600 mb-2">
                      Diversify exposure across 5 African currencies
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Risk reduction: 25%</span>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Industry-Specific Solutions</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Specialized CRM workflows and compliance modules for African markets
            </p>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Configuration
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Templates
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="industries">Industries</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Industries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">6</div>
                  <p className="text-sm text-gray-600">Configured solutions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-sm text-gray-600">Active regulations</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Currency Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">54</div>
                  <p className="text-sm text-gray-600">African currencies</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Automation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">87%</div>
                  <p className="text-sm text-gray-600">Process automation</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Market Focus: African Business Excellence</CardTitle>
                <CardDescription>
                  Our platform is specifically designed for African markets with deep understanding of local business practices, regulations, and economic dynamics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-blue-600" />
                      Regional Expertise
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• AfCFTA trade agreement compliance</li>
                      <li>• ECOWAS and SADC protocols</li>
                      <li>• Local business registration requirements</li>
                      <li>• Cross-border payment facilitation</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      Currency Intelligence
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Real-time exchange rate monitoring</li>
                      <li>• Currency hedging recommendations</li>
                      <li>• Multi-currency transaction support</li>
                      <li>• Economic indicator integration</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-purple-600" />
                      Smart Automation
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Industry-specific workflow templates</li>
                      <li>• Compliance automation and monitoring</li>
                      <li>• Predictive analytics for African markets</li>
                      <li>• Local language and cultural adaptation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="industries" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Industry Solutions</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose your industry to activate specialized workflows, compliance modules, and business intelligence
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INDUSTRY_SOLUTIONS.map(industry => (
                <IndustryCard key={industry.id} industry={industry} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Compliance Modules</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Automated compliance monitoring and reporting for African and international regulations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMPLIANCE_MODULES.map(module => (
                <ComplianceModuleCard key={module.id} module={module} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="currencies" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Currency Management</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive currency support with real-time rates and hedging intelligence
              </p>
            </div>
            <CurrencyManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Industry Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Performance metrics and insights specific to your industry vertical
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">94%</div>
                  <p className="text-sm text-gray-600">Average success rate across industries</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Time to Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">21 days</div>
                  <p className="text-sm text-gray-600">Average implementation time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>ROI Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">380%</div>
                  <p className="text-sm text-gray-600">Average ROI within 12 months</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}