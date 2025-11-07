import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Users, 
  Building2, 
  UserCheck, 
  DollarSign, 
  CheckSquare, 
  Mail,
  Phone,
  Calendar,
  FileText,
  Zap,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  description: string;
  category: "create" | "navigate" | "communicate";
}

const quickActions: QuickAction[] = [
  // Create Actions
  {
    id: "add-contact",
    label: "Add Contact",
    icon: Users,
    path: "/contacts?action=create",
    color: "bg-blue-500 hover:bg-blue-600",
    description: "Create new contact",
    category: "create"
  },
  {
    id: "add-deal",
    label: "New Deal",
    icon: DollarSign,
    path: "/deals?action=create",
    color: "bg-green-500 hover:bg-green-600", 
    description: "Start new deal",
    category: "create"
  },
  {
    id: "add-task",
    label: "Create Task",
    icon: CheckSquare,
    path: "/tasks?action=create",
    color: "bg-orange-500 hover:bg-orange-600",
    description: "Add new task",
    category: "create"
  },
  {
    id: "add-lead",
    label: "New Lead",
    icon: UserCheck,
    path: "/leads?action=create",
    color: "bg-purple-500 hover:bg-purple-600",
    description: "Capture new lead",
    category: "create"
  },
  
  // Navigate Actions
  {
    id: "view-accounts",
    label: "Accounts",
    icon: Building2,
    path: "/accounts",
    color: "bg-indigo-500 hover:bg-indigo-600",
    description: "Manage accounts",
    category: "navigate"
  },
  {
    id: "view-projects",
    label: "Projects",
    icon: FileText,
    path: "/projects",
    color: "bg-teal-500 hover:bg-teal-600",
    description: "View projects",
    category: "navigate"
  },
  {
    id: "view-workflows",
    label: "Workflows",
    icon: Zap,
    path: "/workflows",
    color: "bg-yellow-500 hover:bg-yellow-600",
    description: "Automation tools",
    category: "navigate"
  },
  
  // Communicate Actions
  {
    id: "send-email",
    label: "Send Email",
    icon: Mail,
    path: "/email-marketing",
    color: "bg-red-500 hover:bg-red-600",
    description: "Email marketing",
    category: "communicate"
  }
];

export default function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleActionClick = (action: QuickAction) => {
    navigate(action.path);
    setIsOpen(false);
    setSelectedCategory(null);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedCategory(null);
    }
  };

  const categoryActions = selectedCategory 
    ? quickActions.filter(action => action.category === selectedCategory)
    : quickActions;

  const categories = [
    { id: "create", label: "Create", icon: Plus, color: "bg-blue-500" },
    { id: "navigate", label: "Navigate", icon: FileText, color: "bg-green-500" },
    { id: "communicate", label: "Communicate", icon: Mail, color: "bg-purple-500" }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Actions Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80">
          <Card className="shadow-2xl border-0 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Filter */}
              {!selectedCategory && (
                <div className="space-y-3 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                    Categories
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex flex-col h-16 p-2 space-y-1"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{category.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Back Button */}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="mb-3 text-xs"
                >
                  ← Back to Categories
                </Button>
              )}

              {/* Actions Grid */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  {selectedCategory ? 
                    categories.find(c => c.id === selectedCategory)?.label + " Actions" : 
                    "All Actions"
                  }
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categoryActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.id}
                        variant="outline"
                        onClick={() => handleActionClick(action)}
                        className="flex flex-col h-20 p-3 space-y-2 hover:shadow-md transition-all"
                      >
                        <div className={cn(
                          "p-2 rounded-full text-white",
                          action.color
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium">{action.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {action.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Press Ctrl+K for shortcuts</span>
                  <Badge variant="outline" className="text-xs">
                    Quick Access
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleMenu}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "hover:shadow-2xl hover:scale-110",
            isOpen && "rotate-45"
          )}
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>
    </>
  );
}