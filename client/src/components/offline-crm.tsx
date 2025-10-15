// Complete Offline CRM - Basic version that works without internet
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { offlineDataLayer } from '@/lib/offline-data-layer';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  CheckSquare,
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  WifiOff,
  Download,
  RefreshCw,
  Database,
  Globe
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  offlineModified?: boolean;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  offlineModified?: boolean;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
  offlineModified?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  offlineModified?: boolean;
}

export function OfflineCRM() {
  const { user } = useAuth();
  const { status, downloadForOffline, syncOfflineChanges } = useOffline();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, [user, status.isInitialized]);

  const loadAllData = async () => {
    if (!user || !status.isInitialized) return;
    
    setLoading(true);
    try {
      const [contactsData, leadsData, dealsData, tasksData] = await Promise.all([
        offlineDataLayer.getData({
          entityType: 'contacts',
          useOfflineFirst: !status.isOnline,
          tenantId: user.tenantId,
          userEmail: user.email
        }),
        offlineDataLayer.getData({
          entityType: 'leads',
          useOfflineFirst: !status.isOnline,
          tenantId: user.tenantId,
          userEmail: user.email
        }),
        offlineDataLayer.getData({
          entityType: 'deals',
          useOfflineFirst: !status.isOnline,
          tenantId: user.tenantId,
          userEmail: user.email
        }),
        offlineDataLayer.getData({
          entityType: 'tasks',
          useOfflineFirst: !status.isOnline,
          tenantId: user.tenantId,
          userEmail: user.email
        })
      ]);
      
      setContacts(contactsData || []);
      setLeads(leadsData || []);
      setDeals(dealsData || []);
      setTasks(tasksData || []);
      
      console.log(`Loaded ${contactsData?.length || 0} contacts, ${leadsData?.length || 0} leads, ${dealsData?.length || 0} deals, ${tasksData?.length || 0} tasks`);
    } catch (error) {
      console.error('Failed to load CRM data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load CRM data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForOffline = async () => {
    const success = await downloadForOffline();
    if (success) {
      toast({
        title: "Offline Data Ready",
        description: "Your CRM data is now available offline",
        variant: "default",
      });
      await loadAllData(); // Refresh data
    } else {
      toast({
        title: "Download Failed",
        description: "Failed to download data for offline use",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    const result = await syncOfflineChanges();
    toast({
      title: "Sync Complete",
      description: `${result.success} items synced, ${result.failed} failed`,
      variant: result.failed > 0 ? "destructive" : "default",
    });
    
    if (result.success > 0) {
      await loadAllData(); // Refresh data
    }
  };

  const createContact = async (data: Partial<Contact>) => {
    if (!user || !data.name || !data.email) return;

    try {
      const contactData = {
        ...data,
        id: crypto.randomUUID(),
        tenantId: user.tenantId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Contact;

      const createdContact = await offlineDataLayer.createItem(
        {
          entityType: 'contacts',
          tenantId: user.tenantId,
          userEmail: user.email
        },
        contactData
      );

      setContacts(prev => [createdContact, ...prev]);
      setShowCreateForm(false);

      toast({
        title: "Contact Created",
        description: status.isOnline ? "Contact created and synced" : "Contact created offline",
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to create contact:', error);
      toast({
        title: "Error Creating Contact",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (entityType: string, id: string) => {
    if (!user) return;

    try {
      await offlineDataLayer.deleteItem(
        {
          entityType,
          tenantId: user.tenantId,
          userEmail: user.email
        },
        id
      );

      // Update local state
      switch (entityType) {
        case 'contacts':
          setContacts(prev => prev.filter(item => item.id !== id));
          break;
        case 'leads':
          setLeads(prev => prev.filter(item => item.id !== id));
          break;
        case 'deals':
          setDeals(prev => prev.filter(item => item.id !== id));
          break;
        case 'tasks':
          setTasks(prev => prev.filter(item => item.id !== id));
          break;
      }

      toast({
        title: "Item Deleted",
        description: status.isOnline ? "Item deleted and synced" : "Item deleted offline",
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        title: "Error Deleting Item",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter data based on search term
  const filteredData = {
    contacts: contacts.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    leads: leads.filter(item =>
      item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    deals: deals.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stage.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    tasks: tasks.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  const renderContactList = () => (
    <div className="space-y-4">
      {filteredData.contacts.map((contact) => (
        <Card key={contact.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">{contact.name}</h3>
                  {contact.offlineModified && (
                    <Badge variant="outline" className="text-xs">
                      Modified offline
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{contact.email}</span>
                  </div>
                  
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteItem('contacts', contact.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCreateContactForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      company: ''
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Contact</CardTitle>
          <CardDescription>Add a new contact to your offline CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Acme Corp"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => createContact(formData)}
              disabled={!formData.name || !formData.email}
            >
              Create Contact
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  NODE CRM - Offline Ready
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Basic CRM functionality that works without internet
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={status.isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
                {status.isOnline ? <Globe className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{status.isOnline ? "Online" : "Offline Mode"}</span>
              </Badge>
              
              {status.pendingChanges > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {status.pendingChanges} pending sync
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {status.isOnline && !status.hasOfflineData && (
              <Button onClick={handleDownloadForOffline} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download for Offline
              </Button>
            )}
            
            {status.isOnline && status.pendingChanges > 0 && (
              <Button onClick={handleSync} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Changes
              </Button>
            )}
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex items-center justify-between space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search all CRM data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && renderCreateContactForm()}

        {/* CRM Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 shadow-sm">
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Contacts ({contacts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Leads ({leads.length})</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Deals ({deals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Tasks ({tasks.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            ) : filteredData.contacts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No contacts found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm ? "No contacts match your search." : "Get started by creating your first contact."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Contact
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              renderContactList()
            )}
          </TabsContent>

          {/* Other tabs - simplified for offline use */}
          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardContent className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Leads ({leads.length})
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Lead management available offline
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="mt-6">
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Deals ({deals.length})
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Deal tracking available offline
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardContent className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Tasks ({tasks.length})
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Task management available offline
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Offline Status Info */}
        {!status.isOnline && (
          <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <WifiOff className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Offline Mode Active
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    You're working offline. Changes will sync when you reconnect to the internet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}