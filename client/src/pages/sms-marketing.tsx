import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Users, Eye, CheckCircle, AlertCircle, Info, Phone, Edit, Trash2 } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";
import Logo from "@/components/logo";

interface SMSCampaign {
  id: number;
  name: string;
  message: string;
  recipients: number;
  sent: number;
  delivered: number;
  clicked: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  scheduledAt?: Date;
  createdAt: Date;
}

const mockCampaigns: SMSCampaign[] = [];

export default function SMSMarketingPage() {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [campaigns, setCampaigns] = useState(mockCampaigns);

  const { data: contacts = [] } = useQuery({ queryKey: ["/api/contacts"] });

  // Action handlers for campaigns
  const handleViewCampaign = (campaign: SMSCampaign) => {
    alert(`Viewing campaign: ${campaign.name}\n\nMessage: ${campaign.message}\n\nRecipients: ${campaign.recipients}\nDelivered: ${campaign.delivered}\nClicked: ${campaign.clicked}`);
  };

  const handleEditCampaign = (campaign: SMSCampaign) => {
    const newName = prompt('Edit campaign name:', campaign.name);
    if (newName && newName !== campaign.name) {
      setCampaigns(campaigns.map(c => 
        c.id === campaign.id ? { ...c, name: newName } : c
      ));
    }
  };

  const handleDeleteCampaign = (campaign: SMSCampaign) => {
    if (confirm(`Are you sure you want to delete the campaign "${campaign.name}"?`)) {
      setCampaigns(campaigns.filter(c => c.id !== campaign.id));
    }
  };

  const validContacts = contacts.filter((contact: Contact) => 
    contact.phone && contact.phone.trim() !== ""
  );

  const handleContactToggle = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === validContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(validContacts.map((contact: Contact) => contact.id));
    }
  };

  const personalizeMessage = (template: string, contact: Contact) => {
    return template
      .replace(/\{name\}/g, contact.name || 'Valued Customer')
      .replace(/\{first_name\}/g, contact.name?.split(' ')[0] || 'Friend')
      .replace(/\{company\}/g, contact.company || 'your company');
  };

  const handlePreview = () => {
    if (validContacts.length > 0) {
      const sampleContact = validContacts[0];
      setPreviewMessage(personalizeMessage(message, sampleContact));
    }
  };

  const handleSendSMS = async () => {
    if (!campaignName.trim() || !message.trim() || selectedContacts.length === 0) {
      return;
    }

    setIsSending(true);
    
    try {
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('SMS Campaign sent:', {
        name: campaignName,
        message,
        recipients: selectedContacts.length
      });

      // Reset form
      setCampaignName("");
      setMessage("");
      setSelectedContacts([]);
      setPreviewMessage("");
      
    } catch (error) {
      console.error('Failed to send SMS campaign:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / 160);
  const remainingChars = 160 - (messageLength % 160);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SMS Marketing</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Reach your audience instantly with SMS campaigns
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Creation */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Create SMS Campaign
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Message</label>
                    <div className="text-xs text-gray-500">
                      {messageLength}/160 chars • {smsCount} SMS • {remainingChars} remaining
                    </div>
                  </div>
                  <Textarea
                    placeholder="Enter your SMS message... Use {name}, {first_name}, or {company} for personalization"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className={messageLength > 160 ? "border-orange-300" : ""}
                  />
                  {messageLength > 160 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Message is longer than 160 characters and will be sent as {smsCount} SMS messages.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handlePreview} disabled={!message.trim()}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleSendSMS} 
                    disabled={!campaignName.trim() || !message.trim() || selectedContacts.length === 0 || isSending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : `Send to ${selectedContacts.length} contacts`}
                  </Button>
                </div>

                {previewMessage && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Preview:</strong> {previewMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Contact Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Select Recipients
                  </div>
                  <Badge variant="outline">
                    {(validContacts || []).length} contacts with phone numbers
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedContacts.length === validContacts.length && validContacts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Select All ({(validContacts || []).length} contacts)
                    </span>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {validContacts.map((contact: Contact) => (
                      <div key={contact.id} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{contact.name}</div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {contact.phone}
                            {contact.company && <span className="ml-2">• {contact.company}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {validContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No contacts with phone numbers found</p>
                      <p className="text-sm">Add phone numbers to your contacts to send SMS campaigns</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign History & Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SMS Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">0</div>
                  <div className="text-sm text-gray-600">Total SMS Sent</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-lg font-bold text-gray-400">0%</div>
                    <div className="text-xs text-gray-500">Delivery Rate</div>
                  </div>
                  <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-lg font-bold text-gray-400">0%</div>
                    <div className="text-xs text-gray-500">Click Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{campaign.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(campaign.status)} variant="secondary">
                            {campaign.status}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewCampaign(campaign)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCampaign(campaign)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCampaign(campaign)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Recipients: {campaign.recipients.toLocaleString()}</div>
                        <div>Delivered: {campaign.delivered.toLocaleString()}</div>
                        <div>Clicked: {campaign.clicked}</div>
                        <div>Sent: {campaign.createdAt.toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No SMS campaigns yet</p>
                      <p className="text-sm">Create your first SMS campaign to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Keep it concise</div>
                      <div className="text-gray-500">Stay under 160 characters when possible</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Include clear CTA</div>
                      <div className="text-gray-500">Make your call-to-action obvious</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Timing matters</div>
                      <div className="text-gray-500">Send during business hours</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Always include opt-out</div>
                      <div className="text-gray-500">Include "Reply STOP to opt out"</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}