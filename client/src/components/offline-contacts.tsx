// Offline-capable contacts component
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { offlineDataLayer } from '@/lib/offline-data-layer';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Building,
  WifiOff,
  Wifi,
  Download
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  offlineModified?: boolean;
}

export function OfflineContacts() {
  const { user } = useAuth();
  const { status, downloadForOffline } = useOffline();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, [user, status.isInitialized]);

  const loadContacts = async () => {
    if (!user || !status.isInitialized) return;
    
    setLoading(true);
    try {
      const data = await offlineDataLayer.getData({
        entityType: 'contacts',
        useOfflineFirst: !status.isOnline,
        tenantId: user.tenantId,
        userEmail: user.email
      });
      
      setContacts(data || []);
      console.log(`Loaded ${data?.length || 0} contacts`);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast({
        title: "Error Loading Contacts",
        description: "Failed to load contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    if (!user || !newContact.name || !newContact.email) return;

    try {
      const contactData = {
        ...newContact,
        id: crypto.randomUUID(),
        tenantId: user.tenantId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const createdContact = await offlineDataLayer.createItem(
        {
          entityType: 'contacts',
          tenantId: user.tenantId,
          userEmail: user.email
        },
        contactData
      );

      setContacts(prev => [createdContact, ...prev]);
      setNewContact({ name: '', email: '', phone: '', company: '' });
      setIsCreating(false);

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

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    if (!user) return;

    try {
      const updatedContact = await offlineDataLayer.updateItem(
        {
          entityType: 'contacts',
          tenantId: user.tenantId,
          userEmail: user.email
        },
        id,
        updates
      );

      setContacts(prev => 
        prev.map(contact => 
          contact.id === id ? updatedContact : contact
        )
      );

      toast({
        title: "Contact Updated",
        description: status.isOnline ? "Contact updated and synced" : "Contact updated offline",
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to update contact:', error);
      toast({
        title: "Error Updating Contact",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    try {
      await offlineDataLayer.deleteItem(
        {
          entityType: 'contacts',
          tenantId: user.tenantId,
          userEmail: user.email
        },
        id
      );

      setContacts(prev => prev.filter(contact => contact.id !== id));

      toast({
        title: "Contact Deleted",
        description: status.isOnline ? "Contact deleted and synced" : "Contact deleted offline",
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast({
        title: "Error Deleting Contact",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header with offline status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600">Manage your contacts with offline support</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant={status.isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
            {status.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{status.isOnline ? "Online" : "Offline"}</span>
          </Badge>
          
          {status.pendingChanges > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {status.pendingChanges} pending sync
            </Badge>
          )}
        </div>
      </div>

      {/* Download for offline */}
      {status.isOnline && !status.hasOfflineData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Enable Offline Access</h3>
                <p className="text-blue-700 text-sm">Download your contacts for offline use</p>
              </div>
              <Button onClick={downloadForOffline} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Create */}
      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </Button>
      </div>

      {/* Create Contact Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Contact</CardTitle>
            <CardDescription>Add a new contact to your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newContact.company}
                  onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={createContact}
                disabled={!newContact.name || !newContact.email}
              >
                Create Contact
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contacts...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "No contacts match your search." : "Get started by creating your first contact."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
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
                        onClick={() => console.log('Edit contact:', contact.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteContact(contact.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}