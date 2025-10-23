import Header from "@/components/header";
import Navigation from "@/components/navigation";
import MobileHeader from "@/components/mobile-header";
import MobileFAB from "@/components/mobile-fab";
import QuickActionsMenu from "@/components/quick-actions-menu";
import CommandPalette from "@/components/command-palette";
import { BrandedFooter } from "@/components/branded-footer";
import ChatbotTrigger from "@/components/chatbot-trigger";
import PageTranslator from "@/components/PageTranslator";


import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useCollaboration } from "@/hooks/use-collaboration";
import { AccessibilityFloatingButton } from "@/components/accessibility-panel";
import { useAccessibility } from "@/lib/accessibility";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Initialize keyboard shortcuts and command palette
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useKeyboardShortcuts();
  
  // Get current location to conditionally hide floating elements
  const [location] = useLocation();
  const isSuperAdminDashboard = location?.startsWith('/super-admin-dashboard');
  
  // Initialize behavior tracking for the current user
  useBehaviorTracking({ 
    userId: 'current_user',
    enableAutoTracking: true 
  });

  // Initialize real-time collaboration
  const { updatePageNavigation } = useCollaboration();

  // Initialize accessibility manager
  const { settings, announce } = useAccessibility();
  
  // Get logout function from useAuth
  const { logout } = useAuth();

  useEffect(() => {
    // Enable keyboard navigation
    import('@/lib/accessibility').then(({ accessibilityManager }) => {
      accessibilityManager.enableKeyboardNavigation();
    });

    // Announce page loads for screen readers
    if (settings.announcements) {
      announce('Page loaded', 'polite');
    }
  }, [settings.announcements, announce]);
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Skip Navigation Links */}
      {settings.skipNavigation && (
        <>
          <a 
            href="#main-navigation" 
            className="skip-link bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg focus-ring"
            onFocus={() => announce('Skip to navigation', 'polite')}
          >
            Skip to Navigation
          </a>
          <a 
            href="#main-content" 
            className="skip-link bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg focus-ring"
            onFocus={() => announce('Skip to main content', 'polite')}
          >
            Skip to Main Content
          </a>
        </>
      )}

      {/* Desktop Navigation & Header */}
      <div className="hidden md:block">
        <PageTranslator context="navigation">
          <Navigation />
          <Header />
        </PageTranslator>
      </div>

      {/* Mobile Header */}
      <PageTranslator context="mobile-header">
        <MobileHeader />
      </PageTranslator>
      
      <main 
        id="main-content"
        className="md:ml-64 md:pt-16 pt-0 min-h-screen transition-all-smooth"
        role="main"
        aria-label="Main content area"
        tabIndex={-1}
      >
        <div className="p-6 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <PageTranslator context="main-content">
              {children}
            </PageTranslator>
          </div>
        </div>
      </main>

      <footer className="md:ml-64 bg-card/95 backdrop-blur-md shadow-card border-t border-border">
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <PageTranslator context="footer">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-foreground/80 font-medium">
                    © 2025 NODE CRM – Enterprise-Grade Customer Intelligence Platform
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">All Systems Operational</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>SOC 2 Certified</span>
                  <span>•</span>
                  <span>GDPR Compliant</span>
                  <span>•</span>
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </PageTranslator>
          </div>
        </div>
      </footer>

      {/* Desktop Quick Actions Floating Menu (hidden on super admin dashboard) */}
      {!isSuperAdminDashboard && (
        <div className="hidden md:block">
          <QuickActionsMenu />
        </div>
      )}

      {/* Mobile Floating Action Button (hidden on super admin dashboard) */}
      {!isSuperAdminDashboard && <MobileFAB />}

      {/* Accessibility Floating Button (hidden on super admin dashboard) */}
      {!isSuperAdminDashboard && <AccessibilityFloatingButton />}

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      
      {/* Chatbot Trigger (hidden on super admin dashboard) */}
      {!isSuperAdminDashboard && <ChatbotTrigger />}
      


    </div>
  );
}