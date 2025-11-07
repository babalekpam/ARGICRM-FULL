import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, FileText, Folder, LayoutDashboard, LogOut, MessageSquare, Receipt } from 'lucide-react';
import { useClientPortal } from '@/contexts/client-portal-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface ClientPortalLayoutProps {
  children: ReactNode;
}

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const [location] = useLocation();
  const { clientUser, clientAccount, logout } = useClientPortal();

  const { data: notifications } = useQuery<any[]>({
    queryKey: ['/api/client-portal/notifications'],
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/client-portal/dashboard' },
    { icon: Folder, label: 'Projects', href: '/client-portal/projects' },
    { icon: FileText, label: 'Deliverables', href: '/client-portal/deliverables' },
    { icon: Receipt, label: 'Invoices', href: '/client-portal/invoices' },
    { icon: MessageSquare, label: 'Messages', href: '/client-portal/messages' },
  ];

  const primaryColor = clientAccount?.whiteLabelSettings?.primaryColor || '#3b82f6';
  const companyName = clientAccount?.whiteLabelSettings?.companyName || clientAccount?.accountName || 'Client Portal';
  const logoUrl = clientAccount?.whiteLabelSettings?.logoUrl;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/client-portal/login';
  };

  const userInitials = `${clientUser?.firstName?.[0] || ''}${clientUser?.lastName?.[0] || ''}`.toUpperCase() || 
                      clientUser?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img src={logoUrl} alt={companyName} className="h-8" />
            )}
            <h1 className="text-xl font-semibold">{companyName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/client-portal/notifications">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                    data-testid="badge-notification-count"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">
                    {clientUser?.firstName} {clientUser?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="border-t">
          <div className="flex gap-1 px-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`gap-2 rounded-none border-b-2 ${
                      isActive
                        ? 'border-primary bg-accent text-primary'
                        : 'border-transparent'
                    }`}
                    data-testid={`link-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 overflow-auto bg-background">
        <div className="mx-auto max-w-7xl p-6">
          {children}
        </div>
      </main>

      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        <div className="px-6">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
