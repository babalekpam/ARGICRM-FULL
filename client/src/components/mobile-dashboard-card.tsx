import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface MobileDashboardCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function MobileDashboardCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  badge,
  onClick,
  trend = "neutral",
  className = ""
}: MobileDashboardCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          
          {change && (
            <p className={`text-xs ${getTrendColor()}`}>
              {change}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          
          {onClick && (
            <Button variant="ghost" size="sm" className="w-full mt-2">
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}