import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Mail, HelpCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate sending message (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent",
        description: "Our support team will get back to you shortly!",
      });

      // Reset form
      setName("");
      setEmail("");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl hover:scale-110 transition-transform bg-gradient-to-r from-primary to-purple-600"
            data-testid="button-open-chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md" data-testid="dialog-chat-widget">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Chat with Us</DialogTitle>
                  <DialogDescription>
                    We typically reply within minutes
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link to="/help-center" onClick={() => setIsOpen(false)}>
                <Card className="hover-elevate cursor-pointer" data-testid="card-help-center-link">
                  <CardContent className="p-3 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Help Center</span>
                  </CardContent>
                </Card>
              </Link>

              <a href="mailto:support@argilette.com">
                <Card className="hover-elevate cursor-pointer" data-testid="card-email-support-link">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Email Us</span>
                  </CardContent>
                </Card>
              </a>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat-name">Name</Label>
                <Input
                  id="chat-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-chat-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-email">Email</Label>
                <Input
                  id="chat-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-chat-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-message">Message</Label>
                <Textarea
                  id="chat-message"
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  data-testid="textarea-chat-message"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                  data-testid="button-send-message"
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Support Info */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                For urgent matters, call:{" "}
                <a href="tel:+1234567890" className="text-primary hover:underline">
                  +1 (234) 567-890
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Monday - Friday, 9AM - 6PM EST
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
