import { ChevronDown, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProjectSelectorProps {
  projects: Array<{ id: string; name: string; domain: string }>;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  onAddProject: () => void;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectChange,
  onAddProject,
}: ProjectSelectorProps) {
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
    </div>
  );
}
