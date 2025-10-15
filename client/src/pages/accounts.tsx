import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, DollarSign, Trash2, Edit, Save, BarChart3 } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Account } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function AccountsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if user is platform owner - platform owners can see all accounts
  const isPlatformOwner = user?.email === 'admin@default.com' || user?.email === 'abel@argilette.com';
  
  console.log("DEBUG - User email:", user?.email);
  console.log("DEBUG - isPlatformOwner:", isPlatformOwner);

  const { data: allAccounts = [], isLoading, refetch } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    staleTime: 0,
  });

  // Filter data based on user role - Platform owners see all test data, other users see empty/clean data
  const accounts = isPlatformOwner ? (allAccounts || []) : []; // Non-platform users see no pre-populated accounts
  
  console.log("DEBUG - allAccounts:", allAccounts);
  console.log("DEBUG - accounts (after filter):", accounts);
  console.log("DEBUG - accounts.length:", (accounts || []).length);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      refetch();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      setIsSaving(true);
      const response = await apiRequest("PUT", `/api/accounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setEditingAccount(null);
      setIsSaving(false);
      refetch();
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/accounts/${id}`, null);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      refetch();
    },
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
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Account Management
                  </h1>
                  {!isPlatformOwner && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Clean Data View
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your customer accounts and enterprise relationships</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                Enterprise Ready
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Account Tracking
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Revenue Intelligence
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Account Analytics
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(accounts || []).map((account: Account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                </div>
                <Badge variant={account.accountType === "customer" ? "default" : "secondary"}>
                  {account.accountType || "prospect"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {account.industry && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account.industry}</p>
                  )}
                  {account.website && (
                    <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                      {account.website}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {account.employees || "N/A"} employees
                    </div>
                    {account.annualRevenue && (
                      <div className="flex items-center text-sm text-green-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {parseFloat(account.annualRevenue).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAccount(account)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/reports?accountId=${account.id}&accountName=${encodeURIComponent(account.name)}`)}
                      title="Generate Report for this Account"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${account.name}? This action cannot be undone.`)) {
                          deleteMutation.mutate(account.id);
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
          ))}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get("name"),
                  industry: formData.get("industry"),
                  website: formData.get("website"),
                  phone: formData.get("phone"),
                  email: formData.get("email"),
                  accountType: formData.get("accountType"),
                  employees: formData.get("employees") ? parseInt(formData.get("employees") as string) : null,
                  annualRevenue: formData.get("annualRevenue") || null,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Account Name" required className="px-3 py-2 border rounded-md" />
                  <input name="industry" placeholder="Industry" className="px-3 py-2 border rounded-md" />
                  <input name="website" placeholder="Website" className="px-3 py-2 border rounded-md" />
                  <input name="phone" placeholder="Phone" className="px-3 py-2 border rounded-md" />
                  <input name="email" type="email" placeholder="Email" className="px-3 py-2 border rounded-md" />
                  <select name="accountType" className="px-3 py-2 border rounded-md">
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                  </select>
                  <input name="employees" type="number" placeholder="Number of Employees" className="px-3 py-2 border rounded-md" />
                  <input name="annualRevenue" placeholder="Annual Revenue" className="px-3 py-2 border rounded-md" />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingAccount && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Account: {editingAccount.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editingAccount.id,
                  data: {
                    name: formData.get("name"),
                    industry: formData.get("industry"),
                    website: formData.get("website"),
                    phone: formData.get("phone"),
                    email: formData.get("email"),
                    accountType: formData.get("accountType"),
                    employees: formData.get("employees") ? parseInt(formData.get("employees") as string) : null,
                    annualRevenue: formData.get("annualRevenue") || null,
                  }
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    name="name" 
                    placeholder="Account Name" 
                    defaultValue={editingAccount.name || ''} 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="industry" 
                    placeholder="Industry" 
                    defaultValue={editingAccount.industry || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="website" 
                    placeholder="Website" 
                    defaultValue={editingAccount.website || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="phone" 
                    placeholder="Phone" 
                    defaultValue={editingAccount.phone || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Email" 
                    defaultValue={editingAccount.email || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <select name="accountType" defaultValue={editingAccount.accountType || 'prospect'} className="px-3 py-2 border rounded-md">
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                  </select>
                  <input 
                    name="employees" 
                    type="number" 
                    placeholder="Number of Employees" 
                    defaultValue={editingAccount.employees || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="annualRevenue" 
                    placeholder="Annual Revenue" 
                    defaultValue={editingAccount.annualRevenue || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>
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