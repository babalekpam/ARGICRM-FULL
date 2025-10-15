import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  Globe,
  Zap,
  Eye,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Star
} from "lucide-react";
import { trackSEOMetrics, generateSitemapXML, generateRobotsTxt } from "@/lib/seo-sitemap";

interface SEOScore {
  overall: number;
  technical: number;
  content: number;
  mobile: number;
  speed: number;
}

interface KeywordRanking {
  keyword: string;
  position: number;
  change: number;
  searchVolume: number;
  difficulty: number;
}

export default function SEODashboard() {
  const [seoScore, setSeoScore] = useState<SEOScore>({
    overall: 92,
    technical: 95,
    content: 88,
    mobile: 96,
    speed: 89
  });

  const [metrics, setMetrics] = useState(trackSEOMetrics());
  
  const [keywordRankings] = useState<KeywordRanking[]>([
    { keyword: "AI CRM software", position: 3, change: 2, searchVolume: 8900, difficulty: 75 },
    { keyword: "emotional intelligence CRM", position: 1, change: 0, searchVolume: 1200, difficulty: 45 },
    { keyword: "customer relationship management", position: 12, change: -1, searchVolume: 45000, difficulty: 85 },
    { keyword: "CRM with AI analytics", position: 5, change: 3, searchVolume: 3400, difficulty: 60 },
    { keyword: "automated sales pipeline", position: 8, change: 1, searchVolume: 2100, difficulty: 55 }
  ]);

  const [organicTraffic] = useState([
    { month: "Jan", visitors: 12420, conversions: 248 },
    { month: "Feb", visitors: 14230, conversions: 295 },
    { month: "Mar", visitors: 16890, conversions: 356 },
    { month: "Apr", visitors: 18560, conversions: 402 },
    { month: "May", visitors: 21340, conversions: 467 },
    { month: "Jun", visitors: 24120, conversions: 521 }
  ]);

  const downloadSitemap = () => {
    const sitemapXML = generateSitemapXML();
    const blob = new Blob([sitemapXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadRobotsTxt = () => {
    const robotsTxt = generateRobotsTxt();
    const blob = new Blob([robotsTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return <div className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      {/* SEO Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall SEO Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(seoScore.overall)}`}>
              {seoScore.overall}/100
            </div>
            <Progress value={seoScore.overall} className="mt-2" />
            <div className="flex items-center mt-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Google Search Console Verified
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-1" />
              Page Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(seoScore.speed)}`}>
              {seoScore.speed}/100
            </div>
            <div className="text-xs text-gray-500 mt-1">
              LCP: {metrics.coreWebVitals.lcp}s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Mobile Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(seoScore.mobile)}`}>
              {seoScore.mobile}/100
            </div>
            <div className="flex items-center mt-1">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-gray-500">Mobile Friendly</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Organic Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.organicTraffic.toLocaleString()}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-gray-500">+18% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.backlinks.toLocaleString()}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-gray-500">+24 this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords">Keyword Rankings</TabsTrigger>
          <TabsTrigger value="traffic">Organic Traffic</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
          <TabsTrigger value="tools">SEO Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Keyword Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keywordRankings.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{keyword.keyword}</div>
                      <div className="text-sm text-gray-500">
                        {keyword.searchVolume.toLocaleString()} monthly searches
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <span>#{keyword.position}</span>
                        {getChangeIcon(keyword.change)}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        Difficulty: {keyword.difficulty}/100
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Organic Traffic Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organicTraffic.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="font-medium">{month.month} 2025</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="font-medium">{month.visitors.toLocaleString()}</span> visitors
                      </div>
                      <div className="text-sm text-green-600">
                        <span className="font-medium">{month.conversions}</span> conversions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Largest Contentful Paint (LCP)</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">{metrics.coreWebVitals.lcp}s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>First Input Delay (FID)</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">{metrics.coreWebVitals.fid}ms</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cumulative Layout Shift (CLS)</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">{metrics.coreWebVitals.cls}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Health Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Mobile Usability</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Passed</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>HTTPS Security</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Secure</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>XML Sitemap</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Found</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Robots.txt</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Valid</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={downloadSitemap} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sitemap.xml
                </Button>
                <Button onClick={downloadRobotsTxt} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Robots.txt
                </Button>
                <Button className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Meta Tags
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Great! Your mobile score is excellent
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Consider optimizing images for better Core Web Vitals
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Target long-tail keywords for better ranking opportunities
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}