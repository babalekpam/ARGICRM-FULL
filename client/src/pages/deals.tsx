import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, DollarSign, Calendar, User, Edit, Trash2, Save, BarChart3, Target, TrendingUp, ArrowLeft } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Deal } from "@shared/schema";
import { useSearch, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function DealsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle URL parameters from contact quick actions
  useEffect(() => {
    const params = new URLSearchParams(search);
    const contactId = params.get('contactId');
    const contactName = params.get('contactName');
    
    if (contactId && contactName) {
      setShowForm(true);
      toast({
        title: "Contact Pre-filled",
        description: `Ready to create deal for ${contactName}`,
      });
    }
  }, [search, toast]);

  const { data: dealsData, isLoading, refetch } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const response = await fetch("/api/deals");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Deals API response:", data);
      return data;
    },
    staleTime: 0,
  });
  const deals = dealsData || [];

  const { data: contactsData } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      if (!response.ok) return [];
      const data = await response.json();
      console.log("Contacts for deals:", data);
      return data;
    },
  });
  const contacts = contactsData || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      refetch();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      setIsSaving(true);
      const response = await apiRequest("PUT", `/api/deals/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setEditingDeal(null);
      setIsSaving(false);
      refetch();
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/deals/${id}`, null);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      refetch();
    },
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "qualification": return "bg-blue-100 text-blue-800";
      case "proposal": return "bg-yellow-100 text-yellow-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed-won": return "bg-green-100 text-green-800";
      case "closed-lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return "text-green-600";
    if (probability >= 50) return "text-yellow-600";
    if (probability >= 25) return "text-orange-600";
    return "text-red-600";
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
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Deal Pipeline
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your sales opportunities and revenue pipeline</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Active Pipeline
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Revenue Tracking
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                AI Insights
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {new URLSearchParams(search).get('contactId') && (
              <Button 
                variant="outline" 
                onClick={() => setLocation('/contacts')}
                className="bg-white shadow-md border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contacts
              </Button>
            )}
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Pipeline Analytics
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(deals || []).map((deal: Deal) => {
            const contact = contacts.find((c: any) => c.id === deal.contactId);
            
            return (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">{deal.name}</CardTitle>
                  </div>
                  <Badge className={getStageColor(deal.stage || "qualification")}>
                    {deal.stage?.replace("-", " ")}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deal.amount && (
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(deal.amount).toLocaleString()}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Probability</span>
                        <span className={getProbabilityColor(deal.probability || 0)}>
                          {deal.probability || 0}%
                        </span>
                      </div>
                      <Progress value={deal.probability || 0} className="h-2" />
                    </div>

                    {contact && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {contact.name}
                      </div>
                    )}

                    {deal.closeDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Close: {new Date(deal.closeDate).toLocaleDateString()}
                      </div>
                    )}

                    {deal.nextStep && (
                      <div className="text-sm">
                        <span className="font-medium">Next: </span>
                        {deal.nextStep}
                      </div>
                    )}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingDeal(deal)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${deal.name}? This action cannot be undone.`)) {
                            deleteMutation.mutate(deal.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const amount = formData.get("amount");
                createMutation.mutate({
                  name: formData.get("name"),
                  contactId: formData.get("contactId") ? parseInt(formData.get("contactId") as string) : null,
                  value: amount ? (amount as string) : null,
                  stage: formData.get("stage"),
                  probability: formData.get("probability") ? parseInt(formData.get("probability") as string) : null,
                  closeDate: formData.get("closeDate") || null,
                  nextStep: formData.get("nextStep") || null,
                  description: formData.get("description") || null,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Deal Name" required className="px-3 py-2 border rounded-md" />
                  <select name="contactId" className="px-3 py-2 border rounded-md">
                    <option value="">Select Contact</option>
                    {contacts.length > 0 ? (
                      (contacts || []).map((contact: any) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No contacts available</option>
                    )}
                  </select>
                  <input name="amount" type="number" step="0.01" placeholder="Deal Amount ($)" className="px-3 py-2 border rounded-md" />
                  <select name="stage" className="px-3 py-2 border rounded-md">
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed-won">Closed Won</option>
                    <option value="closed-lost">Closed Lost</option>
                  </select>
                  
                  <input name="probability" type="number" min="0" max="100" placeholder="Probability %" className="px-3 py-2 border rounded-md" />
                  <input name="closeDate" type="date" className="px-3 py-2 border rounded-md" />
                  <input name="nextStep" placeholder="Next Step" className="px-3 py-2 border rounded-md" />
                  <textarea name="description" placeholder="Deal Description" className="px-3 py-2 border rounded-md col-span-2" rows={3}></textarea>
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Deal"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingDeal && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Deal: {editingDeal.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editingDeal.id,
                  data: {
                    name: formData.get("name"),
                    contactId: formData.get("contactId") ? parseInt(formData.get("contactId") as string) : null,
                    value: formData.get("amount") || null,
                    stage: formData.get("stage"),
                    probability: formData.get("probability") ? parseInt(formData.get("probability") as string) : null,
                    closeDate: formData.get("closeDate") || null,
                    nextStep: formData.get("nextStep") || null,
                    description: formData.get("description") || null,
                  }
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    name="name" 
                    placeholder="Deal Name" 
                    defaultValue={editingDeal.name || ''} 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <select name="contactId" defaultValue={editingDeal.contactId || ''} className="px-3 py-2 border rounded-md">
                    <option value="">Select Contact</option>
                    {contacts.length > 0 ? (
                      (contacts || []).map((contact: any) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No contacts available</option>
                    )}
                  </select>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="Deal Amount ($)" 
                    defaultValue={editingDeal.amount || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <select name="stage" defaultValue={editingDeal.stage || 'prospecting'} className="px-3 py-2 border rounded-md">
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed-won">Closed Won</option>
                    <option value="closed-lost">Closed Lost</option>
                  </select>
                  <input 
                    name="probability" 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="Probability %" 
                    defaultValue={editingDeal.probability || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="closeDate" 
                    type="date" 
                    defaultValue={editingDeal.closeDate ? new Date(editingDeal.closeDate).toISOString().split('T')[0] : ''}
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="nextStep" 
                    placeholder="Next Step" 
                    defaultValue={editingDeal.nextStep || ''} 
                    className="px-3 py-2 border rounded-md col-span-2" 
                  />
                  <textarea 
                    name="description" 
                    placeholder="Deal Description" 
                    defaultValue={editingDeal.description || ''} 
                    className="px-3 py-2 border rounded-md col-span-2" 
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingDeal(null)}>
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