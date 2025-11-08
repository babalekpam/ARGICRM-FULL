import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar,
  Edit,
  Eye,
  Share,
  Download,
  BarChart3,
  Settings,
  Trash2,
  GripVertical,
  Star,
  Upload,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Mail,
  Globe,
  Languages,
  Import,
  ExternalLink
} from "lucide-react";
import Layout from "@/components/layout";
import { translationService, type FormTranslation } from "@/services/translation-service";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'rating' | 'signature' | 'number' | 'range';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: {
    dependsOn: string;
    condition: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  step?: number;
}

interface FormTemplate {
  id: number;
  name: string;
  description: string;
  type: 'contact' | 'survey' | 'registration' | 'feedback';
  fields: FormField[];
  responses: number;
  conversionRate: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  isMultiStep?: boolean;
  steps?: FormStep[];
  analytics?: FormAnalytics;
  integrations?: FormIntegration[];
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
}

interface FormAnalytics {
  views: number;
  submissions: number;
  abandonment: number;
  avgCompletionTime: number;
  topExitPoints: string[];
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  sourceBreakdown: { direct: number; social: number; email: number; search: number };
}

interface FormIntegration {
  type: 'email_marketing' | 'crm' | 'webhook' | 'analytics';
  enabled: boolean;
  config: Record<string, any>;
}

// No more mock data - using real API data only

// Enhanced drag and drop sortable item component with edit functionality
function SortableFieldItem({ 
  field, 
  index, 
  onRemove, 
  onEdit, 
  onDuplicate 
}: { 
  field: FormField; 
  index: number; 
  onRemove: (id: string) => void;
  onEdit?: (field: FormField) => void;
  onDuplicate?: (field: FormField) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <span className="text-sm font-medium">{index + 1}.</span>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{field.label}</span>
            <span className="text-sm text-gray-500">({field.type})</span>
            {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
            {field.conditionalLogic && <Badge variant="outline" className="text-xs">Conditional</Badge>}
          </div>
          {field.placeholder && (
            <p className="text-xs text-gray-400 mt-1">Placeholder: {field.placeholder}</p>
          )}
          {field.options && field.options.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">Options: {field.options.join(', ')}</p>
          )}
        </div>
      </div>
      <div className="flex space-x-1">
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(field)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        {onDuplicate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicate(field)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRemove(field.id)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function FormsSurveysPage() {
  const [activeTab, setActiveTab] = useState("forms");
  
  // Fetch real forms data from API
  const { data: forms = [], isLoading: formsLoading } = useQuery<FormTemplate[]>({
    queryKey: ['/api/forms'],
  });
  
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdvancedBuilder, setIsAdvancedBuilder] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [selectedFormForTranslation, setSelectedFormForTranslation] = useState<FormTemplate | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [formTranslations, setFormTranslations] = useState<Map<number, FormTranslation>>(new Map());
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    type: "contact" as FormTemplate['type'],
    status: "active" as FormTemplate['status'],
    fields: [] as FormField[]
  });
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldEditData, setFieldEditData] = useState<FormField | null>(null);
  const [formBuilder, setFormBuilder] = useState({
    name: "",
    description: "",
    type: "contact" as FormTemplate['type'],
    fields: [] as FormField[],
    isMultiStep: false,
    steps: [] as FormStep[]
  });
  const [newField, setNewField] = useState({
    type: "text" as FormField['type'],
    label: "",
    placeholder: "",
    required: false,
    options: [] as string[],
    conditionalLogic: null as FormField['conditionalLogic'] | null,
    validation: {} as FormField['validation']
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createForm = () => {
    if (!formBuilder.name || formBuilder.fields.length === 0) {
      alert("Please provide a form name and at least one field.");
      return;
    }

    const newForm: FormTemplate = {
      id: forms.length + 1,
      name: formBuilder.name,
      description: formBuilder.description,
      type: formBuilder.type,
      fields: formBuilder.fields,
      responses: 0,
      conversionRate: 0,
      status: "draft",
      createdAt: new Date()
    };

    setForms([...forms, newForm]);
    setFormBuilder({ name: "", description: "", type: "contact", fields: [] });
    setIsCreating(false);
    alert(`Form "${newForm.name}" created successfully!`);
  };

  const addField = () => {
    if (!newField.label) {
      alert("Please provide a field label.");
      return;
    }

    const field: FormField = {
      id: Date.now().toString(),
      type: newField.type,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options: newField.options.length > 0 ? newField.options : undefined,
      conditionalLogic: newField.conditionalLogic,
      validation: Object.keys(newField.validation).length > 0 ? newField.validation : undefined
    };

    setFormBuilder(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setNewField({
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
      conditionalLogic: null,
      validation: {}
    });
  };

  const openTranslationDialog = (form: FormTemplate) => {
    setSelectedFormForTranslation(form);
    setIsTranslationOpen(true);
    setSelectedLanguages([]);
  };

  const handleTranslateForm = async () => {
    if (!selectedFormForTranslation || selectedLanguages.length === 0) {
      alert("Please select languages to translate to.");
      return;
    }

    try {
      const translation = await translationService.translateForm(
        selectedFormForTranslation.id,
        selectedLanguages
      );
      
      setFormTranslations(prev => new Map(prev.set(selectedFormForTranslation.id, translation)));
      setIsTranslationOpen(false);
      alert(`Form "${selectedFormForTranslation.name}" has been translated to ${selectedLanguages.length} language(s)!`);
    } catch (error) {
      alert("Error translating form. Please try again.");
    }
  };

  const getTranslatedFieldLabel = (fieldLabel: string, formId: number): string => {
    if (currentLanguage === 'en') return fieldLabel;
    return translationService.getTranslatedField(formId, fieldLabel, currentLanguage);
  };

  const exportTranslations = (formId: number) => {
    const exportData = translationService.exportTranslations(formId);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-${formId}-translations.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEditForm = (form: FormTemplate) => {
    setEditingForm(form);
    setEditFormData({
      name: form.name,
      description: form.description,
      type: form.type,
      status: form.status,
      fields: [...form.fields]
    });
    setIsEditingForm(true);
  };

  const saveFormEdits = () => {
    if (!editingForm) return;

    const updatedForms = forms.map(form => 
      form.id === editingForm.id 
        ? { 
            ...form, 
            name: editFormData.name,
            description: editFormData.description,
            type: editFormData.type,
            status: editFormData.status,
            fields: editFormData.fields
          }
        : form
    );
    
    setForms(updatedForms);
    setIsEditingForm(false);
    setEditingForm(null);
    alert("Form updated successfully!");
  };

  const deleteForm = (formId: number) => {
    if (confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      setForms(forms.filter(form => form.id !== formId));
      alert("Form deleted successfully!");
    }
  };

  const addFieldToEditForm = () => {
    if (!newField.label) {
      alert("Please provide a field label.");
      return;
    }

    const field: FormField = {
      id: Date.now().toString(),
      type: newField.type,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options: newField.options.length > 0 ? newField.options : undefined,
      conditionalLogic: newField.conditionalLogic,
      validation: Object.keys(newField.validation).length > 0 ? newField.validation : undefined
    };

    setEditFormData(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setNewField({
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
      conditionalLogic: null,
      validation: {}
    });
  };

  const removeFieldFromEditForm = (fieldId: string) => {
    setEditFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const openFieldEdit = (field: FormField) => {
    setEditingFieldId(field.id);
    setFieldEditData({ ...field });
  };

  const saveFieldEdit = () => {
    if (!fieldEditData || !editingFieldId) return;

    setEditFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === editingFieldId ? fieldEditData : field
      )
    }));

    setEditingFieldId(null);
    setFieldEditData(null);
  };

  const duplicateField = (field: FormField) => {
    const duplicatedField: FormField = {
      ...field,
      id: Date.now().toString(),
      label: `${field.label} (Copy)`
    };

    setEditFormData(prev => ({
      ...prev,
      fields: [...prev.fields, duplicatedField]
    }));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFormBuilder(prev => {
        const oldIndex = prev.fields.findIndex(field => field.id === active.id);
        const newIndex = prev.fields.findIndex(field => field.id === over.id);

        return {
          ...prev,
          fields: arrayMove(prev.fields, oldIndex, newIndex)
        };
      });
    }
  };

  const removeField = (fieldId: string) => {
    setFormBuilder(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact': return <Users className="h-4 w-4" />;
      case 'survey': return <BarChart3 className="h-4 w-4" />;
      case 'registration': return <Calendar className="h-4 w-4" />;
      case 'feedback': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms & Surveys</h1>
            <p className="text-gray-600">Create and manage dynamic forms and surveys</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Form Name</label>
                    <Input
                      value={formBuilder.name}
                      onChange={(e) => setFormBuilder(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter form name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Form Type</label>
                    <Select 
                      value={formBuilder.type} 
                      onValueChange={(value: FormTemplate['type']) => setFormBuilder(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact">Contact Form</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={formBuilder.description}
                    onChange={(e) => setFormBuilder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose of this form"
                    rows={3}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
                  
                  {formBuilder.fields.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={formBuilder.fields.map(f => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {formBuilder.fields.map((field, index) => (
                            <SortableFieldItem
                              key={field.id}
                              field={field}
                              index={index}
                              onRemove={removeField}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Add New Field</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Type</label>
                        <Select 
                          value={newField.type} 
                          onValueChange={(value: FormField['type']) => setNewField(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="rating">Star Rating</SelectItem>
                            <SelectItem value="range">Range Slider</SelectItem>
                            <SelectItem value="signature">Digital Signature</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Label</label>
                        <Input
                          value={newField.label}
                          onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Enter field label"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Placeholder</label>
                        <Input
                          value={newField.placeholder}
                          onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                          placeholder="Enter placeholder text"
                        />
                      </div>
                    </div>
                    
                    {(newField.type === 'select' || newField.type === 'checkbox' || newField.type === 'radio') && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
                        <Input
                          value={newField.options.join(', ')}
                          onChange={(e) => setNewField(prev => ({ 
                            ...prev, 
                            options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                          }))}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                    
                    {(newField.type === 'number' || newField.type === 'range') && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Value</label>
                          <Input
                            type="number"
                            value={newField.validation.min || ''}
                            onChange={(e) => setNewField(prev => ({ 
                              ...prev, 
                              validation: { ...prev.validation, min: parseInt(e.target.value) }
                            }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Value</label>
                          <Input
                            type="number"
                            value={newField.validation.max || ''}
                            onChange={(e) => setNewField(prev => ({ 
                              ...prev, 
                              validation: { ...prev.validation, max: parseInt(e.target.value) }
                            }))}
                            placeholder="100"
                          />
                        </div>
                      </div>
                    )}

                    {formBuilder.fields.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">Conditional Logic (Optional)</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select 
                            value={newField.conditionalLogic?.dependsOn || ''} 
                            onValueChange={(value) => setNewField(prev => ({ 
                              ...prev, 
                              conditionalLogic: value ? { 
                                dependsOn: value, 
                                condition: 'equals', 
                                value: '' 
                              } : null 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Depends on field" />
                            </SelectTrigger>
                            <SelectContent>
                              {formBuilder.fields.map(field => (
                                <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {newField.conditionalLogic && (
                            <>
                              <Select 
                                value={newField.conditionalLogic.condition} 
                                onValueChange={(value: 'equals' | 'not_equals' | 'contains') => setNewField(prev => ({ 
                                  ...prev, 
                                  conditionalLogic: prev.conditionalLogic ? { 
                                    ...prev.conditionalLogic, 
                                    condition: value 
                                  } : null
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Input
                                value={newField.conditionalLogic.value}
                                onChange={(e) => setNewField(prev => ({ 
                                  ...prev, 
                                  conditionalLogic: prev.conditionalLogic ? { 
                                    ...prev.conditionalLogic, 
                                    value: e.target.value 
                                  } : null
                                }))}
                                placeholder="Value"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required"
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: !!checked }))}
                        />
                        <label htmlFor="required" className="text-sm font-medium">Required field</label>
                      </div>
                      <Button onClick={addField} size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={createForm} className="flex-1">
                    Create Form
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="forms">
              <FileText className="h-4 w-4 mr-2" />
              All Forms
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="responses">
              <Users className="h-4 w-4 mr-2" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Zap className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="translations">
              <Globe className="h-4 w-4 mr-2" />
              Translations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="space-y-4">
            {formsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Loading forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                <p className="text-gray-500 mb-4">Create your first form to start collecting responses</p>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Form
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(form.type)}
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(form.status)}>
                        {form.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Responses</p>
                        <p className="text-lg font-semibold">{form.responses}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Conversion</p>
                        <p className="text-lg font-semibold">{form.conversionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openEditForm(form)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openTranslationDialog(form)}
                      >
                        <Globe className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteForm(form.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{forms.length}</p>
                  <p className="text-sm text-gray-600">Active forms across all types</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {forms.reduce((sum, form) => sum + (form.analytics?.views || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Form views this month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{forms.reduce((sum, form) => sum + form.responses, 0)}</p>
                  <p className="text-sm text-gray-600">Responses received this month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Avg. Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {forms.length > 0 
                      ? (forms.reduce((sum, form) => sum + form.conversionRate, 0) / forms.length).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-sm text-gray-600">Across all active forms</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forms.map((form) => (
                      <div key={form.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{form.name}</p>
                            <p className="text-sm text-gray-600">
                              {form.analytics?.views || 0} views • {form.responses} submissions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{form.conversionRate}%</p>
                            <p className="text-sm text-gray-600">conversion</p>
                          </div>
                        </div>
                        <Progress value={form.conversionRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Abandonment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forms.filter(form => form.analytics).map((form) => (
                      <div key={form.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{form.name}</p>
                          <p className="text-sm font-semibold text-red-600">
                            {form.analytics?.abandonment}% abandon
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          Top exit points: {form.analytics?.topExitPoints.join(', ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          Avg. completion: {form.analytics?.avgCompletionTime}min
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forms.filter(form => form.analytics).map((form) => (
                      <div key={form.id}>
                        <p className="font-medium mb-2">{form.name}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="font-semibold">{form.analytics?.deviceBreakdown.mobile}%</p>
                            <p className="text-gray-600">Mobile</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="font-semibold">{form.analytics?.deviceBreakdown.desktop}%</p>
                            <p className="text-gray-600">Desktop</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <p className="font-semibold">{form.analytics?.deviceBreakdown.tablet}%</p>
                            <p className="text-gray-600">Tablet</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forms.filter(form => form.analytics).map((form) => (
                      <div key={form.id}>
                        <p className="font-medium mb-2">{form.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Direct</span>
                            <span className="font-semibold">{form.analytics?.sourceBreakdown.direct}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Social</span>
                            <span className="font-semibold">{form.analytics?.sourceBreakdown.social}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Email</span>
                            <span className="font-semibold">{form.analytics?.sourceBreakdown.email}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Search</span>
                            <span className="font-semibold">{form.analytics?.sourceBreakdown.search}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-sm text-gray-600">Lead Capture Form • 2 hours ago</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Qualified Lead</Badge>
                        <Badge variant="outline" className="text-xs">Enterprise</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Follow Up
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-gray-600">Customer Satisfaction Survey • 5 hours ago</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">4/5 satisfaction</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Mike Chen</p>
                      <p className="text-sm text-gray-600">Webinar Registration • 1 day ago</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">Confirmed</Badge>
                        <Badge variant="outline" className="text-xs">Technology</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Marketing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically add form submissions to email marketing campaigns
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mailchimp</span>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Constant Contact</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    CRM Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Sync form data directly with your CRM pipeline
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Salesforce</span>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HubSpot</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Webhooks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Send form data to custom endpoints and integrations
                  </p>
                  <div className="space-y-2">
                    <Input placeholder="https://api.example.com/webhook" />
                    <Button size="sm" className="w-full">
                      Add Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Track form performance with advanced analytics
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Analytics</span>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Facebook Pixel</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Create automated workflows based on form responses
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zapier</span>
                      <Badge variant="secondary">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Microsoft Power Automate</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    File Storage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Store uploaded files securely in cloud storage
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Drive</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Dropbox</span>
                      <Button size="sm" variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="translations" className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Form Translations</h2>
                <p className="text-gray-600">Manage multilingual versions of your forms</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {translationService.getSupportedLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => {
                const translation = formTranslations.get(form.id);
                const hasTranslations = translation && translation.translations.length > 0;
                
                return (
                  <Card key={form.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(form.type)}
                          <CardTitle className="text-lg">
                            {currentLanguage === 'en' ? form.name : getTranslatedFieldLabel(form.name, form.id)}
                          </CardTitle>
                        </div>
                        <Badge className={hasTranslations ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {hasTranslations ? `${translation.translations.length} languages` : 'Not translated'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentLanguage === 'en' ? form.description : getTranslatedFieldLabel(form.description, form.id)}
                      </p>
                      
                      {hasTranslations && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500 mb-2">Available Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {translation.translations.map((t) => (
                              <Badge key={t.code} variant="outline" className="text-xs">
                                {t.flag} {t.language}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant={hasTranslations ? "outline" : "default"} 
                          className="flex-1"
                          onClick={() => openTranslationDialog(form)}
                        >
                          <Languages className="h-3 w-3 mr-1" />
                          {hasTranslations ? 'Manage' : 'Translate'}
                        </Button>
                        {hasTranslations && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => exportTranslations(form.id)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Translation Dialog */}
            <Dialog open={isTranslationOpen} onOpenChange={setIsTranslationOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Translate Form: {selectedFormForTranslation?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Select Languages to Translate To:</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                      {translationService.getSupportedLanguages()
                        .filter(lang => lang.code !== 'en')
                        .map((lang) => (
                          <div key={lang.code} className="flex items-center space-x-2">
                            <Checkbox
                              id={lang.code}
                              checked={selectedLanguages.includes(lang.code)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLanguages(prev => [...prev, lang.code]);
                                } else {
                                  setSelectedLanguages(prev => prev.filter(l => l !== lang.code));
                                }
                              }}
                            />
                            <label htmlFor={lang.code} className="text-sm font-medium cursor-pointer">
                              {lang.flag} {lang.nativeName}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {selectedFormForTranslation && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Form Preview (Original)</h4>
                      <div className="space-y-2">
                        <div>
                          <strong>Title:</strong> {selectedFormForTranslation.name}
                        </div>
                        <div>
                          <strong>Description:</strong> {selectedFormForTranslation.description}
                        </div>
                        <div>
                          <strong>Fields:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {selectedFormForTranslation.fields.map((field) => (
                              <li key={field.id} className="text-sm">
                                {field.label} ({field.type})
                                {field.required && <span className="text-red-500"> *</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Translation Features</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Automatic translation of form titles, descriptions, and field labels</li>
                      <li>• Support for 20+ languages with native script support</li>
                      <li>• RTL (Right-to-Left) language support for Arabic and Hebrew</li>
                      <li>• Export/import translation files for manual editing</li>
                      <li>• Real-time language switching for form previews</li>
                    </ul>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={handleTranslateForm} className="flex-1">
                      <Languages className="h-4 w-4 mr-2" />
                      Translate Form ({selectedLanguages.length} languages)
                    </Button>
                    <Button variant="outline" onClick={() => setIsTranslationOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Form Dialog */}
            <Dialog open={isEditingForm} onOpenChange={setIsEditingForm}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Form: {editingForm?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Form Name</label>
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter form name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Form Type</label>
                      <Select 
                        value={editFormData.type} 
                        onValueChange={(value: FormTemplate['type']) => setEditFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contact">Contact Form</SelectItem>
                          <SelectItem value="survey">Survey</SelectItem>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose of this form"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select 
                      value={editFormData.status} 
                      onValueChange={(value: FormTemplate['status']) => setEditFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Form Fields</h3>
                    
                    {editFormData.fields.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            if (active.id !== over.id) {
                              setEditFormData(prev => {
                                const oldIndex = prev.fields.findIndex(field => field.id === active.id);
                                const newIndex = prev.fields.findIndex(field => field.id === over.id);
                                return {
                                  ...prev,
                                  fields: arrayMove(prev.fields, oldIndex, newIndex)
                                };
                              });
                            }
                          }}
                        >
                          <SortableContext 
                            items={editFormData.fields.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {editFormData.fields.map((field, index) => (
                              <SortableFieldItem
                                key={field.id}
                                field={field}
                                index={index}
                                onRemove={removeFieldFromEditForm}
                                onEdit={openFieldEdit}
                                onDuplicate={duplicateField}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Add New Field</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Field Type</label>
                          <Select 
                            value={newField.type} 
                            onValueChange={(value: FormField['type']) => setNewField(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="radio">Radio</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="rating">Star Rating</SelectItem>
                              <SelectItem value="range">Range Slider</SelectItem>
                              <SelectItem value="signature">Digital Signature</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Field Label</label>
                          <Input
                            value={newField.label}
                            onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="Enter field label"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Placeholder</label>
                          <Input
                            value={newField.placeholder}
                            onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                            placeholder="Enter placeholder text"
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox
                            id="edit-required"
                            checked={newField.required}
                            onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: !!checked }))}
                          />
                          <label htmlFor="edit-required" className="text-sm font-medium">Required field</label>
                        </div>
                      </div>

                      {(newField.type === 'select' || newField.type === 'checkbox' || newField.type === 'radio') && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
                          <Input
                            value={newField.options.join(', ')}
                            onChange={(e) => setNewField(prev => ({ 
                              ...prev, 
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                            }))}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      <div className="mt-3 flex justify-end">
                        <Button onClick={addFieldToEditForm}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={saveFormEdits} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Field Edit Dialog */}
            <Dialog open={editingFieldId !== null} onOpenChange={() => setEditingFieldId(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Field: {fieldEditData?.label}</DialogTitle>
                </DialogHeader>
                {fieldEditData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Type</label>
                        <Select 
                          value={fieldEditData.type} 
                          onValueChange={(value: FormField['type']) => setFieldEditData(prev => prev ? { ...prev, type: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="rating">Star Rating</SelectItem>
                            <SelectItem value="range">Range Slider</SelectItem>
                            <SelectItem value="signature">Digital Signature</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Field Label</label>
                        <Input
                          value={fieldEditData.label}
                          onChange={(e) => setFieldEditData(prev => prev ? { ...prev, label: e.target.value } : null)}
                          placeholder="Enter field label"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Placeholder Text</label>
                      <Input
                        value={fieldEditData.placeholder || ''}
                        onChange={(e) => setFieldEditData(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
                        placeholder="Enter placeholder text"
                      />
                    </div>

                    {(fieldEditData.type === 'select' || fieldEditData.type === 'checkbox' || fieldEditData.type === 'radio') && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
                        <Input
                          value={fieldEditData.options?.join(', ') || ''}
                          onChange={(e) => setFieldEditData(prev => prev ? { 
                            ...prev, 
                            options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                          } : null)}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    {(fieldEditData.type === 'number' || fieldEditData.type === 'range') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Value</label>
                          <Input
                            type="number"
                            value={fieldEditData.validation?.min || ''}
                            onChange={(e) => setFieldEditData(prev => prev ? { 
                              ...prev, 
                              validation: { ...prev.validation, min: parseInt(e.target.value) }
                            } : null)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Value</label>
                          <Input
                            type="number"
                            value={fieldEditData.validation?.max || ''}
                            onChange={(e) => setFieldEditData(prev => prev ? { 
                              ...prev, 
                              validation: { ...prev.validation, max: parseInt(e.target.value) }
                            } : null)}
                            placeholder="100"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-required"
                        checked={fieldEditData.required}
                        onCheckedChange={(checked) => setFieldEditData(prev => prev ? { ...prev, required: !!checked } : null)}
                      />
                      <label htmlFor="field-required" className="text-sm font-medium">Required field</label>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={saveFieldEdit} className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Save Field Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingFieldId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}