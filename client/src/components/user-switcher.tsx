import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Crown, LogOut } from "lucide-react";
import { loginAsUser } from "@/lib/auth-init";
import { useAuth } from "@/hooks/useAuth";

interface UserSwitcherProps {
  currentUser?: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isPlatformOwner: boolean;
  };
}

export function UserSwitcher({ currentUser }: UserSwitcherProps) {
  const { logout } = useAuth();

  const handleUserSwitch = (email: string, isPlatformOwner: boolean) => {
    console.log(`USER SWITCH: Switching to ${email}, Platform Owner: ${isPlatformOwner}`);
    logout();
    loginAsUser(email, 'demo-token', isPlatformOwner);
    // Add small delay to ensure localStorage is updated before reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleLogout = () => {
    logout();
    // logout() now handles redirect internally
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 px-3 gap-2">
          {currentUser?.isPlatformOwner ? (
            <Crown className="h-4 w-4 text-amber-500" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="text-sm">
            {currentUser?.firstName || 'User'} 
            <span className="text-xs text-gray-500 ml-1">
              ({currentUser?.isPlatformOwner ? 'Platform Owner' : 'Tenant'})
            </span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium text-gray-700 border-b">
          Switch User Account
        </div>
        
        <DropdownMenuItem 
          onClick={() => handleUserSwitch('abel@argilette.com', true)}
          className="gap-2"
        >
          <Crown className="h-4 w-4 text-amber-500" />
          <div>
            <div className="font-medium">Platform Owner</div>
            <div className="text-xs text-gray-500">abel@argilette.com</div>
            <div className="text-xs text-green-600">All privileges</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleUserSwitch('motena.des@gmail.com', false)}
          className="gap-2"
        >
          <User className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">Regular Tenant</div>
            <div className="text-xs text-gray-500">motena.des@gmail.com</div>
            <div className="text-xs text-orange-600">Limited privileges</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleUserSwitch('sarah.wilson@gmail.com', false)}
          className="gap-2"
        >
          <User className="h-4 w-4 text-purple-500" />
          <div>
            <div className="font-medium">Trial User</div>
            <div className="text-xs text-gray-500">sarah.wilson@gmail.com</div>
            <div className="text-xs text-purple-600">15-day trial</div>
          </div>
        </DropdownMenuItem>

        <div className="border-t my-1"></div>
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="gap-2 text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}