import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Keyword, insertKeywordSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import SeoLayout from "@/components/seo-layout";

interface KeywordsProps {
  projectId?: string;
}

type KeywordFormValues = z.infer<typeof insertKeywordSchema>;

export default function Keywords({ projectId: propProjectId }: KeywordsProps = {}) {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get('projectId');
  
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user && !propProjectId && !urlProjectId
  });
  
  const projectId = propProjectId || urlProjectId || (Array.isArray(projects) && projects.length > 0 ? String(projects[0].id) : null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: keywords, isLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/keywords?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
  });

  const form = useForm<KeywordFormValues>({
    resolver: zodResolver(insertKeywordSchema),
    defaultValues: {
      projectId: null,
      keyword: "",
      searchVolume: 0,
      difficulty: 0,
      cpc: 0,
      position: undefined,
      trend: "stable",
    },
  });

  useEffect(() => {
    if (projectId) {
      form.reset({
        projectId,
        keyword: "",
        searchVolume: 0,
        difficulty: 0,
        cpc: 0,
        position: undefined,
        trend: "stable",
      });
    }
  }, [projectId, form]);

  const createKeywordMutation = useMutation({
    mutationFn: async (data: KeywordFormValues) => {
      if (!projectId && !data.projectId) {
        throw new Error("No project selected");
      }
      const dataWithProjectId = { ...data, projectId: projectId || data.projectId };
      return await apiRequest("POST", "/api/keywords", dataWithProjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords", projectId] });
      toast({ title: "Keyword added successfully" });
      setDialogOpen(false);
      form.reset({
        projectId,
        keyword: "",
        searchVolume: 0,
        difficulty: 0,
        cpc: 0,
        position: undefined,
        trend: "stable",
      });
    },
    onError: () => {
      toast({ title: "Failed to add keyword", variant: "destructive" });
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
    <SeoLayout title="Keyword Research">
      <div className="p-6 space-y-6" data-testid="keywords-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Keyword Research</h1>
          <p className="text-muted-foreground">Track and analyze your keyword rankings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-keyword">
              <Plus className="mr-2 h-4 w-4" /> Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Keyword</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createKeywordMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="keyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter keyword..." {...field} data-testid="input-keyword" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="searchVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Volume</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-search-volume" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty (0-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-difficulty" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="cpc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPC ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-cpc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-keyword">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createKeywordMutation.isPending} data-testid="button-submit-keyword">
                    {createKeywordMutation.isPending ? "Adding..." : "Add Keyword"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
    </SeoLayout>
  );
}
