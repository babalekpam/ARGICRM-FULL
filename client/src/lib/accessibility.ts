import { useState, useEffect } from 'react';

export interface AccessibilitySettings {
  screenReaderMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicators: boolean;
  skipNavigation: boolean;
  keyboardNavigation: boolean;
  announcements: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  screenReaderMode: false,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  focusIndicators: true,
  skipNavigation: true,
  keyboardNavigation: true,
  announcements: true,
};

class AccessibilityManager {
  private static instance: AccessibilityManager;
  private settings: AccessibilitySettings;
  private listeners: Set<(settings: AccessibilitySettings) => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.detectSystemPreferences();
    this.applySettings();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private loadSettings(): AccessibilitySettings {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  private detectSystemPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true;
    }

    // Detect screen reader usage
    if (this.detectScreenReader()) {
      this.settings.screenReaderMode = true;
    }
  }

  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    return (
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis !== undefined ||
      'speechSynthesis' in window
    );
  }

  private applySettings(): void {
    const root = document.documentElement;

    // Apply font size
    root.setAttribute('data-font-size', this.settings.fontSize);

    // Apply high contrast
    root.classList.toggle('high-contrast', this.settings.highContrast);

    // Apply reduced motion
    root.classList.toggle('reduced-motion', this.settings.reducedMotion);

    // Apply focus indicators
    root.classList.toggle('enhanced-focus', this.settings.focusIndicators);

    // Apply screen reader mode
    root.classList.toggle('screen-reader-mode', this.settings.screenReaderMode);

    // Update CSS custom properties
    root.style.setProperty('--font-size-multiplier', this.getFontSizeMultiplier());
  }

  private getFontSizeMultiplier(): string {
    switch (this.settings.fontSize) {
      case 'small': return '0.875';
      case 'medium': return '1';
      case 'large': return '1.125';
      case 'extra-large': return '1.25';
      default: return '1';
    }
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.applySettings();
    this.notifyListeners();
  }

  subscribe(listener: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  // Announce messages to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.settings.announcements) return;

    const announcer = document.getElementById('sr-announcer') || this.createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  private createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }

  // Focus management
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }

  // Enhanced keyboard navigation
  enableKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleGlobalKeyboard.bind(this));
  }

  private handleGlobalKeyboard(e: KeyboardEvent): void {
    if (!this.settings.keyboardNavigation) return;

    // Alt + 1: Main navigation
    if (e.altKey && e.key === '1') {
      const nav = document.querySelector('[role="navigation"]') as HTMLElement;
      nav?.focus();
      e.preventDefault();
    }

    // Alt + 2: Main content
    if (e.altKey && e.key === '2') {
      const main = document.querySelector('main') as HTMLElement;
      main?.focus();
      e.preventDefault();
    }

    // Alt + 3: Search
    if (e.altKey && e.key === '3') {
      const search = document.querySelector('[role="search"] input') as HTMLElement;
      search?.focus();
      e.preventDefault();
    }

    // Escape: Close modals/dropdowns
    if (e.key === 'Escape') {
      const openDialog = document.querySelector('[role="dialog"][open]') as HTMLElement;
      if (openDialog) {
        const closeButton = openDialog.querySelector('[aria-label*="close"]') as HTMLElement;
        closeButton?.click();
      }
    }
  }
}

export const accessibilityManager = AccessibilityManager.getInstance();

// React hook for accessibility settings
export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    accessibilityManager.getSettings()
  );

  useEffect(() => {
    return accessibilityManager.subscribe(setSettings);
  }, []);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    accessibilityManager.updateSettings(updates);
  };

  const announce = (message: string, priority?: 'polite' | 'assertive') => {
    accessibilityManager.announce(message, priority);
  };

  return {
    settings,
    updateSettings,
    announce,
    trapFocus: accessibilityManager.trapFocus.bind(accessibilityManager),
  };
}

// Accessibility utilities
export const a11yUtils = {
  // Generate unique IDs for form labels
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Format aria-label for buttons
  formatButtonLabel: (action: string, context?: string): string => {
    return context ? `${action} ${context}` : action;
  },

  // Format aria-describedby text
  formatDescription: (description: string, required: boolean = false): string => {
    return `${description}${required ? '. Required field.' : ''}`;
  },

  // Check if element is visible to screen readers
  isVisibleToScreenReader: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      element.getAttribute('aria-hidden') === 'true'
    );
  },

  // Get readable text content
  getAccessibleText: (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    return element.textContent || '';
  },
};