import { useQuery } from "@tanstack/react-query";
import { TrafficData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Clock, Eye } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { format } from "date-fns";

interface TrafficProps {
  projectId: string;
}

export default function Traffic({ projectId }: TrafficProps) {
  const { data: trafficData, isLoading } = useQuery<TrafficData[]>({
    queryKey: ["/api/traffic", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/traffic?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch traffic data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const formattedData = trafficData?.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM d"),
  })) || [];

  const totalVisits = trafficData?.reduce((sum, item) => sum + item.visits, 0) || 0;
  const avgVisits = trafficData && trafficData.length > 0 ? Math.round(totalVisits / trafficData.length) : 0;
  const peakVisits = Math.max(...(trafficData?.map(d => d.visits) || [0]));

  return (
    <div className="p-6 space-y-6" data-testid="traffic-page">
      <div>
        <h1 className="text-3xl font-bold mb-2">Traffic Analyzer</h1>
        <p className="text-muted-foreground">Monitor your organic traffic performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Visits"
          value={totalVisits.toLocaleString()}
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Avg. Daily Visits"
          value={avgVisits.toLocaleString()}
          icon={TrendingUp}
        />
        <MetricCard
          title="Peak Traffic"
          value={peakVisits.toLocaleString()}
          icon={Eye}
        />
      </div>

      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle>Organic Traffic Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Daily visitors over the last 30 days</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Area 
                type="monotone" 
                dataKey="visits" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVisits)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { source: "Google", percentage: 78, visits: Math.round(totalVisits * 0.78) },
              { source: "Bing", percentage: 12, visits: Math.round(totalVisits * 0.12) },
              { source: "Direct", percentage: 7, visits: Math.round(totalVisits * 0.07) },
              { source: "Other", percentage: 3, visits: Math.round(totalVisits * 0.03) },
            ].map((source) => (
              <div key={source.source} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{source.source}</div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-chart-1" 
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm text-muted-foreground">
                  {source.percentage}%
                </div>
                <div className="w-24 text-right text-sm font-mono">
                  {source.visits.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
