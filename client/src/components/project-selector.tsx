import { ChevronDown, Plus, MoreVertical, Trash2, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProjectSelectorProps {
  projects: Array<{ id: string; name: string; domain: string }>;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  onAddProject: () => void;
  onEditProject?: (project: { id: string; name: string; domain: string }) => void;
  onDeleteProject?: (projectId: string, projectName: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProjectId} onValueChange={onProjectChange}>
        <SelectTrigger className="w-64" data-testid="select-project">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} data-testid={`project-${project.id}`}>
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground">{project.domain}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="outline" onClick={onAddProject} data-testid="button-add-project">
        <Plus className="h-4 w-4" />
      </Button>
      {(onEditProject || onDeleteProject) && selectedProject && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" data-testid="button-project-menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEditProject && (
              <>
                <DropdownMenuItem
                  onClick={() => onEditProject(selectedProject)}
                  data-testid="button-edit-project-menu"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onDeleteProject && (
              <DropdownMenuItem
                onClick={() => onDeleteProject(selectedProject.id, selectedProject.name)}
                className="text-destructive focus:text-destructive"
                data-testid="button-delete-project-menu"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
