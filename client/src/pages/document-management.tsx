import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileIcon, FolderIcon, Upload, Search, Eye, Download, Share2, Lock, Unlock, Edit3, Trash2, Plus, Filter, MoreHorizontal, Clock, User, Tag, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  folderId: string | null;
  status: string;
  version: number;
  tags: string[];
  isPrivate: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  downloadCount: number;
  accessCount: number;
  lastAccessedAt: Date | null;
}

interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  documentCount: number;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: true,
  });

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['/api/document-folders'],
    enabled: true,
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Uploading document with data:', data);
      return apiRequest('POST', '/api/documents', data);
    },
    onSuccess: (response) => {
      console.log('Document upload success:', response);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsCreateDocumentOpen(false);
      toast({ title: "Document uploaded successfully" });
    },
    onError: (error) => {
      console.error('Document upload error:', error);
      toast({ title: `Error uploading document: ${error.message || 'Unknown error'}`, variant: "destructive" });
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/document-folders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-folders'] });
      setIsCreateFolderOpen(false);
      toast({ title: "Folder created successfully" });
    },
    onError: () => {
      toast({ title: "Error creating folder", variant: "destructive" });
    }
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesFolder = selectedFolder === null || doc.folderId === selectedFolder;
    
    return matchesSearch && matchesStatus && matchesType && matchesFolder;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'pdf': FileIcon,
      'doc': FileIcon,
      'docx': FileIcon,
      'xls': FileIcon,
      'xlsx': FileIcon,
      'ppt': FileIcon,
      'pptx': FileIcon,
      'txt': FileIcon,
      'image': FileIcon,
      'video': FileIcon,
      'audio': FileIcon,
    };
    const Icon = iconMap[type] || FileIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <FileIcon className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Smart Document Hub
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Organize, share, and collaborate on documents with AI-powered organization
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse"></div>
              Smart Organization
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Version Control
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              Real-time Collaboration
            </Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white shadow-md border-slate-200">
                <FolderIcon className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Organize your documents with a new folder
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createFolderMutation.mutate({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  parentId: selectedFolder,
                  isPrivate: formData.get('isPrivate') === 'on',
                });
              }} className="space-y-4">
                <Input name="name" placeholder="Folder name" required />
                <Textarea name="description" placeholder="Description (optional)" />
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrivate" id="isPrivate" />
                  <label htmlFor="isPrivate">Private folder</label>
                </div>
                <Button type="submit" disabled={createFolderMutation.isPending}>
                  {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDocumentOpen} onOpenChange={setIsCreateDocumentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Add a new document to your library
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
                const file = fileInput?.files?.[0];
                
                if (!file) {
                  toast({ title: "Please select a file to upload", variant: "destructive" });
                  return;
                }

                createDocumentMutation.mutate({
                  name: formData.get('name') || file.name,
                  type: formData.get('type') || 'document',
                  description: formData.get('description'),
                  folderId: selectedFolder,
                  tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
                  isPrivate: formData.get('isPrivate') === 'on',
                  size: file.size,
                  mimeType: file.type || 'application/octet-stream',
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select File</label>
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" 
                    required 
                    className="cursor-pointer"
                  />
                </div>
                <Input name="name" placeholder="Document name (optional - will use filename if empty)" />
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">Word Document</SelectItem>
                    <SelectItem value="xls">Excel Spreadsheet</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea name="description" placeholder="Description (optional)" />
                <Input name="tags" placeholder="Tags (comma-separated)" />
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isPrivate" id="docPrivate" />
                  <label htmlFor="docPrivate">Private document</label>
                </div>
                <Button type="submit" disabled={createDocumentMutation.isPending}>
                  {createDocumentMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">Word</SelectItem>
                  <SelectItem value="xls">Excel</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Breadcrumb */}
          {selectedFolder && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                Root
              </Button>
              <span>/</span>
              <span className="font-medium">
                {folders.find((f: DocumentFolder) => f.id === selectedFolder)?.name}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((document: Document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(document.type)}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{document.name}</h3>
                        <p className="text-xs text-gray-500">v{document.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {document.isPrivate && <Lock className="h-3 w-3 text-gray-400" />}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Badge className={getStatusColor(document.status)} variant="secondary">
                      {document.status}
                    </Badge>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(document.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads:</span>
                        <span>{document.downloadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span>{document.accessCount}</span>
                      </div>
                    </div>

                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {document.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{document.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{document.createdBy}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(document.updatedAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && !documentsLoading && (
            <div className="text-center py-8">
              <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">Get started by uploading your first document.</p>
              <Button onClick={() => setIsCreateDocumentOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder: DocumentFolder) => (
              <Card 
                key={folder.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setActiveTab("documents");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{folder.name}</h3>
                        <p className="text-sm text-gray-500">
                          {folder.documentCount} documents
                        </p>
                      </div>
                    </div>
                    {folder.isPrivate && <Lock className="h-4 w-4 text-gray-400" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {folder.description && (
                    <p className="text-sm text-gray-600 mb-2">{folder.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{folder.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(folder.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {folders.length === 0 && !foldersLoading && (
            <div className="text-center py-8">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No folders created</h3>
              <p className="text-gray-500 mb-4">Organize your documents by creating folders.</p>
              <Button onClick={() => setIsCreateFolderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Workflow</CardTitle>
              <CardDescription>
                Manage approval workflows and review processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">12</div>
                    <div className="text-sm text-gray-600">Pending Review</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">45</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Recent Workflow Activity</h4>
                  <div className="space-y-3">
                    {[
                      { document: "Q4 Financial Report", action: "Approved", user: "John Smith", time: "2 hours ago" },
                      { document: "Marketing Strategy", action: "Needs Review", user: "Sarah Johnson", time: "4 hours ago" },
                      { document: "Product Roadmap", action: "Draft Submitted", user: "Mike Chen", time: "1 day ago" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{item.document}</div>
                          <div className="text-xs text-gray-500">{item.action} by {item.user}</div>
                        </div>
                        <div className="text-xs text-gray-500">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </div>
                  <FileIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Downloads</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <Download className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">+8% from last month</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold">2.4 GB</p>
                  </div>
                  <FolderIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <Progress value={65} className="h-1" />
                  <p className="text-xs text-gray-500 mt-1">65% of 4 GB limit</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">28</p>
                  </div>
                  <User className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">+4 new this week</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Document Activity Trends</CardTitle>
              <CardDescription>
                Track document usage and engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Document activity chart would be implemented here with a charting library
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
    </Layout>
  );
}