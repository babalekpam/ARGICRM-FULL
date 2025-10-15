import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ProjectSelector } from "@/components/project-selector";
import { Project } from "@shared/schema";
import Dashboard from "@/pages/dashboard";
import Keywords from "@/pages/keywords";
import Traffic from "@/pages/traffic";
import SeoAudit from "@/pages/seo-audit";
import Backlinks from "@/pages/backlinks";
import Competitors from "@/pages/competitors";
import NotFound from "@/pages/not-found";

function AppContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Initialize selected project to first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const effectiveProjectId = selectedProjectId || projects[0]?.id;

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    // Invalidate project-specific queries to refetch data for new project
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
    queryClient.invalidateQueries({ queryKey: ["/api/traffic"] });
    queryClient.invalidateQueries({ queryKey: ["/api/seo-issues"] });
    queryClient.invalidateQueries({ queryKey: ["/api/backlinks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {projects.length > 0 && effectiveProjectId && (
              <ProjectSelector
                projects={projects}
                selectedProjectId={effectiveProjectId}
                onProjectChange={handleProjectChange}
                onAddProject={() => console.log("Add project")}
              />
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {projectsLoading || !effectiveProjectId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            <Switch>
              <Route path="/">
                {() => <Dashboard projectId={effectiveProjectId} />}
              </Route>
              <Route path="/keywords">
                {() => <Keywords projectId={effectiveProjectId} />}
              </Route>
              <Route path="/traffic">
                {() => <Traffic projectId={effectiveProjectId} />}
              </Route>
              <Route path="/seo-audit">
                {() => <SeoAudit projectId={effectiveProjectId} />}
              </Route>
              <Route path="/backlinks">
                {() => <Backlinks projectId={effectiveProjectId} />}
              </Route>
              <Route path="/competitors">
                {() => <Competitors projectId={effectiveProjectId} />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <AppContent />
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
