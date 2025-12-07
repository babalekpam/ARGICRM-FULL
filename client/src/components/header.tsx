import { Button } from "@/components/ui/button";
import { Bell, Settings, User, LogOut, Crown, Search, Command } from "lucide-react";
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
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Header() {
  const { user, logout } = useAuth();
  const { setIsCommandPaletteOpen } = useKeyboardShortcuts();
  const isPlatformOwner = user?.isPlatformOwner === true || 
                          user?.email === 'abel@argilette.com' ||
                          user?.role === 'platform_owner';

  return (
    <header 
      className="fixed top-0 right-0 left-[var(--sidebar-width,16rem)] bg-[hsl(228,47%,12%)] border-b border-[hsl(217,33%,17%)] shadow-sm z-[9999] transition-all duration-200"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => console.log('Header clicked!', e.target)}
    >
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          {user && (
            <span className="text-sm text-[hsl(215,20%,65%)]">
              Welcome back, <span className="text-[hsl(210,17%,98%)] font-medium">{user.firstName}</span>
            </span>
          )}
        </div>
        
        <div className="flex-1 max-w-xl mx-8">
          <div 
            className="relative cursor-pointer"
            onClick={() => setIsCommandPaletteOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsCommandPaletteOpen(true);
              }
            }}
            data-testid="button-global-search"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,20%,65%)]" />
            <div 
              className="pl-10 pr-12 py-2 w-full bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] text-[hsl(215,16%,47%)] rounded-md text-sm"
            >
              Search contacts, deals, tasks...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[hsl(215,16%,47%)]">
              <Command className="h-3 w-3" />
              <span className="text-xs">K</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 relative z-[70]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
              <div className="px-3 py-2">
                <div className="font-medium text-[hsl(210,17%,98%)]">Notifications</div>
              </div>
              <DropdownMenuSeparator className="bg-[hsl(217,33%,17%)]" />
              <div className="px-3 py-6 text-center text-[hsl(215,20%,65%)] text-sm">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" 
            asChild
            data-testid="button-settings"
          >
            <Link to="/account-settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid="button-user-menu">
                  {isPlatformOwner ? (
                    <Crown className="h-4 w-4 text-amber-500" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                <div className="px-3 py-2">
                  <div className="font-medium text-[hsl(210,17%,98%)]">{user.firstName} {user.lastName}</div>
                  <div className="text-xs text-[hsl(215,20%,65%)]">{user.email}</div>
                  {isPlatformOwner && (
                    <div className="text-xs text-warning flex items-center gap-1 mt-1.5 bg-warning/10 px-2 py-1 rounded-md">
                      <Crown className="h-3 w-3" />
                      Platform Owner
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-[hsl(217,33%,17%)]" />
                <DropdownMenuItem asChild className="text-[hsl(215,20%,65%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">
                  <Link to="/account-settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer focus:bg-[hsl(229,41%,16%)]" data-testid="button-logout">
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
