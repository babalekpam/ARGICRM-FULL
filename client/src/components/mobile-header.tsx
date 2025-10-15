import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  Crown,
  Menu,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import MobileNavigation from "./mobile-navigation";
import Logo from "./logo";

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    logout();
    // logout() now handles redirect internally
  };

  return (
    <header className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Mobile Navigation + Logo */}
        <div className="flex items-center space-x-3">
          <MobileNavigation />
          <div className="flex items-center space-x-2">
            <Logo size="sm" variant="colored" />
            <span className="font-semibold text-lg">NODE CRM</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2 h-9">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user?.role?.replace('_', ' ') || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Trial Banner */}
      {user?.role === 'demo_admin' && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span>14 days left in trial</span>
            <Button size="sm" variant="secondary" className="text-xs h-6">
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}