import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Terminal, 
  Moon, 
  Sun, 
  Monitor, 
  Code, 
  Play,
  Zap
} from "lucide-react";

export function DemoNavigation() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold">ARGILETTE CRM</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            
            <Link href="/pipelines">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4" />
                <span>Pipelines</span>
                <Badge variant="secondary" className="text-xs">NEW</Badge>
              </Button>
            </Link>
            
            <Link href="/api-explorer">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Terminal className="h-4 w-4" />
                <span>API Explorer</span>
                <Badge variant="secondary" className="text-xs">NEW</Badge>
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Dark Mode</span>
            <Badge variant="outline" className="text-xs">NEW</Badge>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}