import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Dialog import removed - using custom modal instead
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Select import removed - using HTML select instead
import { MapPin, Users, Target, TrendingUp, DollarSign, BarChart3, Search, Plus, Edit, Trash2, Eye, Calendar, Award, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Territory {
  id: string;
  name: string;
  description?: string;
  region: string;
  managerId: string;
  managerName: string;
  quota: number;
  actualSales: number;
  startDate: Date;
  endDate?: Date;
  status: string;
  accountCount: number;
  leadCount: number;
  zipCodes: string[];
  states: string[];
  countries: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface TerritoryPerformance {
  territoryId: string;
  period: string;
  revenue: number;
  quota: number;
  deals: number;
  newAccounts: number;
  activitiesCompleted: number;
  conversionRate: number;
}

export default function TerritoryManagementPage() {
  const [activeTab, setActiveTab] = useState("territories");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateTerritoryOpen, setIsCreateTerritoryOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [newTerritory, setNewTerritory] = useState({
    name: "",
    description: "",
    region: "",
    managerId: "",
    quota: "",
    zipCodes: "",
    states: "",
    countries: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch territories
  const { data: territories = [], isLoading: territoriesLoading } = useQuery({
    queryKey: ['/api/territories'],
    enabled: true,
  });

  // Fetch territory performance
  const { data: performance = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/territory-performance'],
    enabled: true,
  });

  // Territory creation feature temporarily disabled

  // Filter territories
  const filteredTerritories = territories.filter((territory: Territory) => {
    const matchesSearch = territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         territory.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || territory.region === regionFilter;
    const matchesStatus = statusFilter === "all" || territory.status === statusFilter;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Calculate territory statistics
  const territoryStats = {
    totalTerritories: territories.length,
    activeTerritories: territories.filter((t: Territory) => t.status === 'active').length,
    totalQuota: territories.reduce((sum: number, t: Territory) => sum + t.quota, 0),
    totalSales: territories.reduce((sum: number, t: Territory) => sum + t.actualSales, 0),
  };

  const getQuotaAttainment = (territory: Territory) => {
    return territory.quota > 0 ? (territory.actualSales / territory.quota) * 100 : 0;
  };

  const getPerformanceColor = (attainment: number) => {
    if (attainment >= 100) return 'text-green-600';
    if (attainment >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'review': 'bg-blue-100 text-blue-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Territory Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage sales territories, quotas, and performance</p>
        </div>
        <div className="flex gap-2">
          {/* Territory creation feature temporarily disabled */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Territories</p>
                <p className="text-2xl font-bold">{territoryStats.totalTerritories}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Territories</p>
                <p className="text-2xl font-bold">{territoryStats.activeTerritories}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quota</p>
                <p className="text-2xl font-bold">${territoryStats.totalQuota.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">${territoryStats.totalSales.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={(territoryStats.totalSales / territoryStats.totalQuota) * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {((territoryStats.totalSales / territoryStats.totalQuota) * 100).toFixed(1)}% of quota
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mapping">Territory Mapping</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="territories" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search territories or managers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerritories.map((territory: Territory) => {
              const quotaAttainment = getQuotaAttainment(territory);
              return (
                <Card key={territory.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{territory.name}</CardTitle>
                        <CardDescription>{territory.region} Region</CardDescription>
                      </div>
                      <Badge className={getStatusColor(territory.status)} variant="secondary">
                        {territory.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Manager:</span>
                        <span className="text-sm font-medium">{territory.managerName}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quota Attainment:</span>
                          <span className={`text-sm font-bold ${getPerformanceColor(quotaAttainment)}`}>
                            {quotaAttainment.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={quotaAttainment} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>${territory.actualSales.toLocaleString()}</span>
                          <span>${territory.quota.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold text-blue-600">{territory.accountCount}</div>
                          <div className="text-gray-600">Accounts</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold text-green-600">{territory.leadCount}</div>
                          <div className="text-gray-600">Leads</div>
                        </div>
                      </div>

                      {territory.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{territory.description}</p>
                      )}

                      <div className="flex justify-between pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTerritory(territory)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTerritories.length === 0 && !territoriesLoading && (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No territories found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first territory.</p>
              <Button onClick={() => setIsCreateTerritoryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Territory
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Territory Performance Overview</CardTitle>
              <CardDescription>
                Track performance metrics across all territories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {territories.slice(0, 5).map((territory: Territory) => {
                  const quotaAttainment = getQuotaAttainment(territory);
                  return (
                    <div key={territory.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{territory.name}</h4>
                          <span className={`font-bold ${getPerformanceColor(quotaAttainment)}`}>
                            {quotaAttainment.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={quotaAttainment} className="h-2 mb-2" />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{territory.managerName}</span>
                          <span>${territory.actualSales.toLocaleString()} / ${territory.quota.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        {quotaAttainment >= 100 ? (
                          <Award className="h-6 w-6 text-yellow-500" />
                        ) : quotaAttainment < 50 ? (
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        ) : (
                          <TrendingUp className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Territories</CardTitle>
                <CardDescription>Territories exceeding quota</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {territories
                    .filter((t: Territory) => getQuotaAttainment(t) >= 100)
                    .slice(0, 5)
                    .map((territory: Territory, index: number) => (
                      <div key={territory.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{territory.name}</div>
                            <div className="text-xs text-gray-500">{territory.managerName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {getQuotaAttainment(territory).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            ${territory.actualSales.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Territories Needing Attention</CardTitle>
                <CardDescription>Below 50% quota attainment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {territories
                    .filter((t: Territory) => getQuotaAttainment(t) < 50)
                    .slice(0, 5)
                    .map((territory: Territory) => (
                      <div key={territory.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="font-medium text-sm">{territory.name}</div>
                            <div className="text-xs text-gray-500">{territory.managerName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">
                            {getQuotaAttainment(territory).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            ${territory.actualSales.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Territory Mapping</CardTitle>
              <CardDescription>
                Visualize territory boundaries and coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Territory Map</h3>
                  <p className="text-gray-500">
                    Geographic visualization would be implemented here using a mapping library like Mapbox or Google Maps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Coverage Analysis</CardTitle>
                <CardDescription>Territory coverage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total ZIP Codes Covered:</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>States Covered:</span>
                    <span className="font-bold">15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Countries Covered:</span>
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Coverage Overlap:</span>
                    <span className="font-bold text-yellow-600">2.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uncovered Areas:</span>
                    <span className="font-bold text-red-600">5.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Territory Optimization</CardTitle>
                <CardDescription>Recommendations for territory adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { issue: "West Region Overlap", severity: "Medium", suggestion: "Redistribute 5 ZIP codes" },
                    { issue: "North Territory Gap", severity: "High", suggestion: "Assign manager to uncovered area" },
                    { issue: "Central Quota Imbalance", severity: "Low", suggestion: "Adjust quota distribution" },
                  ].map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{item.issue}</span>
                        <Badge 
                          variant="secondary"
                          className={
                            item.severity === 'High' ? 'bg-red-100 text-red-800' :
                            item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{item.suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Quota Attainment</p>
                    <p className="text-2xl font-bold">87.3%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">+5.2% from last quarter</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Best Performing Region</p>
                    <p className="text-2xl font-bold">West</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-blue-600">112% quota attainment</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Territory Efficiency</p>
                    <p className="text-2xl font-bold">92%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">Optimal coverage ratio</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Territory Performance Trends</CardTitle>
              <CardDescription>
                Track performance trends across quarters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Territory performance trends chart would be implemented here with a charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Territory Detail Modal */}
      {selectedTerritory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedTerritory(null);
          }
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedTerritory.name} - Territory Details</h2>
                <p className="text-gray-600 dark:text-gray-400">Comprehensive territory information and performance metrics</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTerritory(null)}
              >
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Territory Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span>{selectedTerritory.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span>{selectedTerritory.managerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(selectedTerritory.status)}>
                        {selectedTerritory.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{format(new Date(selectedTerritory.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Geographic Coverage</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">ZIP Codes:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedTerritory.zipCodes.slice(0, 5).map((zip, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {zip}
                          </Badge>
                        ))}
                        {selectedTerritory.zipCodes.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedTerritory.zipCodes.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">States:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedTerritory.states.map((state, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quota Attainment</span>
                        <span className={getPerformanceColor(getQuotaAttainment(selectedTerritory))}>
                          {getQuotaAttainment(selectedTerritory).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={getQuotaAttainment(selectedTerritory)} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-blue-600">{selectedTerritory.accountCount}</div>
                        <div className="text-gray-600">Accounts</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-green-600">{selectedTerritory.leadCount}</div>
                        <div className="text-gray-600">Leads</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Financial Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Quota:</span>
                      <span className="font-medium">${selectedTerritory.quota.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Sales:</span>
                      <span className="font-medium">${selectedTerritory.actualSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">
                        ${(selectedTerritory.quota - selectedTerritory.actualSales).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}