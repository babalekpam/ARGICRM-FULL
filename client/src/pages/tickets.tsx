import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Clock, User, AlertTriangle, Wifi, Edit2, Save, X } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocketNotifications } from "@/hooks/use-websocket-notifications";
import type { Ticket as TicketType, Contact, Account } from "@shared/schema";

export default function TicketsPage() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editingTicket, setEditingTicket] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<TicketType>>({});
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocketNotifications();

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await fetch("/api/tickets");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Tickets API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Accounts API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Contacts API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating ticket with data:", data);
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ticket creation error:", errorData);
        throw new Error(errorData.error || "Failed to create ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setShowForm(false);
    },
    onError: (error) => {
      console.error("Ticket creation failed:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<TicketType>) => {
      console.log("Updating ticket:", id, data);
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ticket update error:", errorData);
        throw new Error(errorData.error || "Failed to update ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error) => {
      console.error("Ticket update failed:", error);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTickets = (tickets || []).filter((ticket: TicketType) => {
    switch (filter) {
      case "open": return ticket.status === "open";
      case "in-progress": return ticket.status === "in-progress";
      case "resolved": return ticket.status === "resolved";
      case "overdue": return ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== "resolved";
      default: return true;
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Ticket className="h-8 w-8 text-rose-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                  Support Tickets
                  <div className="ml-3 flex items-center">
                    <Wifi className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`ml-1 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Live Updates' : 'Disconnected'}
                    </span>
                  </div>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage customer support requests and issues with live updates</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse"></div>
                Live Support
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Real-time Updates
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Smart Routing
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Clock className="w-4 h-4 mr-2" />
              Ticket Analytics
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          {["all", "open", "in-progress", "resolved", "overdue"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredTickets || []).map((ticket: TicketType) => {
            const contact = contacts.find((c: Contact) => String(c.id) === String(ticket.contactId));
            const account = accounts.find((a: Account) => String(a.id) === String(ticket.accountId));
            const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== "resolved";
            
            return (
              <Card key={ticket.id} className={`hover:shadow-lg transition-shadow ${isOverdue ? "border-red-200" : ""}`}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    {getPriorityIcon(ticket.priority || "medium")}
                    <CardTitle className="text-lg">#{ticket.id} {ticket.subject}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Badge className={getPriorityColor(ticket.priority || "medium")}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status || "open")}>
                        {ticket.status?.replace("-", " ")}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTicket(ticket.id);
                        setEditForm({
                          subject: ticket.subject,
                          description: ticket.description,
                          priority: ticket.priority,
                          status: ticket.status,
                          category: ticket.category,
                          subCategory: ticket.subCategory,
                          contactId: ticket.contactId,
                          accountId: ticket.accountId,
                        });
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingTicket === ticket.id ? (
                    <div className="space-y-3">
                      <input
                        value={editForm.subject || ""}
                        onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Subject"
                      />
                      
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        rows={3}
                        placeholder="Description"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editForm.status || "open"}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        
                        <select
                          value={editForm.priority || "medium"}
                          onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editForm.category || ""}
                          onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                          className="px-3 py-2 border rounded-md text-sm"
                          placeholder="Category"
                        />
                        
                        <input
                          value={editForm.subCategory || ""}
                          onChange={(e) => setEditForm({...editForm, subCategory: e.target.value})}
                          className="px-3 py-2 border rounded-md text-sm"
                          placeholder="Sub Category"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editForm.contactId || ""}
                          onChange={(e) => setEditForm({...editForm, contactId: e.target.value || null})}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Select Contact</option>
                          {(contacts || []).map((contact: Contact) => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={editForm.accountId || ""}
                          onChange={(e) => setEditForm({...editForm, accountId: e.target.value ? parseInt(e.target.value) : null})}
                          className="px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Select Account</option>
                          {(accounts || []).map((account: Account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMutation.mutate({
                              id: ticket.id,
                              ...editForm,
                              resolvedAt: editForm.status === "resolved" && ticket.status !== "resolved" ? new Date() : ticket.resolvedAt
                            });
                            setEditingTicket(null);
                            setEditForm({});
                          }}
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTicket(null);
                            setEditForm({});
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ticket.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {ticket.category && (
                          <Badge variant="outline">{ticket.category}</Badge>
                        )}
                        {ticket.subCategory && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {ticket.subCategory}
                          </Badge>
                        )}
                      </div>

                      {contact && (
                        <div className="flex items-center text-sm text-blue-600">
                          <User className="h-4 w-4 mr-2" />
                          {contact.name}
                        </div>
                      )}

                      {account && (
                        <div className="text-sm text-gray-600">
                          Account: {account.name}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Created: {new Date(ticket.createdAt!).toLocaleDateString()}</span>
                        {ticket.dueDate && (
                          <div className={`flex items-center ${isOverdue ? "text-red-600" : ""}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {new Date(ticket.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {ticket.resolvedAt && (
                        <div className="text-xs text-green-600">
                          Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const ticketData = {
                  subject: formData.get("subject"),
                  description: formData.get("description") || null,
                  priority: formData.get("priority") || "medium",
                  status: formData.get("status") || "open",
                  category: formData.get("category") || null,
                  subCategory: formData.get("subCategory") || null,
                  contactId: formData.get("contactId") || null,
                  accountId: formData.get("accountId") ? parseInt(formData.get("accountId") as string) : null,
                };
                console.log("Creating ticket with data:", ticketData);
                createMutation.mutate(ticketData);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="subject" placeholder="Ticket Subject" required className="px-3 py-2 border rounded-md" />
                  <select name="priority" className="px-3 py-2 border rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <select name="status" className="px-3 py-2 border rounded-md">
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <input name="category" placeholder="Category" className="px-3 py-2 border rounded-md" />
                  <input name="subCategory" placeholder="Sub Category" className="px-3 py-2 border rounded-md" />
                  
                  <select name="contactId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Contact</option>
                    {(contacts || []).map((contact: Contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                  
                  <select name="accountId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Account</option>
                    {(accounts || []).map((account: Account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                  
                  <input name="dueDate" type="datetime-local" className="px-3 py-2 border rounded-md" />
                </div>
                
                <textarea name="description" placeholder="Ticket Description" rows={4} className="w-full px-3 py-2 border rounded-md" />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}