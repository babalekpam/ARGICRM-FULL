import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  type: 'message' | 'edit' | 'view' | 'call' | 'meeting' | 'file_share' | 'login' | 'logout';
  resource: string;
  details: string;
  timestamp: Date;
  duration?: number;
}

interface CollaborationEvent {
  type: 'user_online' | 'user_offline' | 'user_activity' | 'activity_update' | 'status_change' | 'initial_state';
  data: any;
  timestamp: Date;
  userId?: string;
}

export const useCollaboration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  // Fetch initial data - disabled by default for performance, enable only when needed
  const { data: usersData } = useQuery({
    queryKey: ['/api/collaboration/users'],
    refetchInterval: false, // Disabled to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Lazy load - only fetch when explicitly needed
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['/api/collaboration/activities'],
    refetchInterval: false, // Disabled to improve performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Lazy load
  });

  // WebSocket connection disabled for performance - enable explicitly when collaboration features are needed
  // This prevents unnecessary WebSocket connections on every page load
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token || wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/collaboration?token=${encodeURIComponent(token)}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const eventData: CollaborationEvent = JSON.parse(event.data);
          handleCollaborationEvent(eventData);
        } catch (error) {
          // Silent fail for WebSocket parsing errors
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
      };

      wsRef.current.onerror = () => {
        setIsConnected(false);
      };

    } catch (error) {
      // Silent fail for WebSocket connection errors
    }
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Load initial data from API calls
  useEffect(() => {
    if (usersData?.users) {
      setUsers(usersData.users.map((user: any) => ({
        ...user,
        lastActivity: new Date(user.lastActivity)
      })));
    }
  }, [usersData]);

  useEffect(() => {
    if (activitiesData?.activities) {
      setActivities(activitiesData.activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      })));
    }
  }, [activitiesData]);

  const handleCollaborationEvent = (event: CollaborationEvent) => {
    switch (event.type) {
      case 'initial_state':
        if (event.data.users) {
          setUsers(event.data.users.map((user: any) => ({
            ...user,
            lastActivity: new Date(user.lastActivity)
          })));
        }
        if (event.data.activities) {
          setActivities(event.data.activities.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })));
        }
        break;

      case 'user_online':
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== event.data.id);
          return [...filtered, {
            ...event.data,
            lastActivity: new Date(event.data.lastActivity)
          }];
        });
        break;

      case 'user_offline':
        setUsers(prev => prev.filter(u => u.id !== event.data.userId));
        break;

      case 'user_activity':
        setUsers(prev => prev.map(user => {
          if (user.id === event.data.userId) {
            return {
              ...user,
              currentActivity: event.data.activity,
              location: event.data.location || user.location,
              lastActivity: new Date(event.data.lastActivity)
            };
          }
          return user;
        }));
        break;

      case 'status_change':
        setUsers(prev => prev.map(user => {
          if (user.id === event.data.userId) {
            return {
              ...user,
              status: event.data.status,
              lastActivity: new Date(event.data.lastActivity)
            };
          }
          return user;
        }));
        break;

      case 'activity_update':
        setActivities(prev => {
          const newActivity = {
            ...event.data,
            timestamp: new Date(event.data.timestamp)
          };
          return [newActivity, ...prev.slice(0, 49)]; // Keep last 50 activities
        });
        break;
    }
  };

  // Helper functions to send updates
  const updateUserActivity = async (activity: CollaborationUser['currentActivity']) => {
    try {
      const response = await fetch('/api/collaboration/user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ activity })
      });

      if (!response.ok) {
        console.error('Failed to update user activity');
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  };

  const updateUserStatus = async (status: 'online' | 'away' | 'busy' | 'offline') => {
    try {
      const response = await fetch('/api/collaboration/user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        console.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updatePageNavigation = async (page: string, section?: string) => {
    try {
      const response = await fetch('/api/collaboration/page-navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ page, section })
      });

      if (!response.ok) {
        console.error('Failed to update page navigation');
      }
    } catch (error) {
      console.error('Error updating page navigation:', error);
    }
  };

  return {
    isConnected,
    users,
    activities,
    onlineUsers: users.filter(u => u.status === 'online'),
    updateUserActivity,
    updateUserStatus,
    updatePageNavigation,
    connectWebSocket // Export for explicit connection when needed
  };
};