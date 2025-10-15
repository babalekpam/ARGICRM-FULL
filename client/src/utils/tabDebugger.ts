// Tab debugging utility to identify and fix common tab issues
export class TabDebugger {
  private static instance: TabDebugger;
  private logs: string[] = [];
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): TabDebugger {
    if (!TabDebugger.instance) {
      TabDebugger.instance = new TabDebugger();
    }
    return TabDebugger.instance;
  }

  // Log tab state changes
  logTabChange(componentName: string, oldTab: string, newTab: string) {
    const message = `[${componentName}] Tab changed: ${oldTab} → ${newTab}`;
    this.logs.push(`${new Date().toISOString()}: ${message}`);
    console.log(message);
  }

  // Log tab rendering issues
  logTabError(componentName: string, error: string, context?: any) {
    const errorKey = `${componentName}:${error}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    const message = `[${componentName}] ERROR: ${error}`;
    this.logs.push(`${new Date().toISOString()}: ${message}`);
    console.error(message, context);
  }

  // Check for common tab issues
  validateTabImplementation(componentName: string, config: {
    activeTab: string;
    tabValues: string[];
    hasOnValueChange: boolean;
    hasTabsContent: boolean;
  }) {
    const issues: string[] = [];

    // Check if active tab exists in tab values
    if (!config.tabValues.includes(config.activeTab)) {
      issues.push(`Active tab "${config.activeTab}" not found in tab values`);
    }

    // Check if onValueChange handler exists
    if (!config.hasOnValueChange) {
      issues.push('Missing onValueChange handler');
    }

    // Check if TabsContent exists
    if (!config.hasTabsContent) {
      issues.push('Missing TabsContent components');
    }

    if (issues.length > 0) {
      this.logTabError(componentName, `Validation failed: ${issues.join(', ')}`);
      return false;
    }

    return true;
  }

  // Get debugging report
  getReport(): {
    logs: string[];
    errorCounts: Map<string, number>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Generate recommendations based on error patterns
    this.errorCounts.forEach((count, errorKey) => {
      if (count > 3) {
        recommendations.push(`Frequent error detected: ${errorKey} (${count} times)`);
      }
    });

    if (this.logs.length === 0) {
      recommendations.push('No tab activity detected - ensure tabs are properly initialized');
    }

    return {
      logs: [...this.logs],
      errorCounts: new Map(this.errorCounts),
      recommendations
    };
  }

  // Clear debug data
  clear() {
    this.logs = [];
    this.errorCounts.clear();
  }
}

// Enhanced tab wrapper component for debugging
export function withTabDebugging<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function DebuggedTabComponent(props: T) {
    const tabDebugger = TabDebugger.getInstance();
    
    // Monitor tab changes if activeTab prop exists
    const activeTab = (props as any).activeTab;
    const prevActiveTab = React.useRef(activeTab);
    
    React.useEffect(() => {
      if (activeTab !== prevActiveTab.current) {
        tabDebugger.logTabChange(componentName, prevActiveTab.current || 'none', activeTab || 'none');
        prevActiveTab.current = activeTab;
      }
    }, [activeTab, tabDebugger]);

    try {
      return React.createElement(Component, props);
    } catch (error) {
      tabDebugger.logTabError(componentName, `Render error: ${error}`, error);
      throw error;
    }
  };
}

// React import for the component wrapper
import React from 'react';