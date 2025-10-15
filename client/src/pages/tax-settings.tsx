import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Percent, MapPin, Calendar, Trash2, Calculator, FileText } from "lucide-react";
import Layout from "@/components/layout";
import type { TaxRate } from "@shared/schema";
import { useLocation } from "wouter";

export default function TaxSettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const { data: taxRates = [], isLoading } = useQuery<TaxRate[]>({
    queryKey: ["/api/tax-rates"],
    queryFn: async () => {
      const response = await fetch("/api/tax-rates");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/tax-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create tax rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-rates"] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tax-rates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete tax rate");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-rates"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/tax-rates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        throw new Error("Failed to update tax rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-rates"] });
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sales_tax": return "bg-blue-100 text-blue-800";
      case "vat": return "bg-green-100 text-green-800";
      case "gst": return "bg-purple-100 text-purple-800";
      case "income_tax": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatRate = (rate: string) => {
    return `${(parseFloat(rate) * 100).toFixed(2)}%`;
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-8 w-8 mr-3" />
              Tax Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage tax rates and calculation rules</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setLocation('/bookkeeping')}>
              <Calculator className="h-4 w-4 mr-2" />
              Bookkeeping
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taxRates.map((taxRate: TaxRate) => (
            <Card key={taxRate.id} className={`hover:shadow-lg transition-shadow ${!taxRate.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Percent className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-lg">{taxRate.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMutation.mutate({ id: taxRate.id, isActive: !taxRate.isActive })}
                  >
                    {taxRate.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(taxRate.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {formatRate(taxRate.rate)}
                    </span>
                    <Badge className={getTypeColor(taxRate.type)}>
                      {taxRate.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {taxRate.jurisdiction}
                        {taxRate.region && ` - ${taxRate.region}`}
                        {taxRate.city && ` - ${taxRate.city}`}
                      </span>
                    </div>

                    {taxRate.effectiveDate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Effective: {new Date(taxRate.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {taxRate.expiryDate && (
                      <div className="flex items-center text-sm text-red-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Expires: {new Date(taxRate.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {taxRate.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {taxRate.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Create New Tax Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get("name"),
                  rate: (parseFloat(formData.get("rate") as string) / 100).toString(), // Convert percentage to decimal
                  type: formData.get("type"),
                  jurisdiction: formData.get("jurisdiction"),
                  region: formData.get("region") || null,
                  city: formData.get("city") || null,
                  zipCode: formData.get("zipCode") || null,
                  description: formData.get("description") || null,
                  isActive: true,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Tax Rate Name" required className="px-3 py-2 border rounded-md" />
                  
                  <input 
                    name="rate" 
                    type="number" 
                    step="0.01" 
                    placeholder="Rate (%)" 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  
                  <select name="type" required className="px-3 py-2 border rounded-md">
                    <option value="">Select Type</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="vat">VAT</option>
                    <option value="gst">GST</option>
                    <option value="income_tax">Income Tax</option>
                  </select>
                  
                  <input name="jurisdiction" placeholder="Jurisdiction (e.g., US, UK)" required className="px-3 py-2 border rounded-md" />
                  
                  <input name="region" placeholder="State/Region (optional)" className="px-3 py-2 border rounded-md" />
                  
                  <input name="city" placeholder="City (optional)" className="px-3 py-2 border rounded-md" />
                  
                  <input name="zipCode" placeholder="ZIP Code (optional)" className="px-3 py-2 border rounded-md" />
                </div>
                
                <textarea name="description" placeholder="Description (optional)" rows={3} className="w-full px-3 py-2 border rounded-md" />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Tax Rate"}
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