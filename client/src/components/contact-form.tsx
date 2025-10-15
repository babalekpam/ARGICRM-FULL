import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { handlePhoneInput } from "@/lib/phone-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface ContactFormProps {
  onClose: () => void;
}

export default function ContactForm({ onClose }: ContactFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await apiRequest("POST", "/api/contacts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.refetchQueries({ queryKey: ["/api/contacts"] });
      form.reset();
      toast({
        title: "Success!",
        description: "Contact added successfully",
      });
      setTimeout(() => {
        onClose();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message || "Failed to add contact",
      });
    },
  });

  const onSubmit = (data: InsertContact) => {
    createContactMutation.mutate(data);
  };

  return (
    <div className="p-6 border-b border-border bg-muted/50">
      <h3 className="text-md font-medium text-foreground mb-4">Add New Contact</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter full name"
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
              className="mt-1"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              placeholder="Enter phone number (10 digits)"
              maxLength={10}
              onChange={(e) => {
                const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
                e.target.value = formatted;
                form.setValue("phone", formatted);
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-sm font-medium text-foreground">Company</Label>
            <Input
              id="company"
              {...form.register("company")}
              placeholder="Enter company name"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            type="submit" 
            disabled={createContactMutation.isPending}
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            {createContactMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Contact
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
