import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface TrafficChartProps {
  data: Array<{ date: string; visits: number }>;
}

export function TrafficChart({ data }: TrafficChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM d"),
  }));

  const totalVisits = data.reduce((sum, item) => sum + item.visits, 0);
  const avgVisits = Math.round(totalVisits / data.length);

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <CardTitle>Organic Traffic</CardTitle>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold font-mono" data-testid="total-visits">{totalVisits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total visits • {avgVisits.toLocaleString()} avg/day</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formattedData}>
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
            <Line 
              type="monotone" 
              dataKey="visits" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
