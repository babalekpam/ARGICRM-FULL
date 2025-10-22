import { Button } from "@/components/ui/button";
import { Bell, Settings, User, LogOut, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "./logo";

export default function Header() {
  const { user, logout } = useAuth();
  const isPlatformOwner = user?.email === 'abel@argilette.com';

  return (
    <header className="fixed top-0 right-0 left-64 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Logo size="sm" variant="colored" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              NODE CRM
            </h1>
          </div>
          {user && (
            <span className="text-sm text-gray-500">
              Welcome, {user.firstName} {user.lastName}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/account-settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-user-menu">
                  {isPlatformOwner ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  {isPlatformOwner && (
                    <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3" />
                      Platform Owner
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account-settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}