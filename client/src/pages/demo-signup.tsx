import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { UserPlus, Building2, ArrowLeft } from "lucide-react";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  phone: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function DemoSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      // Simulate demo account creation
      const demoEmail = `demo.${data.firstName.toLowerCase()}.${Date.now()}@demo.argilette.com`;
      const demoPassword = "demo123";

      // Create demo user account
      localStorage.setItem('demo_user', JSON.stringify({
        ...data,
        email: demoEmail,
        password: demoPassword,
        accountType: 'demo',
        createdAt: new Date().toISOString(),
        features: ['contacts', 'deals', 'tasks', 'analytics'] // Limited demo features
      }));

      toast({
        title: "Demo Account Created!",
        description: `Welcome ${data.firstName}! Your demo account is ready.`,
      });

      // Auto-login the demo user
      await login(demoEmail, demoPassword);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "There was an error creating your demo account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">NODE CRM</h1>
          <p className="text-gray-600 mt-2">
            Start Your Free Demo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Create Demo Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="John"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Smith"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="john@company.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  {...form.register("company")}
                  placeholder="Your Company"
                />
                {form.formState.errors.company && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.company.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  placeholder="+1 (314) 472-3839"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Creating Demo Account..." : "Start Free Demo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Demo Features Include:</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Contact Management</li>
              <li>• Deal Pipeline</li>
              <li>• Task Organization</li>
              <li>• Basic Analytics</li>
              <li>• Email Integration</li>
            </ul>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}