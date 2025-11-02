import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Phone, 
  Video, 
  Eye,
  Clock,
  Activity,
  Zap,
  Circle
} from 'lucide-react';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  currentActivity?: {
    type: 'viewing' | 'editing' | 'calling' | 'meeting';
    resource: string;
    details?: string;
  };
  location?: {
    page: string;
    section?: string;
  };
}

interface RealtimeActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'message' | 'edit' | 'view' | 'call' | 'meeting' | 'file_share';
  resource: string;
  details: string;
  timestamp: Date;
  duration?: number;
}

const CollaborationIndicators: React.FC = () => {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize with platform owner only
  useEffect(() => {
    const initializeUsers = () => {
      const sampleUsers: CollaborationUser[] = [
        {
          id: 'abel@argilette.org',
          name: 'Platform Administrator',
          email: 'abel@argilette.org',
          status: 'online',
          lastActivity: new Date(),
          currentActivity: {
            type: 'viewing',
            resource: 'Dashboard',
            details: 'Reviewing platform metrics'
          },
          location: {
            page: 'Dashboard',
            section: 'Overview'
          }
        }
      ];
      setUsers(sampleUsers);
    };

    const initializeActivities = () => {
      const sampleActivities: RealtimeActivity[] = [
        {
          id: '1',
          userId: 'admin@default.com',
          userName: 'Platform Admin',
          type: 'view',
          resource: 'Dashboard',
          details: 'Reviewing platform analytics',
          timestamp: new Date(),
          duration: 60
        },
        {
          id: '2',
          userId: 'admin@default.com',
          userName: 'Platform Admin',
          type: 'view',
          resource: 'System Settings',
          details: 'Platform configuration check',
          timestamp: new Date(Date.now() - 120000),
          duration: 180
        },
        {
          id: '3',
          userId: 'admin@default.com',
          userName: 'Platform Admin',
          type: 'view',
          resource: 'User Management',
          details: 'System administration tasks',
          timestamp: new Date(Date.now() - 300000),
          duration: 300
        }
      ];
      setActivities(sampleActivities);
    };

    initializeUsers();
    initializeActivities();

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update user activities
      setUsers(prev => prev.map(user => {
        if (user.status === 'online' && Math.random() > 0.7) {
          return {
            ...user,
            lastActivity: new Date(),
            currentActivity: {
              type: Math.random() > 0.5 ? 'viewing' : 'editing',
              resource: ['Dashboard', 'Contacts', 'Deals', 'Tasks'][Math.floor(Math.random() * 4)],
              details: `Working on ${['customer data', 'lead qualification', 'deal review', 'task management'][Math.floor(Math.random() * 4)]}`
            }
          };
        }
        return user;
      }));

      // Add new activity
      if (Math.random() > 0.6) {
        const activeUsers = users.filter(u => u.status === 'online');
        if (activeUsers.length > 0) {
          const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
          const newActivity: RealtimeActivity = {
            id: Date.now().toString(),
            userId: randomUser.id,
            userName: randomUser.name,
            type: ['message', 'edit', 'view', 'file_share'][Math.floor(Math.random() * 4)] as any,
            resource: ['Contact', 'Deal', 'Task', 'Report'][Math.floor(Math.random() * 4)],
            details: `${['Created', 'Updated', 'Viewed', 'Shared'][Math.floor(Math.random() * 4)]} new item`,
            timestamp: new Date(),
            duration: Math.floor(Math.random() * 300) + 30
          };
          setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageCircle;
      case 'edit': return FileText;
      case 'view': return Eye;
      case 'call': return Phone;
      case 'meeting': return Video;
      case 'file_share': return FileText;
      default: return Activity;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const onlineUsers = users.filter(u => u.status === 'online').length;
  const totalUsers = users.length;

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50">
        {/* Compact Indicator */}
        {!isExpanded && (
          <Card className="w-64 shadow-lg border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Team Activity</span>
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="h-6 w-6 p-0"
                >
                  <Zap className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {users.slice(0, 4).map((user) => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger>
                        <div className="relative">
                          <Avatar className="h-8 w-8 border-2 border-white">
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs capitalize">{user.status}</p>
                          {user.currentActivity && (
                            <p className="text-xs text-muted-foreground">
                              {user.currentActivity.details}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {users.length > 4 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border-2 border-white text-xs font-medium">
                      +{users.length - 4}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {onlineUsers} online
                </div>
              </div>

              <div className="space-y-1">
                {activities.slice(0, 2).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center gap-2 text-xs">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{activity.userName}</span>
                      <span className="text-muted-foreground truncate">
                        {activity.details}
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <Card className="w-80 h-96 shadow-xl border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Real-Time Collaboration
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{onlineUsers} of {totalUsers} online</span>
                <Badge variant="secondary" className="gap-1">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Live
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="px-4 mb-4">
                <h4 className="text-sm font-medium mb-2">Active Users</h4>
                <div className="space-y-2">
                  {users.filter(u => u.status === 'online').map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        {user.currentActivity && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.currentActivity.details}
                          </p>
                        )}
                        {user.location && (
                          <p className="text-xs text-blue-600">
                            {user.location.page}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getTimeAgo(user.lastActivity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="px-4 pt-4">
                <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-medium">{activity.userName}</span>
                              <span className="text-muted-foreground"> {activity.details}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CollaborationIndicators;