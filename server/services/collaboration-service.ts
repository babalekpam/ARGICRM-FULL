import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  sessionId: string;
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

export interface RealtimeActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'message' | 'edit' | 'view' | 'call' | 'meeting' | 'file_share' | 'login' | 'logout';
  resource: string;
  details: string;
  timestamp: Date;
  duration?: number;
}

export interface CollaborationEvent {
  type: 'user_online' | 'user_offline' | 'user_activity' | 'activity_update' | 'status_change';
  data: any;
  timestamp: Date;
  userId?: string;
}

class CollaborationService extends EventEmitter {
  private static instance: CollaborationService;
  private activeUsers: Map<string, CollaborationUser> = new Map();
  private recentActivities: RealtimeActivity[] = [];
  private wsConnections: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, string[]> = new Map(); // userId -> sessionIds[]

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  private constructor() {
    super();
    this.initializeSampleData();
    this.startCleanupInterval();
  }

  private initializeSampleData() {
    // Clear any existing activities
    this.recentActivities = [];
    
    // Initialize with only platform owner
    const sampleUsers: CollaborationUser[] = [
      {
        id: 'abel@argilette.com',
        name: 'Platform Administrator',
        email: 'abel@argilette.com',
        status: 'online',
        lastActivity: new Date(),
        sessionId: 'session-admin',
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

    sampleUsers.forEach(user => {
      this.activeUsers.set(user.id, user);
    });

    // Initialize some activities for platform owner only
    const platformOwnerActivities = [
      {
        userId: 'abel@argilette.com',
        userName: 'Platform Admin',
        type: 'view' as const,
        resource: 'Dashboard',
        details: 'Reviewing platform analytics',
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      },
      {
        userId: 'abel@argilette.com',
        userName: 'Platform Admin',
        type: 'view' as const,
        resource: 'User Management',
        details: 'Checking system configuration',
        timestamp: new Date(Date.now() - 180000) // 3 minutes ago
      },
      {
        userId: 'abel@argilette.com',
        userName: 'Platform Admin',
        type: 'view' as const,
        resource: 'System Settings',
        details: 'Platform maintenance check',
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      }
    ];

    // Add platform owner activities without broadcasting
    platformOwnerActivities.forEach(activity => {
      const newActivity = {
        ...activity,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      this.recentActivities.unshift(newActivity);
    });

    // Activities are already initialized above with platform owner only
  }

  // WebSocket connection management
  addConnection(sessionId: string, ws: WebSocket, userId?: string) {
    this.wsConnections.set(sessionId, ws);
    
    if (userId) {
      const sessions = this.userSessions.get(userId) || [];
      sessions.push(sessionId);
      this.userSessions.set(userId, sessions);
      
      // Update user status to online
      this.updateUserStatus(userId, 'online');
    }

    ws.on('close', () => {
      this.removeConnection(sessionId, userId);
    });

    ws.on('message', (data) => {
      this.handleWebSocketMessage(sessionId, data, userId);
    });

    // Send current state to new connection
    this.sendToConnection(sessionId, {
      type: 'initial_state',
      data: {
        users: Array.from(this.activeUsers.values()),
        activities: this.recentActivities.slice(0, 20)
      },
      timestamp: new Date()
    });
  }

  removeConnection(sessionId: string, userId?: string) {
    this.wsConnections.delete(sessionId);
    
    if (userId) {
      const sessions = this.userSessions.get(userId) || [];
      const updatedSessions = sessions.filter(s => s !== sessionId);
      
      if (updatedSessions.length === 0) {
        // User has no more active sessions
        this.userSessions.delete(userId);
        this.updateUserStatus(userId, 'offline');
      } else {
        this.userSessions.set(userId, updatedSessions);
      }
    }
  }

  private handleWebSocketMessage(sessionId: string, data: any, userId?: string) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'activity_update':
          if (userId) {
            this.updateUserActivity(userId, message.data);
          }
          break;
        case 'status_change':
          if (userId) {
            this.updateUserStatus(userId, message.data.status);
          }
          break;
        case 'page_navigation':
          if (userId) {
            this.updateUserLocation(userId, message.data.page, message.data.section);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private sendToConnection(sessionId: string, event: CollaborationEvent) {
    const ws = this.wsConnections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  private broadcast(event: CollaborationEvent, excludeSessionId?: string) {
    this.wsConnections.forEach((ws, sessionId) => {
      if (sessionId !== excludeSessionId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    });
  }

  // User management methods
  updateUserStatus(userId: string, status: 'online' | 'away' | 'busy' | 'offline') {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.status = status;
      user.lastActivity = new Date();
      
      if (status === 'offline') {
        user.currentActivity = undefined;
      }

      this.broadcast({
        type: 'status_change',
        data: { userId, status, lastActivity: user.lastActivity },
        timestamp: new Date(),
        userId
      });

      // Add activity for status change
      if (status === 'online' || status === 'offline') {
        this.addActivity({
          userId,
          userName: user.name,
          type: status === 'online' ? 'login' : 'logout',
          resource: 'Platform',
          details: status === 'online' ? 'Joined the session' : 'Left the session',
          timestamp: new Date()
        });
      }
    }
  }

  updateUserActivity(userId: string, activity: CollaborationUser['currentActivity']) {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.currentActivity = activity;
      user.lastActivity = new Date();

      this.broadcast({
        type: 'user_activity',
        data: { userId, activity, lastActivity: user.lastActivity },
        timestamp: new Date(),
        userId
      });

      // Add to activity feed
      if (activity) {
        this.addActivity({
          userId,
          userName: user.name,
          type: activity.type === 'editing' ? 'edit' : 'view',
          resource: activity.resource,
          details: activity.details || `${activity.type} ${activity.resource}`,
          timestamp: new Date()
        });
      }
    }
  }

  updateUserLocation(userId: string, page: string, section?: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.location = { page, section };
      user.lastActivity = new Date();

      this.broadcast({
        type: 'user_activity',
        data: { userId, location: user.location, lastActivity: user.lastActivity },
        timestamp: new Date(),
        userId
      });
    }
  }

  addUser(user: Omit<CollaborationUser, 'lastActivity'>) {
    const fullUser: CollaborationUser = {
      ...user,
      lastActivity: new Date()
    };
    
    this.activeUsers.set(user.id, fullUser);
    
    this.broadcast({
      type: 'user_online',
      data: fullUser,
      timestamp: new Date(),
      userId: user.id
    });

    this.addActivity({
      userId: user.id,
      userName: user.name,
      type: 'login',
      resource: 'Platform',
      details: 'Joined the team',
      timestamp: new Date()
    });
  }

  removeUser(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      this.activeUsers.delete(userId);
      
      this.broadcast({
        type: 'user_offline',
        data: { userId },
        timestamp: new Date(),
        userId
      });

      this.addActivity({
        userId,
        userName: user.name,
        type: 'logout',
        resource: 'Platform',
        details: 'Left the team',
        timestamp: new Date()
      });
    }
  }

  addActivity(activity: Omit<RealtimeActivity, 'id'>) {
    const newActivity: RealtimeActivity = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    this.recentActivities.unshift(newActivity);
    
    // Keep only last 50 activities
    if (this.recentActivities.length > 50) {
      this.recentActivities = this.recentActivities.slice(0, 50);
    }

    this.broadcast({
      type: 'activity_update',
      data: newActivity,
      timestamp: new Date()
    });
  }

  // Public API methods
  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values());
  }

  getRecentActivities(limit: number = 20): RealtimeActivity[] {
    return this.recentActivities.slice(0, limit);
  }

  getUserById(userId: string): CollaborationUser | undefined {
    return this.activeUsers.get(userId);
  }

  getOnlineUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values()).filter(user => user.status === 'online');
  }

  private startCleanupInterval() {
    // Clean up inactive users every 5 minutes
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

      this.activeUsers.forEach((user, userId) => {
        const timeSinceLastActivity = now.getTime() - user.lastActivity.getTime();
        
        if (timeSinceLastActivity > inactiveThreshold && user.status !== 'offline') {
          // Mark as away if inactive for too long
          if (user.status === 'online') {
            this.updateUserStatus(userId, 'away');
          }
        }
      });
    }, 5 * 60 * 1000);
  }

  // Simulate real-time activity for demo purposes
  startActivitySimulation() {
    setInterval(() => {
      const onlineUsers = this.getOnlineUsers();
      if (onlineUsers.length === 0) return;

      // Random activity simulation
      if (Math.random() > 0.7) {
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
        const activities = [
          { type: 'view', resource: 'Dashboard', details: 'Checking daily metrics' },
          { type: 'edit', resource: 'Contact', details: 'Updating contact information' },
          { type: 'view', resource: 'Deal Pipeline', details: 'Reviewing upcoming deals' },
          { type: 'edit', resource: 'Task', details: 'Updating task status' },
          { type: 'view', resource: 'Reports', details: 'Analyzing sales data' }
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        
        this.updateUserActivity(randomUser.id, {
          type: randomActivity.type as any,
          resource: randomActivity.resource,
          details: randomActivity.details
        });
      }
    }, 8000); // Every 8 seconds
  }
}

export const collaborationService = CollaborationService.getInstance();