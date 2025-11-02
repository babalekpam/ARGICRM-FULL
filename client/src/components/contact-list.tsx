import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users, DollarSign, TrendingUp, AlertCircle, Mail, Receipt, Handshake, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ContactForm from "./contact-form";
import type { Contact } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function ContactList() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Check if user is platform owner - ONLY abel@argilette.org and admin@default.com
  const isPlatformOwner = user?.email === 'admin@default.com' || user?.email === 'abel@argilette.org';

  const { data: allContacts = [], isLoading, refetch, error } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch deals to link with contacts
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals"],
    staleTime: 0,
  });

  // All mutation hooks must be called before any conditional returns
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success!",
        description: "Contact deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message || "Failed to delete contact",
      });
    },
  });

  // Error handling - moved after all hooks
  if (error) {
    console.error("Contact List Error:", error);
    return (
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-2 text-sm font-medium text-foreground">Error Loading Contacts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message || "Failed to load contacts"}
            </p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show all contacts for authenticated users
  const contacts = allContacts;

  // Function to get deals linked to a contact
  const getContactDeals = (contactId: string) => {
    if (!deals || !Array.isArray(deals)) return [];
    
    // Convert contactId to number for comparison since deals may use numeric IDs
    const contactIdNum = parseInt(contactId);
    return deals.filter(deal => 
      deal && (
        deal.contactId === contactId || 
        deal.contactId === contactIdNum ||
        deal.contactId === parseInt(contactId)
      )
    );
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };

  // Cross-module quick actions
  const handleSendMessage = (contact: Contact) => {
    // Navigate to messaging with pre-filled recipient
    const params = new URLSearchParams({
      recipient: contact.email,
      name: contact.name
    });
    navigate(`/simple-messaging?${params.toString()}`);
    toast({
      title: "Redirecting to Messaging",
      description: `Preparing to send message to ${contact.name}`,
    });
  };

  const handleCreateInvoice = (contact: Contact) => {
    // Navigate to bookkeeping with pre-filled customer
    const params = new URLSearchParams({
      customer: contact.name,
      email: contact.email,
      action: 'new-invoice'
    });
    navigate(`/bookkeeping?${params.toString()}`);
    toast({
      title: "Creating Invoice",
      description: `Setting up invoice for ${contact.name}`,
    });
  };

  const handleCreateDeal = (contact: Contact) => {
    // Navigate to deals with pre-filled contact
    const params = new URLSearchParams({
      contactId: contact.id.toString(),
      contactName: contact.name
    });
    navigate(`/deals?${params.toString()}`);
    toast({
      title: "Creating Deal",
      description: `Setting up new deal for ${contact.name}`,
    });
  };

  const handleViewTransactions = (contact: Contact) => {
    // Navigate to bookkeeping filtered by this contact
    const params = new URLSearchParams({
      filter: 'customer',
      customer: contact.name
    });
    navigate(`/bookkeeping?${params.toString()}`);
    toast({
      title: "Viewing Transactions",
      description: `Showing financial history for ${contact.name}`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      "bg-primary/10 text-primary",
      "bg-success/10 text-success",
      "bg-warning/10 text-warning",
      "bg-destructive/10 text-destructive",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading contacts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Contact Management</h2>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus size={16} className="mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <ContactForm 
          onClose={() => {
            setShowAddForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
            refetch();
          }} 
        />
      )}

      {/* Contact List */}
      <CardContent className="p-6">
        {!contacts || contacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No contacts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first contact.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${getInitialsColor(contact.name)} rounded-full flex items-center justify-center`}>
                    <span className="font-semibold text-lg">{getInitials(contact.name)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    )}
                    {contact.company && (
                      <p className="text-xs text-muted-foreground">{contact.company}</p>
                    )}
                    {/* Show linked deals */}
                    {getContactDeals(contact.id).length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          {getContactDeals(contact.id).length} deal{getContactDeals(contact.id).length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row items-center gap-2">
                  {/* Cross-module quick actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(contact)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Send Message"
                    >
                      <Mail size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateInvoice(contact)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Create Invoice"
                    >
                      <Receipt size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateDeal(contact)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      title="Create Deal"
                    >
                      <Handshake size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTransactions(contact)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="View Transactions"
                    >
                      <FileText size={14} />
                    </Button>
                  </div>
                  
                  {/* Standard actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary"
                      title="Edit Contact"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete Contact"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {contacts.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing 1-{contacts.length} of {contacts.length} contacts
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="default" size="sm">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
