import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("hover-elevate", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {trend && (
          <p className={cn(
            "text-xs mt-2",
            trend.isPositive ? "text-chart-2" : "text-destructive"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
