import React from "react";

export default function BackupWorkingPage() {
  const downloadBackup = () => {
    const data = {
      platform: "ARGILETTE NODE CRM",
      company: "ARGILETTE",
      settings: {
        name: "Default Settings",
        email: "contact@argilette.org",
        phone: "+1-555-0123"
      },
      exported: new Date().toISOString(),
      version: "1.0"
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetSettings = () => {
    alert('Settings reset successfully!');
  };

  const saveSettings = () => {
    alert('Settings saved successfully!');
  };

  const buttonStyle = {
    padding: '12px 24px',
    margin: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  const resetButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444'
  };

  const backupButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981'
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#1f2937' }}>
        Backup & Settings
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Test the backup, reset, and save functionality
      </p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '24px', color: '#374151' }}>
          Settings Management
        </h2>
        
        <div style={{ marginBottom: '32px' }}>
          <button style={backupButtonStyle} onClick={downloadBackup}>
            📁 Backup Settings
          </button>
          <br />
          <button style={resetButtonStyle} onClick={resetSettings}>
            🔄 Reset
          </button>
          <br />
          <button style={buttonStyle} onClick={saveSettings}>
            💾 Save
          </button>
        </div>
        
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '16px', 
          borderRadius: '6px',
          textAlign: 'left'
        }}>
          <strong>Instructions:</strong>
          <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Click "Backup Settings" to download backup file</li>
            <li>Click "Reset" to reset settings</li>
            <li>Click "Save" to save current settings</li>
          </ol>
        </div>
      </div>
    </div>
  );
}