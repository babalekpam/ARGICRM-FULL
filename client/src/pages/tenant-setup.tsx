import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Settings, Shield } from "lucide-react";

const tenantSetupSchema = z.object({
  tenantName: z.string().min(2, "Company name must be at least 2 characters"),
  domain: z.string().min(3, "Domain must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Domain can only contain lowercase letters, numbers, and hyphens"),
  subscriptionPlan: z.enum(["starter", "professional", "enterprise"]),
  adminEmail: z.string().email("Valid email required"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminFirstName: z.string().min(1, "First name required"),
  adminLastName: z.string().min(1, "Last name required"),
});

type TenantSetupForm = z.infer<typeof tenantSetupSchema>;

export default function TenantSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<TenantSetupForm>({
    resolver: zodResolver(tenantSetupSchema),
    defaultValues: {
      tenantName: "",
      domain: "",
      subscriptionPlan: "starter",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
    },
  });

  const onSubmit = async (data: TenantSetupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Success!",
          description: `Tenant "${data.tenantName}" created successfully. You can now login with your admin credentials.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Setup Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your company dashboard has been created successfully. 
            </p>
            <p className="text-sm text-gray-500">
              Access your dashboard at: <strong>{form.getValues().domain}.argilette.com</strong>
            </p>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your Company Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Set up your isolated CRM environment with full administrative control
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantName">Company Name</Label>
                    <Input
                      id="tenantName"
                      {...form.register("tenantName")}
                      placeholder="ACME Corporation"
                    />
                    {form.formState.errors.tenantName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.tenantName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="domain">Custom Domain</Label>
                    <div className="flex">
                      <Input
                        id="domain"
                        {...form.register("domain")}
                        placeholder="acme"
                        className="rounded-r-none"
                      />
                      <span className="bg-gray-100 border border-l-0 px-3 py-2 text-sm text-gray-600 rounded-r-md">
                        .argilette.com
                      </span>
                    </div>
                    {form.formState.errors.domain && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.domain.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <Select 
                    value={form.watch("subscriptionPlan")}
                    onValueChange={(value) => form.setValue("subscriptionPlan", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">
                        Starter - Up to 5 users
                      </SelectItem>
                      <SelectItem value="professional">
                        Professional - Up to 25 users
                      </SelectItem>
                      <SelectItem value="enterprise">
                        Enterprise - Up to 100 users
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Super Admin Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Administrator Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <Input
                      id="adminFirstName"
                      {...form.register("adminFirstName")}
                      placeholder="John"
                    />
                    {form.formState.errors.adminFirstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.adminFirstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <Input
                      id="adminLastName"
                      {...form.register("adminLastName")}
                      placeholder="Doe"
                    />
                    {form.formState.errors.adminLastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.adminLastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminEmail">Email Address</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    {...form.register("adminEmail")}
                    placeholder="john@acme.com"
                  />
                  {form.formState.errors.adminEmail && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    {...form.register("adminPassword")}
                    placeholder="Minimum 8 characters"
                  />
                  {form.formState.errors.adminPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Complete Isolation</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Your own database</li>
                      <li>• Custom subdomain</li>
                      <li>• Isolated user management</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Admin Controls</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Create custom roles</li>
                      <li>• Manage permissions</li>
                      <li>• User administration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 text-lg"
            >
              {isLoading ? "Creating Your Dashboard..." : "Create Company Dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}