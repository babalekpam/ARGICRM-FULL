import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Users, 
  Building2, 
  UserCheck, 
  DollarSign, 
  CheckSquare, 
  Mail,
  BarChart3,
  Settings,
  Zap,
  PieChart,
  Shield,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();

  const commands: Command[] = [
    // Navigation
    {
      id: "go-dashboard",
      label: "Go to Dashboard",
      description: "View your CRM overview",
      icon: Home,
      action: () => setLocation("/dashboard"),
      keywords: ["dashboard", "home", "overview"],
      category: "Navigation"
    },
    {
      id: "go-contacts",
      label: "Go to Contacts", 
      description: "Manage your contacts",
      icon: Users,
      action: () => setLocation("/contacts"),
      keywords: ["contacts", "people", "customers"],
      category: "Navigation"
    },
    {
      id: "go-deals",
      label: "Go to Deals",
      description: "Manage your sales pipeline", 
      icon: DollarSign,
      action: () => setLocation("/deals"),
      keywords: ["deals", "sales", "pipeline", "opportunities"],
      category: "Navigation"
    },
    {
      id: "go-tasks",
      label: "Go to Tasks",
      description: "View and manage tasks",
      icon: CheckSquare,
      action: () => setLocation("/tasks"),
      keywords: ["tasks", "todo", "activities"],
      category: "Navigation"
    },
    {
      id: "go-leads",
      label: "Go to Leads",
      description: "Manage lead generation",
      icon: UserCheck,
      action: () => setLocation("/leads"),
      keywords: ["leads", "prospects", "potential"],
      category: "Navigation"
    },
    {
      id: "go-accounts",
      label: "Go to Accounts",
      description: "Manage company accounts",
      icon: Building2,
      action: () => setLocation("/accounts"),
      keywords: ["accounts", "companies", "organizations"],
      category: "Navigation"
    },
    {
      id: "go-email",
      label: "Go to Email Marketing",
      description: "Send bulk email campaigns",
      icon: Mail,
      action: () => setLocation("/email-marketing"),
      keywords: ["email", "marketing", "campaigns", "newsletters"],
      category: "Navigation"
    },
    {
      id: "go-analytics",
      label: "Go to Analytics",
      description: "View performance metrics",
      icon: BarChart3,
      action: () => setLocation("/analytics"),
      keywords: ["analytics", "metrics", "reports", "data"],
      category: "Navigation"
    },
    {
      id: "go-workflows",
      label: "Go to Workflows",
      description: "Automation and workflows",
      icon: Zap,
      action: () => setLocation("/workflows"),
      keywords: ["workflows", "automation", "triggers"],
      category: "Navigation"
    },
    {
      id: "go-reports",
      label: "Go to Reports",
      description: "Custom reporting",
      icon: PieChart,
      action: () => setLocation("/reports"),
      keywords: ["reports", "charts", "export"],
      category: "Navigation"
    },
    {
      id: "go-roles",
      label: "Go to Roles",
      description: "User permissions and roles",
      icon: Shield,
      action: () => setLocation("/roles"),
      keywords: ["roles", "permissions", "access", "security"],
      category: "Navigation"
    },

    // Create Actions
    {
      id: "create-contact",
      label: "Create New Contact",
      description: "Add a new contact to CRM",
      icon: Users,
      action: () => setLocation("/contacts?action=create"),
      keywords: ["create", "new", "contact", "add", "person"],
      category: "Create"
    },
    {
      id: "create-deal",
      label: "Create New Deal",
      description: "Start a new sales opportunity",
      icon: DollarSign,
      action: () => setLocation("/deals?action=create"),
      keywords: ["create", "new", "deal", "opportunity", "sale"],
      category: "Create"
    },
    {
      id: "create-task",
      label: "Create New Task",
      description: "Add a task or activity",
      icon: CheckSquare,
      action: () => setLocation("/tasks?action=create"),
      keywords: ["create", "new", "task", "todo", "activity"],
      category: "Create"
    },
    {
      id: "create-lead",
      label: "Create New Lead",
      description: "Capture a new lead",
      icon: UserCheck,
      action: () => setLocation("/leads?action=create"),
      keywords: ["create", "new", "lead", "prospect"],
      category: "Create"
    }
  ];

  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchQuery = query.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchQuery) ||
      command.description.toLowerCase().includes(searchQuery) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleCommandClick = (command: Command) => {
    command.action();
    onClose();
  };

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center px-4 py-3">
            <Search className="h-4 w-4 text-gray-400 mr-3" />
            <Input
              placeholder="Search for commands, pages, or actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="mb-4">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {category}
              </div>
              <div className="space-y-1">
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const Icon = command.icon;
                  return (
                    <div
                      key={command.id}
                      onClick={() => handleCommandClick(command)}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors",
                        globalIndex === selectedIndex
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-3 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{command.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {command.description}
                        </div>
                      </div>
                      {globalIndex === selectedIndex && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Enter
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No commands found</div>
              <div className="text-xs">Try searching for something else</div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Ctrl+K to open
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}