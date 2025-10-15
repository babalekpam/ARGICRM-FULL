import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface BacklinksOverviewProps {
  totalBacklinks: number;
  referringDomains: number;
  growthData: Array<{ date: string; backlinks: number }>;
}

export function BacklinksOverview({ totalBacklinks, referringDomains, growthData }: BacklinksOverviewProps) {
  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Backlinks Overview</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Link building performance</p>
        </div>
        <Link href="/backlinks">
          <Button variant="outline" size="sm" data-testid="button-view-backlinks">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold font-mono" data-testid="total-backlinks">{totalBacklinks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Backlinks</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono" data-testid="referring-domains">{referringDomains.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Referring Domains</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="colorBacklinks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
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
              dataKey="backlinks" 
              stroke="hsl(var(--chart-4))" 
              fillOpacity={1} 
              fill="url(#colorBacklinks)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
