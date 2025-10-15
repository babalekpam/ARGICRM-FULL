import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Keyword } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface KeywordsProps {
  projectId: string;
}

export default function Keywords({ projectId }: KeywordsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: keywords, isLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/keywords?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
  });

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return "bg-destructive text-white";
    if (difficulty >= 40) return "bg-chart-3 text-white";
    return "bg-chart-2 text-white";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-chart-2" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredKeywords = keywords?.filter((keyword) =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="keywords-page">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keyword Research</h1>
        <p className="text-muted-foreground">Track and analyze your keyword rankings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-keywords"
              />
            </div>
            <Button data-testid="button-export-keywords">Export</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Search Volume</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>CPC</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No keywords found
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeywords.map((keyword) => (
                  <TableRow key={keyword.id} data-testid={`keyword-${keyword.id}`}>
                    <TableCell className="font-medium">{keyword.keyword}</TableCell>
                    <TableCell>
                      {keyword.position ? (
                        <Badge variant="secondary">#{keyword.position}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{keyword.searchVolume.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(keyword.difficulty)}>
                        {keyword.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">${keyword.cpc?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getTrendIcon(keyword.trend || 'stable')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
