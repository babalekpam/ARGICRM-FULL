import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, BarChart3, Settings } from "lucide-react";

export default function VerticalTabsTest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vertical Tabs Test Page</h1>
      
      <Tabs defaultValue="tab1" orientation="vertical" className="flex gap-6">
        {/* Side Navigation */}
        <div className="w-64 flex-shrink-0">
          <TabsList orientation="vertical" className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="tab1" 
              className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              <span>Tab One</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tab2" 
              className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Tab Two</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tab3" 
              className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Tab Three</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tab4" 
              className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4" />
              <span>Tab Four</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <TabsContent value="tab1">
            <Card>
              <CardHeader>
                <CardTitle>Tab One Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab One. The tabs should be displayed vertically on the left side.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab2">
            <Card>
              <CardHeader>
                <CardTitle>Tab Two Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab Two. If you can see this with vertical tabs, the implementation is working.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab3">
            <Card>
              <CardHeader>
                <CardTitle>Tab Three Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab Three. The vertical layout should show tabs stacked on the left.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tab4">
            <Card>
              <CardHeader>
                <CardTitle>Tab Four Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is the content for Tab Four. Each tab should have an icon and be clickable.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}