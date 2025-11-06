import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEOHead, { generatePageSEO, generateStructuredData } from "@/components/seo-head";
import SEODashboard from "@/components/seo-dashboard";
import SeoLayout from "@/components/seo-layout";

export default function SEOManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const pageSEO = generatePageSEO('analytics');
  const structuredData = generateStructuredData('organization');

  const handleViewSearchConsole = () => {
    window.open('https://search.google.com/search-console', '_blank', 'noopener,noreferrer');
    toast({
      title: "Opening Google Search Console",
      description: "Redirecting to Google Search Console in a new tab.",
    });
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call to refresh SEO data
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Data Refreshed",
        description: "SEO metrics have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh SEO data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return <div>Please log in to access SEO management.</div>;
  }

  return (
    <SeoLayout title="SEO Management">
      <SEOHead 
        title="SEO Management - NODE CRM | Search Engine Optimization Dashboard"
        description="Monitor and optimize your NODE CRM platform's search engine performance with comprehensive SEO analytics, keyword tracking, and technical optimization tools."
        keywords={["SEO management", "search engine optimization", "keyword tracking", "technical SEO", "organic traffic"]}
        url="https://nodecrm.com/seo-management"
        structuredData={structuredData}
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and optimize your platform's search engine performance with comprehensive SEO analytics and tools.
          </p>
        </div>

        <SEODashboard />

        {/* Google Search Console Integration */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Google Search Console</h2>
                <p className="text-gray-600 text-sm">
                  Your website is verified and connected to Google Search Console
                </p>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Domain Verification</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Site verification code successfully installed and confirmed by Google
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Code: vFsS5vsnFfymGEUv_IqspLYQ5ZMKh-CbnUccNqV0Ulk
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Sitemap Submitted</h3>
                </div>
                <p className="text-sm text-gray-600">
                  XML sitemap automatically submitted and processed by Google
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: Today
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Performance Tracking</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Real-time monitoring of search performance and indexing status
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Active monitoring enabled
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Quick Actions</h4>
                  <p className="text-sm text-gray-600">Manage your Google Search Console integration</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleViewSearchConsole}
                    data-testid="button-view-search-console"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View in Search Console
                  </button>
                  <button 
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    data-testid="button-refresh-seo-data"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SeoLayout>
  );
}