import { useQuery } from "@tanstack/react-query";
import { Users, Smile, TrendingUp, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardStats() {
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ["/api/sentiment"],
  });

  const totalContacts = contacts.length;
  const totalAnalyses = analyses.length;
  
  const positiveAnalyses = analyses.filter((a: any) => a.sentiment === 'POSITIVE').length;
  const positivePercentage = totalAnalyses > 0 ? Math.round((positiveAnalyses / totalAnalyses) * 100) : 0;

  const stats = [
    {
      title: "Total Contacts",
      value: totalContacts.toString(),
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Positive Sentiment",
      value: `${positivePercentage}%`,
      icon: Smile,
      bgColor: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Messages Analyzed",
      value: totalAnalyses.toString(),
      icon: TrendingUp,
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      title: "Active Leads",
      value: Math.floor(totalContacts * 0.5).toString(),
      icon: Target,
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor}`} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
