import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const STORAGE_KEYS = {
  SESSION_ID: 'chat_widget_session_id',
  MESSAGES: 'chat_widget_messages',
  HAS_OPENED: 'chat_widget_has_opened',
};

const WELCOME_MESSAGE: Message = {
  role: 'bot',
  content: "Hello! I'm your AI assistant. How can I help you today?",
  timestamp: new Date(),
};

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isQualified, setIsQualified] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session and load messages from localStorage
  useEffect(() => {
    let storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    
    if (!storedSessionId) {
      storedSessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, storedSessionId);
    }
    
    setSessionId(storedSessionId);

    // Load previous messages
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Failed to parse stored messages:", error);
      }
    }
  }, []);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hasOpened = localStorage.getItem(STORAGE_KEYS.HAS_OPENED);
      if (!hasOpened) {
        setMessages([WELCOME_MESSAGE]);
        localStorage.setItem(STORAGE_KEYS.HAS_OPENED, 'true');
      }
    }
  }, [isOpen, messages.length]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      // Convert Date objects to ISO strings before storing
      const messagesForStorage = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messagesForStorage));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/webhooks/chat", {
        session_id: sessionId,
        message,
      });
      return response.json();
    },
    onSuccess: (data: { reply: string; isQualified?: boolean }) => {
      // Add bot response to messages
      const botMessage: Message = {
        role: 'bot',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Handle qualification status
      if (data.isQualified) {
        setIsQualified(true);
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      // Add error message
      const errorMessage: Message = {
        role: 'bot',
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to API
    sendMessageMutation.mutate(inputValue.trim());

    // Clear input
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <Card
          className={cn(
            "mb-4 w-[380px] h-[600px] flex flex-col shadow-2xl transition-all duration-300 ease-out",
            "sm:w-[420px] sm:h-[650px]",
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                    Online
                  </Badge>
                  {isQualified && (
                    <Badge variant="default" className="text-xs">
                      Qualified Lead
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-4 py-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                      data-testid={`text-chat-message-${index}`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1.5 opacity-70",
                          message.role === 'user' ? "text-right" : "text-left"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                size="icon"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen && "rotate-0"
        )}
        data-testid="button-chat-widget-toggle"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
