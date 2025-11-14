import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Eye,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  Quote,
  HelpCircle,
  Loader2,
  Undo2,
  ExternalLink
} from "lucide-react";

interface Benefit {
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface LandingPageData {
  id: string;
  headline: string;
  subheadline: string;
  heroContent: string;
  heroImageUrl?: string;
  benefits: Benefit[];
  testimonials: Testimonial[];
  ctaText: string;
  faqs: FAQ[];
}

interface LandingPageEditorProps {
  landingPage: LandingPageData;
  funnelId: string;
}

export default function LandingPageEditor({ landingPage, funnelId }: LandingPageEditorProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [editedData, setEditedData] = useState<LandingPageData>(landingPage);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewingEdits, setPreviewingEdits] = useState(false);

  useEffect(() => {
    setEditedData(landingPage);
    setHasChanges(false);
    setPreviewingEdits(false);
  }, [landingPage]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<LandingPageData>) => {
      return await apiRequest('PUT', `/api/funnels/${funnelId}/landing-pages/${landingPage.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', funnelId] });
      toast({
        title: "✅ Changes Saved",
        description: "Your landing page has been updated successfully.",
      });
      setHasChanges(false);
      setPreviewingEdits(false);
      setMode('preview');
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = (field: keyof LandingPageData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleBenefitChange = (index: number, field: keyof Benefit, value: string) => {
    const newBenefits = [...editedData.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    handleFieldChange('benefits', newBenefits);
  };

  const addBenefit = () => {
    handleFieldChange('benefits', [
      ...editedData.benefits,
      { title: 'New Benefit', description: 'Describe the benefit here' }
    ]);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = editedData.benefits.filter((_, i) => i !== index);
    handleFieldChange('benefits', newBenefits);
  };

  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string) => {
    const newTestimonials = [...editedData.testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    handleFieldChange('testimonials', newTestimonials);
  };

  const addTestimonial = () => {
    handleFieldChange('testimonials', [
      ...editedData.testimonials,
      { quote: 'Add testimonial quote', author: 'Customer Name', role: 'Their Role' }
    ]);
  };

  const removeTestimonial = (index: number) => {
    const newTestimonials = editedData.testimonials.filter((_, i) => i !== index);
    handleFieldChange('testimonials', newTestimonials);
  };

  const handleFAQChange = (index: number, field: keyof FAQ, value: string) => {
    const newFAQs = [...editedData.faqs];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    handleFieldChange('faqs', newFAQs);
  };

  const addFAQ = () => {
    handleFieldChange('faqs', [
      ...editedData.faqs,
      { question: 'New question?', answer: 'Answer here' }
    ]);
  };

  const removeFAQ = (index: number) => {
    const newFAQs = editedData.faqs.filter((_, i) => i !== index);
    handleFieldChange('faqs', newFAQs);
  };

  const handleSave = () => {
    const { id, ...dataToSave } = editedData;
    saveMutation.mutate(dataToSave);
  };

  const handleDiscard = () => {
    setEditedData(landingPage);
    setHasChanges(false);
    setPreviewingEdits(false);
    setMode('preview');
  };

  const handlePreviewEdits = () => {
    setPreviewingEdits(true);
    setMode('preview');
  };

  const handleEdit = () => {
    setPreviewingEdits(false);
    setMode('edit');
  };

  const currentData = mode === 'edit' 
    ? editedData 
    : previewingEdits 
      ? editedData
      : landingPage;

  return (
    <div className="space-y-6">
      {/* Editor Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {mode === 'preview' ? (
                  <>
                    <Eye className="h-5 w-5" />
                    Preview Mode
                  </>
                ) : (
                  <>
                    <Edit2 className="h-5 w-5" />
                    Edit Mode
                  </>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {mode === 'preview' 
                  ? (previewingEdits 
                      ? 'Previewing your unsaved changes - click "Continue Editing" to make more changes or "Save Changes" to publish'
                      : 'View your landing page as it will appear to visitors')
                  : 'Edit your landing page content and styling'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  Unsaved Changes
                </Badge>
              )}
              
              {mode === 'preview' ? (
                <>
                  <Button
                    onClick={() => window.open(`/funnels/${funnelId}/preview`, '_blank', 'noopener,noreferrer')}
                    variant="outline"
                    data-testid="button-view-landing-page"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Landing Page
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant={previewingEdits ? "outline" : "default"}
                    data-testid="button-enter-edit-mode"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {previewingEdits ? 'Continue Editing' : 'Edit Page'}
                  </Button>
                  {previewingEdits && (
                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending || !hasChanges}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      data-testid="button-save-changes-preview"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleDiscard}
                    variant="outline"
                    disabled={saveMutation.isPending || !hasChanges}
                    data-testid="button-discard-changes"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                  <Button
                    onClick={handlePreviewEdits}
                    variant="outline"
                    disabled={saveMutation.isPending}
                    data-testid="button-preview"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Changes
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !hasChanges}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    data-testid="button-save-changes"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preview Mode */}
      {mode === 'preview' && (
        <div className="space-y-8" data-testid="preview-mode-container">
          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-2">
            <CardContent className="py-12 px-6 lg:px-12 text-center">
              {currentData.heroImageUrl && (
                <img 
                  src={currentData.heroImageUrl} 
                  alt={currentData.headline}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                  data-testid="preview-hero-image"
                />
              )}
              <h1 
                className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                data-testid="preview-headline"
              >
                {currentData.headline}
              </h1>
              <p 
                className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-6 max-w-3xl mx-auto"
                data-testid="preview-subheadline"
              >
                {currentData.subheadline}
              </p>
              <p 
                className="text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto"
                data-testid="preview-hero-content"
              >
                {currentData.heroContent}
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg px-8 py-6 h-auto"
                data-testid="preview-cta-button"
              >
                {currentData.ctaText}
              </Button>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          {currentData.benefits.length > 0 && (
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-center">Key Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="preview-benefits-grid">
                {currentData.benefits.map((benefit, idx) => (
                  <Card key={idx} className="hover-elevate" data-testid={`preview-benefit-${idx}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{benefit.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials Section */}
          {currentData.testimonials.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-8">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-center">What People Are Saying</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="preview-testimonials-grid">
                {currentData.testimonials.map((testimonial, idx) => (
                  <Card key={idx} data-testid={`preview-testimonial-${idx}`}>
                    <CardContent className="pt-6">
                      <Quote className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
                      <p className="italic text-gray-700 dark:text-gray-300 mb-4">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {currentData.faqs.length > 0 && (
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                <HelpCircle className="h-7 w-7" />
                Frequently Asked Questions
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible data-testid="preview-faqs-accordion">
                    {currentData.faqs.map((faq, idx) => (
                      <AccordionItem key={idx} value={`faq-${idx}`} data-testid={`preview-faq-${idx}`}>
                        <AccordionTrigger className="text-left font-semibold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Final CTA */}
          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <CardContent className="py-12 px-6 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of satisfied customers today
              </p>
              <Button 
                size="lg"
                variant="outline"
                className="bg-white text-orange-600 hover:bg-gray-100 border-0 text-lg px-8 py-6 h-auto"
                data-testid="preview-final-cta-button"
              >
                {currentData.ctaText}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Mode */}
      {mode === 'edit' && (
        <div className="space-y-6" data-testid="edit-mode-container">
          {/* Hero Section Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Headline *</label>
                <Input
                  value={editedData.headline}
                  onChange={(e) => handleFieldChange('headline', e.target.value)}
                  placeholder="Your compelling headline here..."
                  className="text-lg"
                  data-testid="input-headline"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Subheadline *</label>
                <Textarea
                  value={editedData.subheadline}
                  onChange={(e) => handleFieldChange('subheadline', e.target.value)}
                  placeholder="Supporting headline text..."
                  rows={2}
                  data-testid="textarea-subheadline"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hero Content *</label>
                <Textarea
                  value={editedData.heroContent}
                  onChange={(e) => handleFieldChange('heroContent', e.target.value)}
                  placeholder="Main value proposition..."
                  rows={3}
                  data-testid="textarea-hero-content"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Call-to-Action Text *</label>
                <Input
                  value={editedData.ctaText}
                  onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                  placeholder="Get Started Now"
                  data-testid="input-cta-text"
                />
              </div>
            </CardContent>
          </Card>

          {/* Benefits Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Benefits ({editedData.benefits.length})</CardTitle>
                <Button
                  onClick={addBenefit}
                  size="sm"
                  variant="outline"
                  data-testid="button-add-benefit"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Benefit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedData.benefits.map((benefit, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3" data-testid={`edit-benefit-${idx}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Benefit {idx + 1}</span>
                    <Button
                      onClick={() => removeBenefit(idx)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-remove-benefit-${idx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={benefit.title}
                    onChange={(e) => handleBenefitChange(idx, 'title', e.target.value)}
                    placeholder="Benefit title"
                    data-testid={`input-benefit-title-${idx}`}
                  />
                  <Textarea
                    value={benefit.description}
                    onChange={(e) => handleBenefitChange(idx, 'description', e.target.value)}
                    placeholder="Benefit description"
                    rows={2}
                    data-testid={`textarea-benefit-description-${idx}`}
                  />
                </div>
              ))}
              {editedData.benefits.length === 0 && (
                <p className="text-center text-gray-500 py-4">No benefits added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Testimonials Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Testimonials ({editedData.testimonials.length})</CardTitle>
                <Button
                  onClick={addTestimonial}
                  size="sm"
                  variant="outline"
                  data-testid="button-add-testimonial"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Testimonial
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedData.testimonials.map((testimonial, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3" data-testid={`edit-testimonial-${idx}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Testimonial {idx + 1}</span>
                    <Button
                      onClick={() => removeTestimonial(idx)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-remove-testimonial-${idx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={testimonial.quote}
                    onChange={(e) => handleTestimonialChange(idx, 'quote', e.target.value)}
                    placeholder="Testimonial quote"
                    rows={2}
                    data-testid={`textarea-testimonial-quote-${idx}`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={testimonial.author}
                      onChange={(e) => handleTestimonialChange(idx, 'author', e.target.value)}
                      placeholder="Author name"
                      data-testid={`input-testimonial-author-${idx}`}
                    />
                    <Input
                      value={testimonial.role}
                      onChange={(e) => handleTestimonialChange(idx, 'role', e.target.value)}
                      placeholder="Their role/title"
                      data-testid={`input-testimonial-role-${idx}`}
                    />
                  </div>
                </div>
              ))}
              {editedData.testimonials.length === 0 && (
                <p className="text-center text-gray-500 py-4">No testimonials added yet</p>
              )}
            </CardContent>
          </Card>

          {/* FAQs Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>FAQs ({editedData.faqs.length})</CardTitle>
                <Button
                  onClick={addFAQ}
                  size="sm"
                  variant="outline"
                  data-testid="button-add-faq"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedData.faqs.map((faq, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3" data-testid={`edit-faq-${idx}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">FAQ {idx + 1}</span>
                    <Button
                      onClick={() => removeFAQ(idx)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-remove-faq-${idx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={faq.question}
                    onChange={(e) => handleFAQChange(idx, 'question', e.target.value)}
                    placeholder="Question"
                    data-testid={`input-faq-question-${idx}`}
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => handleFAQChange(idx, 'answer', e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    data-testid={`textarea-faq-answer-${idx}`}
                  />
                </div>
              ))}
              {editedData.faqs.length === 0 && (
                <p className="text-center text-gray-500 py-4">No FAQs added yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
