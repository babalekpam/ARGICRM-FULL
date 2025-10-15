import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import Layout from "@/components/layout";

export default function BackupTestPage() {
  const testBackup = () => {
    try {
      console.log('Testing backup functionality...');
      
      const backupData = {
        testData: "This is a test backup",
        timestamp: new Date().toISOString(),
        version: "1.0"
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download URL and trigger browser save dialog
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-backup-${Date.now()}.json`;
      
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
      
      alert('Test backup created! Check your browser\'s download dialog.');
    } catch (error) {
      console.error('Error creating test backup:', error);
      alert('Error creating backup. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Backup Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testBackup} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Test Backup Download
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}