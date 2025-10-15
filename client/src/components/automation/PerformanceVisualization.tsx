import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, Zap, Activity, Users } from 'lucide-react';

interface PerformanceVisualizationProps {
  automationMetrics: any;
  insights: any;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export function PerformanceVisualization({ automationMetrics, insights }: PerformanceVisualizationProps) {
  const performanceData = [
    { name: 'Inventory', efficiency: 0, savings: 0, automations: 0 },
    { name: 'Pricing', efficiency: 0, savings: 0, automations: 0 },
    { name: 'Marketing', efficiency: 0, savings: 0, automations: 0 },
    { name: 'Customer Service', efficiency: 0, savings: 0, automations: 0 },
    { name: 'Orders', efficiency: 0, savings: 0, automations: 0 },
    { name: 'Analytics', efficiency: 0, savings: 0, automations: 0 }
  ];

  const timelineData = [
    { date: '2025-01', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-02', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-03', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-04', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-05', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-06', rules: 0, efficiency: 0, savings: 0 },
    { date: '2025-07', rules: 0, efficiency: 0, savings: 0 }
  ];

  const categoryBreakdown = [
    { name: 'Inventory Management', value: 0, count: 0 },
    { name: 'Dynamic Pricing', value: 0, count: 0 },
    { name: 'Marketing Campaigns', value: 0, count: 0 },
    { name: 'Customer Service', value: 0, count: 0 },
    { name: 'Order Processing', value: 0, count: 0 }
  ];

  const impactMetrics = [
    { metric: 'Revenue Generated', value: '$0', change: '0%', trend: 'stable' },
    { metric: 'Time Saved', value: '0 hrs', change: '0%', trend: 'stable' },
    { metric: 'Cost Reduction', value: '$0', change: '0%', trend: 'stable' },
    { metric: 'Error Rate', value: '0%', change: '0%', trend: 'stable' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {impactMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.metric}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`flex items-center gap-1 ${
                  metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Efficiency by Category</CardTitle>
            <CardDescription>Performance metrics across different automation areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Savings by Category</CardTitle>
            <CardDescription>Financial impact of automation across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Savings']} />
                <Bar dataKey="savings" fill="#82ca9d" name="Savings ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Growth Timeline</CardTitle>
          <CardDescription>Track automation adoption and impact over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="efficiency" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Efficiency %" />
              <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#82ca9d" strokeWidth={3} name="Savings ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Distribution</CardTitle>
            <CardDescription>Breakdown of automation rules by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>AI-powered recommendations for optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">High Performance Category</p>
                <p className="text-sm text-muted-foreground">Customer Service automation showing 95% efficiency</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Optimization Opportunity</p>
                <p className="text-sm text-muted-foreground">Marketing automation can be improved by 12%</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Quick Win</p>
                <p className="text-sm text-muted-foreground">Add 3 more inventory rules to save $8,000/month</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">ROI Potential</p>
                <p className="text-sm text-muted-foreground">Pricing automation showing 320% ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Analysis</CardTitle>
          <CardDescription>Comprehensive breakdown of automation performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    category.efficiency >= 90 ? 'bg-green-100' : 
                    category.efficiency >= 80 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {category.efficiency >= 90 ? 
                      <TrendingUp className={`h-4 w-4 text-green-600`} /> :
                      category.efficiency >= 80 ?
                      <Clock className={`h-4 w-4 text-yellow-600`} /> :
                      <TrendingDown className={`h-4 w-4 text-red-600`} />
                    }
                  </div>
                  <div>
                    <h4 className="font-semibold">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">{category.automations} active rules</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                    <div className="flex items-center gap-2">
                      <Progress value={category.efficiency} className="w-20" />
                      <span className="font-medium">{category.efficiency}%</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Monthly Savings</p>
                    <p className="font-semibold text-green-600">${category.savings.toLocaleString()}</p>
                  </div>
                  
                  <Badge variant={category.efficiency >= 90 ? "default" : category.efficiency >= 80 ? "secondary" : "destructive"}>
                    {category.efficiency >= 90 ? "Excellent" : category.efficiency >= 80 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}