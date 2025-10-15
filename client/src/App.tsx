import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, User as UserIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ProjectSelector } from "@/components/project-selector";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import Dashboard from "@/pages/dashboard";
import Keywords from "@/pages/keywords";
import RankTracking from "@/pages/rank-tracking";
import Traffic from "@/pages/traffic";
import SeoAudit from "@/pages/seo-audit";
import Backlinks from "@/pages/backlinks";
import Competitors from "@/pages/competitors";
import LinkBuildingPage from "@/pages/link-building";
import ContentTools from "@/pages/content-tools";
import TechnicalAudit from "@/pages/technical-audit";
import AutomatedReports from "@/pages/automated-reports";
import ApiAccess from "@/pages/api-access";
import AIAssistantPage from "@/pages/ai-assistant-page";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<{ id: string; name: string; domain: string } | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated,
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
    queryClient.invalidateQueries({ queryKey: ["/api/rank-tracking/history"] });
    queryClient.invalidateQueries({ queryKey: ["/api/rank-tracking/competitor-ranks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/traffic"] });
    queryClient.invalidateQueries({ queryKey: ["/api/seo-issues"] });
    queryClient.invalidateQueries({ queryKey: ["/api/backlinks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/competitors"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content/briefs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content/scorecards"] });
    queryClient.invalidateQueries({ queryKey: ["/api/technical-audit/scans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/technical-audit/latest"] });
  };

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
    handleProjectChange(projectId);
  };

  const handleEditProject = (project: { id: string; name: string; domain: string }) => {
    setProjectToEdit(project);
    setEditDialogOpen(true);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteDialogOpen(true);
  };

  const handleProjectDeleted = () => {
    // If we deleted the selected project, switch to another project
    if (projectToDelete?.id === selectedProjectId) {
      const remainingProjects = projects.filter(p => p.id !== projectToDelete.id);
      if (remainingProjects.length > 0) {
        setSelectedProjectId(remainingProjects[0].id);
      } else {
        setSelectedProjectId(null);
      }
    }
    setProjectToDelete(null);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <Landing />;
  }

  const userInitials = user ? 
    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '??' :
    '??';

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
                onAddProject={() => setCreateDialogOpen(true)}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          <Switch>
            <Route path="/pricing">
              <Pricing />
            </Route>
            <Route path="/">
              {() => {
                if (projectsLoading) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    </div>
                  );
                }
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <Dashboard projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/keywords">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <Keywords projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/traffic">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <Traffic projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/seo-audit">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <SeoAudit projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/backlinks">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <Backlinks projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/competitors">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <Competitors projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/rank-tracking">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <RankTracking projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/link-building">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <LinkBuildingPage selectedProjectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/content-tools">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <ContentTools projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/technical-audit">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <TechnicalAudit projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/automated-reports">
              {() => {
                if (!effectiveProjectId) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">No Projects</h2>
                        <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-project">
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </Button>
                      </div>
                    </div>
                  );
                }
                return <AutomatedReports projectId={effectiveProjectId} />;
              }}
            </Route>
            <Route path="/api-access">
              {() => <ApiAccess />}
            </Route>
            <Route path="/ai-assistant">
              {() => <AIAssistantPage />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
      {projectToEdit && (
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={projectToEdit}
        />
      )}
      {projectToDelete && (
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          projectId={projectToDelete.id}
          projectName={projectToDelete.name}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
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
