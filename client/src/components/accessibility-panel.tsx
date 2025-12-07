import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAccessibility } from "@/lib/accessibility";
import { 
  Accessibility, 
  Eye, 
  MousePointer, 
  Type, 
  Volume2, 
  Navigation, 
  Keyboard, 
  Monitor,
  Settings,
  Info
} from "lucide-react";

interface AccessibilityPanelProps {
  trigger?: React.ReactNode;
}

export default function AccessibilityPanel({ trigger }: AccessibilityPanelProps) {
  const { settings, updateSettings, announce } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    announce(`${key} setting changed to ${value}`, 'polite');
  };

  const resetToDefaults = () => {
    updateSettings({
      screenReaderMode: false,
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      focusIndicators: false,
      skipNavigation: false,
      keyboardNavigation: true,
      announcements: false,
    });
    announce('Accessibility settings reset to defaults', 'polite');
  };

  const detectAndApplyOptimal = () => {
    const optimalSettings: any = {};

    // Detect screen reader
    if (navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS')) {
      optimalSettings.screenReaderMode = true;
      optimalSettings.announcements = true;
    }

    // Detect system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      optimalSettings.reducedMotion = true;
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      optimalSettings.highContrast = true;
    }

    updateSettings(optimalSettings);
    announce('Optimal accessibility settings applied based on system preferences', 'assertive');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm"
            aria-label="Open accessibility settings"
            className="gap-2"
          >
            <Accessibility className="h-4 w-4" />
            Accessibility
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="accessibility-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription id="accessibility-description">
            Customize your experience to make ARGILETTE CRM more accessible. These settings are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Setup</CardTitle>
              <CardDescription>
                Apply optimal settings automatically or reset to defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                onClick={detectAndApplyOptimal}
                variant="outline"
                size="sm"
                aria-label="Detect and apply optimal accessibility settings"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Auto-Configure
              </Button>
              <Button 
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                aria-label="Reset all accessibility settings to defaults"
              >
                <Settings className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>

          {/* Screen Reader Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Screen Reader Support
              </CardTitle>
              <CardDescription>
                Enhanced features for screen reader users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader-mode">Screen Reader Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimizes content structure and spacing for screen readers
                  </p>
                </div>
                <Switch
                  id="screen-reader-mode"
                  checked={settings.screenReaderMode}
                  onCheckedChange={(checked) => handleSettingChange('screenReaderMode', checked)}
                  aria-describedby="screen-reader-mode-desc"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="announcements">Live Announcements</Label>
                  <p className="text-sm text-muted-foreground">
                    Announce important changes and actions
                  </p>
                </div>
                <Switch
                  id="announcements"
                  checked={settings.announcements}
                  onCheckedChange={(checked) => handleSettingChange('announcements', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="skip-navigation">Skip Navigation Links</Label>
                  <p className="text-sm text-muted-foreground">
                    Add keyboard shortcuts to skip to main content
                  </p>
                </div>
                <Switch
                  id="skip-navigation"
                  checked={settings.skipNavigation}
                  onCheckedChange={(checked) => handleSettingChange('skipNavigation', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Accessibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visual Accessibility
              </CardTitle>
              <CardDescription>
                Adjust visual elements for better readability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increases contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enhanced-focus">Enhanced Focus Indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Make focus indicators more visible
                  </p>
                </div>
                <Switch
                  id="enhanced-focus"
                  checked={settings.focusIndicators}
                  onCheckedChange={(checked) => handleSettingChange('focusIndicators', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) => handleSettingChange('fontSize', value)}
                >
                  <SelectTrigger aria-label="Select font size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Motion and Animation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Motion & Animation
              </CardTitle>
              <CardDescription>
                Control animations and motion effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduce Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizes animations and transitions that may cause discomfort
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Keyboard Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Keyboard Navigation
              </CardTitle>
              <CardDescription>
                Enhanced keyboard navigation features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="keyboard-navigation">Enhanced Keyboard Navigation</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable keyboard shortcuts and improved navigation
                  </p>
                </div>
                <Switch
                  id="keyboard-navigation"
                  checked={settings.keyboardNavigation}
                  onCheckedChange={(checked) => handleSettingChange('keyboardNavigation', checked)}
                />
              </div>
              
              {settings.keyboardNavigation && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><Badge variant="outline">Alt + 1</Badge> Main Navigation</div>
                    <div><Badge variant="outline">Alt + 2</Badge> Main Content</div>
                    <div><Badge variant="outline">Alt + 3</Badge> Search</div>
                    <div><Badge variant="outline">Escape</Badge> Close Dialogs</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Current Settings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant={settings.screenReaderMode ? "default" : "secondary"}>
                  Screen Reader: {settings.screenReaderMode ? "On" : "Off"}
                </Badge>
                <Badge variant={settings.highContrast ? "default" : "secondary"}>
                  High Contrast: {settings.highContrast ? "On" : "Off"}
                </Badge>
                <Badge variant={settings.reducedMotion ? "default" : "secondary"}>
                  Reduced Motion: {settings.reducedMotion ? "On" : "Off"}
                </Badge>
                <Badge variant={settings.keyboardNavigation ? "default" : "secondary"}>
                  Keyboard Nav: {settings.keyboardNavigation ? "On" : "Off"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating accessibility button for easy access
export function AccessibilityFloatingButton() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AccessibilityPanel 
        trigger={
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            aria-label="Open accessibility settings"
          >
            <Accessibility className="h-6 w-6" />
          </Button>
        }
      />
    </div>
  );
}