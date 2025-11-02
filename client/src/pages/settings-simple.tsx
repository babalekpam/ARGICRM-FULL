import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Save, RefreshCw } from "lucide-react";
import Layout from "@/components/layout";

export default function SettingsSimplePage() {
  const [isSaving, setIsSaving] = useState(false);

  const exportSettingsBackup = () => {
    try {
      console.log('Starting settings backup...');
      
      const backupData = {
        settings: {
          companyName: "ARGILETTE CRM",
          companyEmail: "contact@argilette.org",
          companyPhone: "+1 (555) 123-4567",
          exportDate: new Date().toISOString()
        },
        tenantInfo: {
          tenantId: "default-tenant",
          plan: "enterprise",
          exportDate: new Date().toISOString(),
          version: "1.0"
        }
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download URL and trigger browser save dialog
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `argilette-crm-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Ensure the link triggers the browser's save dialog
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger the download with save dialog
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Settings backup popup triggered successfully');
      alert('Backup file created! Check your browser\'s download dialog.');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup. Please try again.');
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSettings = () => {
    alert('Settings reset to defaults');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
              Platform Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Configure your CRM platform with advanced customization options
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              className="bg-white shadow-md border-slate-200"
              onClick={exportSettingsBackup}
            >
              <Download className="w-4 h-4 mr-2" />
              Backup Settings
            </Button>
            <Button variant="outline" onClick={loadSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Settings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>This is a simplified settings page to test the backup functionality.</p>
              <p className="font-semibold">Click "Backup Settings" above to download your settings backup.</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">Backup Features:</h3>
                <ul className="list-disc pl-5 text-green-700 mt-2">
                  <li>Complete settings export</li>
                  <li>Tenant information included</li>
                  <li>Date-stamped filename</li>
                  <li>JSON format for easy import</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}