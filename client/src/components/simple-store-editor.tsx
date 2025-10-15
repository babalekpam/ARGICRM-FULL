import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SimpleStoreEditorProps {
  store: any;
}

export function SimpleStoreEditor({ store }: SimpleStoreEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: store.name || '',
    description: store.description || '',
    subdomain: store.subdomain || '',
    domain: store.domain || '',
    currency: store.currency || 'USD',
    primaryColor: store.primaryColor || '#3b82f6',
    secondaryColor: store.secondaryColor || '#f3f4f6',
    status: store.status || 'active'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/ecommerce/stores/${store.id}`, {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error("Failed to update store");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Updated",
        description: "Your store settings have been updated successfully."
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce/stores"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    console.log("Saving store data:", formData);
    updateStoreMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: store.name || '',
      description: store.description || '',
      subdomain: store.subdomain || '',
      domain: store.domain || '',
      currency: store.currency || 'USD',
      primaryColor: store.primaryColor || '#3b82f6',
      secondaryColor: store.secondaryColor || '#f3f4f6',
      status: store.status || 'active'
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Settings</CardTitle>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Store
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Store Name</Label>
              <p className="text-sm text-gray-600">{store.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-sm text-gray-600 capitalize">{store.status}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Subdomain</Label>
              <p className="text-sm text-gray-600">{store.subdomain}.argilette-store.com</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Currency</Label>
              <p className="text-sm text-gray-600">{store.currency}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm text-gray-600">{store.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: store.primaryColor }}
                />
                <span className="text-sm text-gray-600">{store.primaryColor}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Secondary Color</Label>
              <div className="flex gap-2 mt-1">
                <div 
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: store.secondaryColor }}
                />
                <span className="text-sm text-gray-600">{store.secondaryColor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Store Settings</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateStoreMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Store Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter store name"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter store description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
              placeholder="my-store"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.subdomain}.argilette-store.com</p>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-20 h-10 p-1"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-20 h-10 p-1"
              />
              <Input
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                placeholder="#f3f4f6"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {formData.domain && (
          <div>
            <Label htmlFor="domain">Custom Domain (Optional)</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="www.mystore.com"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}