import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function BackupSimplePage() {
  const handleBackup = () => {
    try {
      const backupData = {
        platform: "ARGILETTE NODE CRM",
        settings: {
          companyName: "ARGILETTE CRM",
          companyEmail: "contact@argilette.org",
          companyPhone: "+1 (555) 123-4567",
          timezone: "UTC",
          currency: "USD"
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `argilette-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Backup file created successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      alert('Failed to create backup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Settings Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Click below to download your settings backup file.
            </p>
            <Button 
              onClick={handleBackup}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}