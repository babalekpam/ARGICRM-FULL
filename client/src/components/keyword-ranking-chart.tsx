import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface KeywordRankingChartProps {
  data?: {
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    over50: number;
  } | null;
}

export function KeywordRankingChart({ data }: KeywordRankingChartProps) {
  const chartData = [
    { name: "Top 3", value: data?.top3 || 0, color: "hsl(var(--chart-2))" },
    { name: "4-10", value: data?.top10 || 0, color: "hsl(var(--chart-1))" },
    { name: "11-20", value: data?.top20 || 0, color: "hsl(var(--chart-3))" },
    { name: "21-50", value: data?.top50 || 0, color: "hsl(var(--chart-4))" },
    { name: "50+", value: data?.over50 || 0, color: "hsl(var(--chart-5))" },
  ];

  const total = (data?.top3 || 0) + (data?.top10 || 0) + (data?.top20 || 0) + (data?.top50 || 0) + (data?.over50 || 0);

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <CardTitle>Keyword Rankings</CardTitle>
        <p className="text-sm text-muted-foreground">Distribution by position</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono" data-testid="total-keywords">{total}</p>
              <p className="text-xs text-muted-foreground">Total Keywords</p>
            </div>
            <div className="mt-4 space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
