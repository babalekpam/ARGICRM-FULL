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
  const isPlatformOwner = user?.isPlatformOwner === true || 
                          user?.email === 'abel@argilette.com' ||
                          user?.role === 'platform_owner';

  return (
    <header className="fixed top-0 right-0 left-64 bg-card/95 backdrop-blur-md border-b border-border shadow-sm z-40">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Logo size="sm" variant="colored" />
            <h1 className="text-xl font-semibold text-foreground">
              NODE CRM
            </h1>
          </div>
          {user && (
            <span className="text-sm text-muted-foreground font-medium">
              Welcome, {user.firstName} {user.lastName}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
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
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                  {isPlatformOwner && (
                    <div className="text-xs text-warning flex items-center gap-1 mt-1.5 bg-warning/10 px-2 py-1 rounded-md">
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
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="button-logout">
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