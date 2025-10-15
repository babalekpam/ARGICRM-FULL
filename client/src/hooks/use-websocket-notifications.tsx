import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationData {
  type: string;
  data: any;
  message: string;
  timestamp: string;
}

export function useWebSocketNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const notification: NotificationData = JSON.parse(event.data);
            console.log('Received notification:', notification);
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
            
            // Handle different notification types
            switch (notification.type) {
              case 'ticket_created':
              case 'ticket_status_changed':
                // Invalidate tickets query to refresh the list
                queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
                
                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                  new Notification('ARGILETTE CRM - Ticket Update', {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: `ticket-${notification.data.ticket?.id}`,
                  });
                }
                break;
              
              case 'connection_established':
                console.log('WebSocket connection established');
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    isConnected,
    clearNotifications
  };
}