import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ClientPortalMessages() {
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: allMessages, isLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/messages'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/client-portal/messages', {
        method: 'POST',
        body: JSON.stringify({
          message,
          threadId: selectedThreadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/messages'] });
      setNewMessage('');
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const threads = allMessages?.reduce((acc: any, message: any) => {
    const threadId = message.threadId || 'default';
    if (!acc[threadId]) {
      acc[threadId] = [];
    }
    acc[threadId].push(message);
    return acc;
  }, {});

  const currentThreadMessages = selectedThreadId && threads?.[selectedThreadId]
    ? threads[selectedThreadId].sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : [];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-messages">Messages</h1>
        <p className="text-muted-foreground">Communicate with your team</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {threads && Object.keys(threads).map((threadId: string) => {
                    const threadMessages = threads[threadId];
                    const lastMessage = threadMessages[threadMessages.length - 1];
                    const unreadCount = threadMessages.filter((m: any) => !m.isRead && m.senderType !== 'client').length;

                    return (
                      <button
                        key={threadId}
                        onClick={() => setSelectedThreadId(threadId)}
                        className={`w-full p-3 text-left rounded-lg hover-elevate ${
                          selectedThreadId === threadId ? 'bg-accent' : ''
                        }`}
                        data-testid={`button-thread-${threadId}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">Thread {threadId.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {lastMessage?.message}
                            </div>
                          </div>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {(!threads || Object.keys(threads).length === 0) && (
                    <div className="p-4 text-center text-muted-foreground" data-testid="text-no-threads">
                      No conversations yet
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedThreadId ? `Thread ${selectedThreadId.slice(0, 8)}` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ScrollArea className="h-[500px] pr-4">
              {currentThreadMessages.length > 0 ? (
                <div className="space-y-4">
                  {currentThreadMessages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === 'client' ? 'justify-end' : 'justify-start'
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderType === 'client'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">{message.senderName}</div>
                        <div className="text-sm" data-testid={`text-message-${message.id}`}>
                          {message.message}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {selectedThreadId ? 'No messages in this thread' : 'Select a conversation to view messages'}
                </div>
              )}
            </ScrollArea>

            {selectedThreadId && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                  data-testid="textarea-new-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
