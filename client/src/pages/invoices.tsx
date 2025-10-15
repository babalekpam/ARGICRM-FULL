import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, DollarSign, Calendar, Building2, Calculator } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { handlePhoneInput } from "@/lib/phone-validation";

import type { Invoice } from "@shared/schema";

export default function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    accountId: "",
    contactId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    amount: "",
    tax: "",
    discount: "",
    status: "draft",
    dueDate: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Invoices API response:", data);
      return data;
    },
    staleTime: 0,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Accounts data:", data);
      return data;
    },
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Contacts data:", data);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating invoice with data:", data);
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Invoice creation error:", errorData);
        throw new Error(errorData.error || "Failed to create invoice");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowForm(false);
      // Reset form data
      setFormData({
        invoiceNumber: "",
        accountId: "",
        contactId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        amount: "",
        tax: "",
        discount: "",
        status: "draft",
        dueDate: "",
        notes: ""
      });
      setSelectedAccount(null);
      setSelectedContact(null);
    },
    onError: (error) => {
      console.error("Invoice creation failed:", error);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = String(Date.now()).slice(-6); // Last 6 digits for more uniqueness
    return `INV-${year}${month}${day}-${timestamp}`;
  };

  // Initialize form when component loads
  useEffect(() => {
    if (showForm && !formData.invoiceNumber) {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber()
      }));
    }
  }, [showForm]);

  // Auto-populate customer information when account is selected
  const handleAccountSelection = (accountId: string) => {
    console.log("Account selection triggered:", accountId);
    console.log("Available accounts:", accounts);
    console.log("Account types:", accounts.map((a: any) => ({ id: a.id, type: typeof a.id })));
    
    // Try different ID matching strategies
    let account = (accounts as any[]).find((a: any) => a.id === parseInt(accountId));
    if (!account) {
      account = (accounts as any[]).find((a: any) => a.id.toString() === accountId);
    }
    if (!account) {
      account = (accounts as any[]).find((a: any) => a.id === accountId);
    }
    
    console.log("Found account:", account);
    
    if (account) {
      setSelectedAccount(account);
      const newFormData = {
        ...formData,
        accountId,
        customerName: account.name || "",
        customerEmail: account.email || "",
        customerPhone: account.phone || "",
        customerAddress: `${account.address || ""} ${account.city || ""} ${account.state || ""} ${account.zipCode || ""}`.trim()
      };
      console.log("Setting form data:", newFormData);
      setFormData(newFormData);
    } else {
      console.log("No account found for ID:", accountId);
    }
  };

  // Auto-populate contact information when contact is selected
  const handleContactSelection = (contactId: string) => {
    console.log("Contact selection triggered:", contactId);
    console.log("Available contacts:", contacts);
    console.log("Contact types:", contacts.map((c: any) => ({ id: c.id, type: typeof c.id })));
    
    // Try different ID matching strategies
    let contact = (contacts as any[]).find((c: any) => c.id === contactId);
    if (!contact) {
      contact = (contacts as any[]).find((c: any) => c.id.toString() === contactId);
    }
    if (!contact) {
      contact = (contacts as any[]).find((c: any) => c.id === parseInt(contactId));
    }
    
    console.log("Found contact:", contact);
    
    if (contact) {
      setSelectedContact(contact);
      const newFormData = {
        ...formData,
        contactId,
        customerName: contact.name || formData.customerName,
        customerEmail: contact.email || formData.customerEmail,
        customerPhone: contact.phone || formData.customerPhone,
        customerAddress: contact.address || contact.company || formData.customerAddress
      };
      console.log("Setting form data:", newFormData);
      setFormData(newFormData);
    } else {
      console.log("No contact found for ID:", contactId);
    }
  };

  // Handle form field updates
  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Amount field updated, no automatic tax calculation needed
  };

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
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Invoice Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage your billing and invoice processing with smart automation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                Smart Billing
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Auto-Processing
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Payment Tracking
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <DollarSign className="w-4 h-4 mr-2" />
              Payment Reports
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice: Invoice) => {
            const account = accounts.find((a: any) => a.id === invoice.accountId);
            const contact = contacts.find((c: any) => c.id === invoice.contactId);
            const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";
            
            return (
              <Card key={invoice.id} className={`hover:shadow-lg transition-shadow ${isOverdue ? "border-red-200" : ""}`}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(invoice.status || "draft")}>
                    {invoice.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-green-600">
                      ${parseFloat(invoice.total).toLocaleString()}
                    </div>

                    {account && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        {account.name}
                      </div>
                    )}

                    {contact && (
                      <div className="text-sm text-gray-600">
                        Contact: {contact.name}
                      </div>
                    )}

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${parseFloat(invoice.amount).toLocaleString()}</span>
                      </div>
                      {parseFloat(invoice.tax || "0") > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Tax:</span>
                          <span>${parseFloat(invoice.tax || "0").toLocaleString()}</span>
                        </div>
                      )}
                      {parseFloat(invoice.discount || "0") > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Discount:</span>
                          <span>-${parseFloat(invoice.discount || "0").toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created: {new Date(invoice.createdAt!).toLocaleDateString()}
                      </div>
                      {invoice.dueDate && (
                        <div className={`flex items-center ${isOverdue ? "text-red-600" : ""}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {invoice.paidDate && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Paid: {new Date(invoice.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {invoice.notes && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes: </span>
                        {invoice.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
              <p className="text-sm text-gray-600">
                Select an account or contact to auto-populate customer information
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                
                // Manual tax calculation only
                const amount = parseFloat(formData.amount);
                const manualTax = parseFloat(formData.tax || "0");
                const discount = parseFloat(formData.discount || "0");
                
                const finalTax = manualTax;
                const total = amount + manualTax - discount;
                
                // Validate required fields
                if (!formData.invoiceNumber || !formData.accountId || !formData.amount || isNaN(amount)) {
                  console.error("Missing or invalid required fields:", {
                    invoiceNumber: formData.invoiceNumber,
                    accountId: formData.accountId,
                    amount: formData.amount,
                    parsedAmount: amount
                  });
                  alert("Please fill in all required fields: Invoice Number, Account, and Amount (must be a valid number)");
                  return;
                }

                const invoiceData = {
                  invoiceNumber: generateInvoiceNumber(), // Generate fresh unique number
                  accountId: parseInt(formData.accountId),
                  contactId: formData.contactId ? parseInt(formData.contactId) : null,
                  amount: amount.toString(),
                  tax: finalTax.toString(),
                  discount: discount.toString(),
                  total: Math.max(0, total).toString(),
                  status: formData.status,
                  dueDate: formData.dueDate || null,
                  notes: formData.notes,
                };
                
                console.log("Invoice form data before submission:", invoiceData);
                console.log("Manual tax entry - no automatic calculation");
                console.log("Form validation passed, submitting...");
                
                try {
                  createMutation.mutate(invoiceData);
                } catch (error) {
                  console.error("Error during mutation:", error);
                  alert("Error submitting invoice: " + (error instanceof Error ? error.message : 'Unknown error'));
                }
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    name="invoiceNumber" 
                    placeholder="Invoice Number" 
                    value={formData.invoiceNumber}
                    onChange={(e) => updateFormField("invoiceNumber", e.target.value)}
                    className="px-3 py-2 border rounded-md" 
                  />
                  
                  <select 
                    name="accountId" 
                    required 
                    value={formData.accountId}
                    onChange={(e) => {
                      updateFormField("accountId", e.target.value);
                      handleAccountSelection(e.target.value);
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Account ({(accounts as any[]).length} available)</option>
                    {(accounts as any[]).map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.email}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    name="contactId" 
                    value={formData.contactId}
                    onChange={(e) => {
                      updateFormField("contactId", e.target.value);
                      handleContactSelection(e.target.value);
                    }}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Contact ({(contacts as any[]).length} available)</option>
                    {(contacts as any[]).map((contact: any) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    name="status" 
                    value={formData.status}
                    onChange={(e) => updateFormField("status", e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Customer Information Section - Auto-populated from Account/Contact */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      name="customerName" 
                      placeholder="Customer Name" 
                      value={formData.customerName}
                      onChange={(e) => updateFormField("customerName", e.target.value)}
                      className="px-3 py-2 border rounded-md" 
                    />
                    <input 
                      name="customerEmail" 
                      type="email"
                      placeholder="Customer Email" 
                      value={formData.customerEmail}
                      onChange={(e) => updateFormField("customerEmail", e.target.value)}
                      className="px-3 py-2 border rounded-md" 
                    />
                    <input 
                      name="customerPhone" 
                      placeholder="Customer Phone (10 digits)" 
                      value={formData.customerPhone}
                      onChange={(e) => handlePhoneInput(e.target.value, (value) => updateFormField("customerPhone", value))}
                      maxLength={10}
                      className="px-3 py-2 border rounded-md" 
                    />
                    <input 
                      name="customerAddress" 
                      placeholder="Customer Address" 
                      value={formData.customerAddress}
                      onChange={(e) => updateFormField("customerAddress", e.target.value)}
                      className="px-3 py-2 border rounded-md" 
                    />
                  </div>
                </div>

                {/* Invoice Details Section */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Invoice Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="Amount" 
                      required 
                      value={formData.amount}
                      onChange={(e) => updateFormField("amount", e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input 
                      name="tax" 
                      type="number" 
                      step="0.01" 
                      placeholder="Tax Amount"
                      value={formData.tax}
                      onChange={(e) => updateFormField("tax", e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input 
                      name="discount" 
                      type="number" 
                      step="0.01" 
                      placeholder="Discount" 
                      value={formData.discount}
                      onChange={(e) => updateFormField("discount", e.target.value)}
                      className="px-3 py-2 border rounded-md" 
                    />
                    <input 
                      name="dueDate" 
                      type="date" 
                      placeholder="Due Date" 
                      value={formData.dueDate}
                      onChange={(e) => updateFormField("dueDate", e.target.value)}
                      className="px-3 py-2 border rounded-md" 
                    />
                  </div>
                </div>
                
                <textarea 
                  name="notes" 
                  placeholder="Invoice Notes" 
                  rows={3} 
                  value={formData.notes}
                  onChange={(e) => updateFormField("notes", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" 
                />
                
                {/* Tax calculation disabled to prevent API spam */}

                {/* Show selected customer summary */}
                {(selectedAccount || selectedContact) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">Selected Customer Information</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      {selectedAccount && <div>Account: {selectedAccount.name}</div>}
                      {selectedContact && <div>Contact: {selectedContact.name}</div>}
                      {formData.customerEmail && <div>Email: {formData.customerEmail}</div>}
                      {formData.customerPhone && <div>Phone: {formData.customerPhone}</div>}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Invoice"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      // Reset form data
                      setFormData({
                        invoiceNumber: "",
                        accountId: "",
                        contactId: "",
                        customerName: "",
                        customerEmail: "",
                        customerPhone: "",
                        customerAddress: "",
                        amount: "",
                        tax: "",
                        discount: "",
                        status: "draft",
                        dueDate: "",
                        notes: ""
                      });
                      setSelectedAccount(null);
                      setSelectedContact(null);
                    }}
                  >
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