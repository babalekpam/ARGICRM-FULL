import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Users, 
  UserPlus, 
  Building2, 
  DollarSign, 
  CheckSquare,
  Phone,
  Mail,
  Calendar,
  X
} from "lucide-react";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const quickActions = [
  {
    icon: UserPlus,
    label: "Add Contact",
    href: "/contacts",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    icon: Building2,
    label: "Add Account",
    href: "/accounts",
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    icon: DollarSign,
    label: "Add Deal",
    href: "/deals",
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    icon: CheckSquare,
    label: "Add Task",
    href: "/tasks",
    color: "bg-orange-500 hover:bg-orange-600"
  },
  {
    icon: Calendar,
    label: "Schedule Meeting",
    href: "/scheduling",
    color: "bg-indigo-500 hover:bg-indigo-600"
  },
  {
    icon: Mail,
    label: "Send Email",
    href: "/email-marketing",
    color: "bg-red-500 hover:bg-red-600"
  }
];

export default function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Quick Actions</SheetTitle>
          </SheetHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant="outline"
                    className={`h-20 w-full flex flex-col space-y-2 ${action.color} text-white border-none`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Recent Contacts Quick Access */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Recent Contacts</h3>
            <div className="space-y-2">
              {/* Placeholder for recent contacts */}
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">JD</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-500">ABC Corp</p>
                </div>
                <div className="flex space-x-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">JS</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Jane Smith</p>
                  <p className="text-xs text-gray-500">Tech Solutions</p>
                </div>
                <div className="flex space-x-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}