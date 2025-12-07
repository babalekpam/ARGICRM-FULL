import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Clock,
  User,
  PhoneCall,
  PhoneForwarded,
  PhoneMissed,
  PhoneIncoming,
  Search,
  FileText,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Voicemail,
  Hash,
  Delete,
} from "lucide-react";
import type { Contact, DialerCall } from "@shared/schema";

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected", icon: CheckCircle, color: "text-green-400" },
  { value: "voicemail", label: "Voicemail", icon: Voicemail, color: "text-yellow-400" },
  { value: "no_answer", label: "No Answer", icon: PhoneMissed, color: "text-orange-400" },
  { value: "busy", label: "Busy", icon: PhoneOff, color: "text-red-400" },
  { value: "wrong_number", label: "Wrong Number", icon: XCircle, color: "text-red-500" },
  { value: "callback_requested", label: "Callback Requested", icon: PhoneForwarded, color: "text-blue-400" },
  { value: "meeting_booked", label: "Meeting Booked", icon: Calendar, color: "text-purple-400" },
];

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export default function DialerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [activeCall, setActiveCall] = useState<DialerCall | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [statsPeriod, setStatsPeriod] = useState<"today" | "week" | "month">("today");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch contacts for search
  const { data: contactsData } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Fetch call history
  const { data: callsData, isLoading: isLoadingCalls } = useQuery<{
    success: boolean;
    calls: (DialerCall & { contact?: Contact })[];
    total: number;
  }>({
    queryKey: ["/api/dialer/calls"],
  });

  // Fetch stats
  const { data: statsData } = useQuery<{
    success: boolean;
    stats: {
      period: string;
      twilioConfigured: boolean;
      team: {
        totalCalls: number;
        connectedCalls: number;
        connectionRate: number;
        avgDuration: number;
        outcomes: Record<string, number>;
      };
      user: {
        totalCalls: number;
        connectedCalls: number;
        connectionRate: number;
        avgDuration: number;
        meetingsBooked: number;
      };
    };
  }>({
    queryKey: ["/api/dialer/stats", statsPeriod],
  });

  // Initiate call mutation
  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; contactId?: string }) => {
      const response = await apiRequest("POST", "/api/dialer/call", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setActiveCall(data.call);
        setCallTimer(0);
        timerRef.current = setInterval(() => {
          setCallTimer((prev) => prev + 1);
        }, 1000);
        toast({
          title: "Call Initiated",
          description: data.twilioConfigured 
            ? "Connecting via Twilio..." 
            : "Call record created (Twilio not configured)",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async (data: { id: string; outcome?: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/dialer/call/${data.id}/end`, { outcome: data.outcome, notes: data.notes });
      return response.json();
    },
    onSuccess: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setActiveCall(null);
      setCallTimer(0);
      setCallNotes("");
      setSelectedOutcome("");
      setPhoneNumber("");
      setSelectedContact(null);
      qc.invalidateQueries({ queryKey: ["/api/dialer/calls"] });
      qc.invalidateQueries({ queryKey: ["/api/dialer/stats"] });
      toast({
        title: "Call Ended",
        description: "Call completed and saved to history",
      });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (data: { id: string; notes: string }) => {
      const response = await apiRequest("POST", `/api/dialer/calls/${data.id}/notes`, { notes: data.notes });
      return response.json();
    },
  });

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactsData || !contactSearch) return [];
    const search = contactSearch.toLowerCase();
    return contactsData
      .filter((c) => 
        c.name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search)
      )
      .slice(0, 10);
  }, [contactsData, contactSearch]);

  // Handle dial pad input
  const handleDialPadPress = (digit: string) => {
    if (activeCall) return;
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    if (activeCall) return;
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  // Handle call initiation
  const handleCall = () => {
    if (!phoneNumber && !selectedContact?.phone) {
      toast({
        title: "No Phone Number",
        description: "Please enter a phone number or select a contact",
        variant: "destructive",
      });
      return;
    }
    
    const numberToCall = selectedContact?.phone || phoneNumber;
    initiateCallMutation.mutate({
      phoneNumber: numberToCall,
      contactId: selectedContact?.id,
    });
  };

  // Handle end call
  const handleEndCall = () => {
    if (!activeCall) return;
    endCallMutation.mutate({
      id: activeCall.id,
      outcome: selectedOutcome || undefined,
      notes: callNotes || undefined,
    });
  };

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setPhoneNumber(contact.phone || "");
    setContactSearch("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const calls = callsData?.calls || [];
  const stats = statsData?.stats;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B0D17]">
        {/* Stats Header */}
        <div className="border-b border-[#1E293B] bg-[#11152B] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-[#F8F9FA]">Dialer</h1>
              {!stats?.twilioConfigured && (
                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                  Demo Mode
                </Badge>
              )}
            </div>
            <Select value={statsPeriod} onValueChange={(v: "today" | "week" | "month") => setStatsPeriod(v)}>
              <SelectTrigger className="w-32 bg-[#1A1F3A] border-[#1E293B]" data-testid="select-stats-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Stats Cards */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="border-[#1E293B] bg-[#1A1F3A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Calls Today
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-calls-today">
                  {stats?.user?.totalCalls || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-[#1E293B] bg-[#1A1F3A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Connected Rate
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-connected-rate">
                  {stats?.user?.connectionRate || 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-[#1E293B] bg-[#1A1F3A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Avg Duration
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-avg-duration">
                  {formatDuration(stats?.user?.avgDuration || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-[#1E293B] bg-[#1A1F3A]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                    Meetings Booked
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-[#F8F9FA]" data-testid="text-meetings-booked">
                  {stats?.user?.meetingsBooked || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-1">
          {/* Main Dialer Area */}
          <div className="flex-1 p-6">
            <div className="mx-auto max-w-2xl">
              {/* Contact Search */}
              <Card className="mb-6 border-[#1E293B] bg-[#11152B]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#F8F9FA]">
                    <User className="h-5 w-5" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                    <Input
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="bg-[#1A1F3A] border-[#1E293B] pl-10 text-[#F8F9FA]"
                      disabled={!!activeCall}
                      data-testid="input-contact-search"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {filteredContacts.length > 0 && (
                    <div className="mt-2 rounded-md border border-[#1E293B] bg-[#1A1F3A]">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover-elevate"
                          data-testid={`button-select-contact-${contact.id}`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                            {contact.name?.[0] || contact.email?.[0] || "?"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#F8F9FA]">
                              {contact.name || contact.email}
                            </p>
                            <p className="text-xs text-[#64748B]">{contact.phone || "No phone"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Contact */}
                  {selectedContact && (
                    <div className="mt-3 flex items-center gap-3 rounded-md bg-[#1A1F3A] p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                        {selectedContact.name?.[0] || "?"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#F8F9FA]">
                          {selectedContact.name || selectedContact.email}
                        </p>
                        <p className="text-sm text-[#64748B]">{selectedContact.phone}</p>
                      </div>
                      {!activeCall && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(null);
                            setPhoneNumber("");
                          }}
                          data-testid="button-clear-contact"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dial Pad or Active Call */}
              <Card className="border-[#1E293B] bg-[#11152B]">
                <CardContent className="p-6">
                  {activeCall ? (
                    /* Active Call Display */
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 animate-pulse">
                          <Phone className="h-10 w-10 text-green-400" />
                        </div>
                      </div>
                      
                      <p className="text-sm uppercase tracking-wide text-[#64748B]">
                        {activeCall.status === "in_progress" ? "Connected" : "Calling..."}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#F8F9FA]" data-testid="text-active-call-number">
                        {formatPhoneNumber(activeCall.phoneNumber)}
                      </p>
                      <p className="mt-2 text-4xl font-bold tabular-nums text-primary" data-testid="text-call-timer">
                        {formatDuration(callTimer)}
                      </p>
                      
                      {/* Call Controls */}
                      <div className="mt-6 flex justify-center gap-4">
                        <Button
                          variant={isMuted ? "default" : "outline"}
                          size="icon"
                          className="h-14 w-14 rounded-full"
                          onClick={() => setIsMuted(!isMuted)}
                          data-testid="button-mute"
                        >
                          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-16 w-16 rounded-full"
                          onClick={handleEndCall}
                          data-testid="button-end-call"
                        >
                          <PhoneOff className="h-7 w-7" />
                        </Button>
                        
                        <Button
                          variant={isOnHold ? "default" : "outline"}
                          size="icon"
                          className="h-14 w-14 rounded-full"
                          onClick={() => setIsOnHold(!isOnHold)}
                          data-testid="button-hold"
                        >
                          {isOnHold ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                        </Button>
                      </div>

                      {/* Outcome Selector */}
                      <div className="mt-6">
                        <p className="mb-2 text-sm font-medium text-[#94A3B8]">Call Outcome</p>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {CALL_OUTCOMES.map((outcome) => (
                            <Button
                              key={outcome.value}
                              variant={selectedOutcome === outcome.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedOutcome(outcome.value)}
                              className="flex items-center gap-1"
                              data-testid={`button-outcome-${outcome.value}`}
                            >
                              <outcome.icon className={`h-3 w-3 ${outcome.color}`} />
                              <span className="text-xs">{outcome.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-4">
                        <Textarea
                          placeholder="Add notes about this call..."
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] min-h-[80px]"
                          data-testid="textarea-call-notes"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Dial Pad */
                    <div>
                      {/* Phone Number Display */}
                      <div className="mb-4 flex items-center justify-center gap-2">
                        <Input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter phone number"
                          className="bg-[#1A1F3A] border-[#1E293B] text-center text-2xl font-bold text-[#F8F9FA] h-14"
                          data-testid="input-phone-number"
                        />
                        {phoneNumber && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackspace}
                            className="h-14 w-14"
                            data-testid="button-backspace"
                          >
                            <Delete className="h-5 w-5" />
                          </Button>
                        )}
                      </div>

                      {/* Dial Pad Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                          <Button
                            key={digit}
                            variant="outline"
                            className="h-14 text-xl font-bold bg-[#1A1F3A] border-[#1E293B] hover-elevate"
                            onClick={() => handleDialPadPress(digit)}
                            data-testid={`button-dial-${digit}`}
                          >
                            {digit}
                          </Button>
                        ))}
                      </div>

                      {/* Call Button */}
                      <div className="mt-6 flex justify-center">
                        <Button
                          size="lg"
                          className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
                          onClick={handleCall}
                          disabled={initiateCallMutation.isPending || (!phoneNumber && !selectedContact?.phone)}
                          data-testid="button-initiate-call"
                        >
                          <Phone className="h-7 w-7" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call History Sidebar */}
          <div className="w-80 border-l border-[#1E293B] bg-[#11152B] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F8F9FA]">Call History</h2>
              <Badge variant="secondary" data-testid="badge-call-count">
                {calls.length}
              </Badge>
            </div>
            
            <ScrollArea className="h-[calc(100vh-280px)]">
              {isLoadingCalls ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : calls.length === 0 ? (
                <div className="py-8 text-center">
                  <PhoneOff className="mx-auto h-10 w-10 text-[#64748B]" />
                  <p className="mt-2 text-sm text-[#64748B]">No calls yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {calls.map((call) => {
                    const OutcomeIcon = CALL_OUTCOMES.find(o => o.value === call.outcome)?.icon || Phone;
                    const outcomeColor = CALL_OUTCOMES.find(o => o.value === call.outcome)?.color || "text-[#64748B]";
                    
                    return (
                      <Card 
                        key={call.id} 
                        className="border-[#1E293B] bg-[#1A1F3A] hover-elevate cursor-pointer"
                        data-testid={`card-call-${call.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${outcomeColor}`}>
                              {call.direction === "inbound" ? (
                                <PhoneIncoming className="h-4 w-4" />
                              ) : (
                                <OutcomeIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#F8F9FA] truncate">
                                {call.contact 
                                  ? call.contact.name || call.phoneNumber
                                  : formatPhoneNumber(call.phoneNumber)
                                }
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#64748B]">
                                  {call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                </span>
                                {call.duration ? (
                                  <span className="text-xs text-[#64748B]">
                                    {formatDuration(call.duration)}
                                  </span>
                                ) : null}
                              </div>
                              {call.outcome && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {CALL_OUTCOMES.find(o => o.value === call.outcome)?.label || call.outcome}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#64748B]" />
                          </div>
                          
                          {/* Recording indicator */}
                          {call.recordingUrl && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-[#64748B]">
                              <Volume2 className="h-3 w-3" />
                              <span>Recording available</span>
                            </div>
                          )}
                          
                          {/* Transcription indicator */}
                          {call.transcription && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#64748B]">
                              <FileText className="h-3 w-3" />
                              <span>Transcription available</span>
                            </div>
                          )}
                          
                          {/* Notes preview */}
                          {call.notes && (
                            <p className="mt-2 text-xs text-[#94A3B8] line-clamp-2">
                              {call.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Twilio Not Configured Banner */}
        {!stats?.twilioConfigured && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="flex items-center gap-3 p-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">Demo Mode</p>
                  <p className="text-xs text-yellow-500/80">
                    Add Twilio credentials to enable real VoIP calls
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
