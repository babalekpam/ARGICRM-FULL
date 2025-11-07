import Layout from "@/components/layout";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const testFormSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  description: z.string().optional(),
  type: z.enum(["landing_page", "email_campaign", "product_page", "form"]),
  targetUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  description: z.string().optional(),
  trafficAllocation: z.number().min(0).max(100),
  isControl: z.boolean(),
  content: z.record(z.any()).optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;
type VariantFormValues = z.infer<typeof variantSchema>;

export default function AbTestingCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<VariantFormValues[]>([
    {
      name: "Control (A)",
      description: "",
      trafficAllocation: 50,
      isControl: true,
      content: {},
    },
    {
      name: "Variant B",
      description: "",
      trafficAllocation: 50,
      isControl: false,
      content: {},
    },
  ]);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "landing_page",
      targetUrl: "",
      startDate: "",
      endDate: "",
    },
  });

  const addVariant = () => {
    const newTrafficAllocation = Math.floor(100 / (variants.length + 1));
    const updatedVariants = variants.map(v => ({
      ...v,
      trafficAllocation: newTrafficAllocation,
    }));
    
    setVariants([
      ...updatedVariants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length)}`,
        description: "",
        trafficAllocation: newTrafficAllocation,
        isControl: false,
        content: {},
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least 2 variants",
        variant: "destructive",
      });
      return;
    }
    
    const newVariants = variants.filter((_, i) => i !== index);
    const newTrafficAllocation = Math.floor(100 / newVariants.length);
    setVariants(newVariants.map(v => ({
      ...v,
      trafficAllocation: newTrafficAllocation,
    })));
  };

  const updateVariant = (index: number, field: keyof VariantFormValues, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    
    // If setting a variant as control, unset others
    if (field === "isControl" && value === true) {
      newVariants.forEach((v, i) => {
        if (i !== index) v.isControl = false;
      });
    }
    
    setVariants(newVariants);
  };

  const onSubmit = async (data: TestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Validate traffic allocation sums to 100
      const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        toast({
          title: "Invalid Traffic Allocation",
          description: `Traffic allocation must sum to 100%. Current total: ${totalAllocation}%`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Ensure at least one control variant
      if (!variants.some(v => v.isControl)) {
        toast({
          title: "No Control Variant",
          description: "Please mark one variant as the control",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create the test
      const testData = {
        ...data,
        targetUrl: data.targetUrl || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "draft",
      };

      const testResponse = await apiRequest("POST", "/api/ab-testing/tests", testData);
      const test = await testResponse.json();

      // Create variants
      await Promise.all(
        variants.map(async (variant) => {
          const response = await apiRequest("POST", `/api/ab-testing/tests/${test.id}/variants`, {
            ...variant,
            content: variant.content || {},
          });
          return response.json();
        })
      );

      toast({
        title: "Test Created",
        description: "Your A/B test has been created successfully",
      });

      setLocation(`/ab-testing/${test.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create test",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/ab-testing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create A/B Test</h1>
            <p className="text-muted-foreground">
              Set up a new A/B test to optimize your marketing campaigns
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Details */}
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
                <CardDescription>
                  Basic information about your A/B test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Homepage Hero Test Q1 2024"
                          data-testid="input-test-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what you're testing and your hypothesis"
                          data-testid="input-test-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-test-type">
                              <SelectValue placeholder="Select test type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="landing_page">Landing Page</SelectItem>
                            <SelectItem value="email_campaign">Email Campaign</SelectItem>
                            <SelectItem value="product_page">Product Page</SelectItem>
                            <SelectItem value="form">Form</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/page"
                            type="url"
                            data-testid="input-target-url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="input-start-date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty to start manually
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="input-end-date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave empty for manual completion
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Test Variants</CardTitle>
                  <CardDescription>
                    Configure the variants for your test
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  data-testid="button-add-variant"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {variants.map((variant, index) => (
                  <Card key={index} data-testid={`variant-card-${index}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-base">
                        Variant {String.fromCharCode(65 + index)}
                      </CardTitle>
                      {variants.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(index)}
                          data-testid={`button-remove-variant-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Variant Name</label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="e.g., Control, Blue Button, etc."
                          data-testid={`input-variant-name-${index}`}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={variant.description}
                          onChange={(e) => updateVariant(index, "description", e.target.value)}
                          placeholder="Describe this variant"
                          data-testid={`input-variant-description-${index}`}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Traffic Allocation (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={variant.trafficAllocation}
                          onChange={(e) =>
                            updateVariant(index, "trafficAllocation", Number(e.target.value))
                          }
                          data-testid={`input-traffic-allocation-${index}`}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`control-${index}`}
                          checked={variant.isControl}
                          onCheckedChange={(checked) =>
                            updateVariant(index, "isControl", checked)
                          }
                          data-testid={`checkbox-is-control-${index}`}
                        />
                        <label
                          htmlFor={`control-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Mark as control variant
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Link href="/ab-testing">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} data-testid="button-create-test-submit">
                {isSubmitting ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
