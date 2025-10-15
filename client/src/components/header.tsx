import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { UserSwitcher } from "./user-switcher";
import Logo from "./logo";

export default function Header() {
  const { user, logout } = useAuth();

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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/account-settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {user && (
            <UserSwitcher currentUser={user} />
          )}
        </div>
      </div>
    </header>
  );
}