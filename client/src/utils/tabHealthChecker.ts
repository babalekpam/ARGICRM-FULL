// Tab Health Checker - Automatically detects and suggests fixes for tab issues
export interface TabHealthReport {
  componentName: string;
  status: 'healthy' | 'warning' | 'error';
  issues: TabIssue[];
  autoFixAvailable: boolean;
}

export interface TabIssue {
  type: 'missing_handler' | 'invalid_active_tab' | 'missing_content' | 'state_sync' | 'performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
  fix: string;
  autoFixable: boolean;
}

export class TabHealthChecker {
  private static instance: TabHealthChecker;
  private healthReports: Map<string, TabHealthReport> = new Map();

  static getInstance(): TabHealthChecker {
    if (!TabHealthChecker.instance) {
      TabHealthChecker.instance = new TabHealthChecker();
    }
    return TabHealthChecker.instance;
  }

  // Check tab health for a component
  checkTabHealth(componentName: string, config: {
    activeTab: string;
    tabValues: string[];
    hasOnValueChange: boolean;
    hasTabsContent: boolean;
    tabContents: string[];
    renderCount?: number;
  }): TabHealthReport {
    const issues: TabIssue[] = [];

    // Check 1: Missing onValueChange handler
    if (!config.hasOnValueChange) {
      issues.push({
        type: 'missing_handler',
        description: 'onValueChange handler is missing',
        severity: 'high',
        fix: 'Add onValueChange={setActiveTab} to the Tabs component',
        autoFixable: false
      });
    }

    // Check 2: Invalid active tab
    if (!config.tabValues.includes(config.activeTab)) {
      issues.push({
        type: 'invalid_active_tab',
        description: `Active tab "${config.activeTab}" not found in available tabs: ${config.tabValues.join(', ')}`,
        severity: 'high',
        fix: `Set activeTab to one of: ${config.tabValues.join(', ')} or add TabsTrigger for "${config.activeTab}"`,
        autoFixable: true
      });
    }

    // Check 3: Missing TabsContent
    if (!config.hasTabsContent) {
      issues.push({
        type: 'missing_content',
        description: 'No TabsContent components found',
        severity: 'high',
        fix: 'Add TabsContent components with values matching TabsTrigger values',
        autoFixable: false
      });
    }

    // Check 4: Mismatched content values
    const missingContent = config.tabValues.filter(value => !config.tabContents.includes(value));
    const extraContent = config.tabContents.filter(value => !config.tabValues.includes(value));

    if (missingContent.length > 0) {
      issues.push({
        type: 'missing_content',
        description: `Missing TabsContent for: ${missingContent.join(', ')}`,
        severity: 'medium',
        fix: `Add TabsContent with value="${missingContent.join('" and "')}"`,
        autoFixable: false
      });
    }

    if (extraContent.length > 0) {
      issues.push({
        type: 'missing_content',
        description: `Extra TabsContent without matching triggers: ${extraContent.join(', ')}`,
        severity: 'low',
        fix: `Remove TabsContent with value="${extraContent.join('" and "')}" or add matching TabsTrigger`,
        autoFixable: false
      });
    }

    // Check 5: Performance issues
    if (config.renderCount && config.renderCount > 50) {
      issues.push({
        type: 'performance',
        description: `High render count detected (${config.renderCount})`,
        severity: 'medium',
        fix: 'Consider memoizing tab content or optimizing component structure',
        autoFixable: false
      });
    }

    const status = issues.length === 0 ? 'healthy' : 
                   issues.some(i => i.severity === 'high') ? 'error' : 'warning';

    const report: TabHealthReport = {
      componentName,
      status,
      issues,
      autoFixAvailable: issues.some(i => i.autoFixable)
    };

    this.healthReports.set(componentName, report);
    return report;
  }

  // Auto-fix issues where possible
  autoFix(componentName: string): string[] {
    const report = this.healthReports.get(componentName);
    if (!report) return [];

    const fixes: string[] = [];

    report.issues.forEach(issue => {
      if (issue.autoFixable) {
        switch (issue.type) {
          case 'invalid_active_tab':
            fixes.push(`Reset activeTab to default value`);
            // This would need to be implemented in the component using the checker
            break;
        }
      }
    });

    return fixes;
  }

  // Generate health summary for all components
  getHealthSummary(): {
    healthy: number;
    warnings: number;
    errors: number;
    reports: TabHealthReport[];
  } {
    const reports = Array.from(this.healthReports.values());
    return {
      healthy: reports.filter(r => r.status === 'healthy').length,
      warnings: reports.filter(r => r.status === 'warning').length,
      errors: reports.filter(r => r.status === 'error').length,
      reports
    };
  }

  // Clear health data
  clearHealth() {
    this.healthReports.clear();
  }

  // Generate fix suggestions for common patterns
  generateFixSuggestions(issues: TabIssue[]): string[] {
    const suggestions: string[] = [];

    const hasHandlerIssue = issues.some(i => i.type === 'missing_handler');
    const hasInvalidTab = issues.some(i => i.type === 'invalid_active_tab');
    const hasContentIssue = issues.some(i => i.type === 'missing_content');

    if (hasHandlerIssue) {
      suggestions.push(`
// Fix: Add onValueChange handler
<Tabs value={activeTab} onValueChange={setActiveTab}>
  {/* your tabs content */}
</Tabs>`);
    }

    if (hasInvalidTab) {
      suggestions.push(`
// Fix: Ensure activeTab matches available values
const [activeTab, setActiveTab] = useState("overview"); // Use valid tab value
const tabValues = ["overview", "details", "settings"]; // Define your tab values
// Ensure activeTab is always one of these values`);
    }

    if (hasContentIssue) {
      suggestions.push(`
// Fix: Add matching TabsContent for each TabsTrigger
<TabsList>
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="details">Details</TabsTrigger>
</TabsList>
<TabsContent value="overview">{/* content */}</TabsContent>
<TabsContent value="details">{/* content */}</TabsContent>`);
    }

    return suggestions;
  }
}

// React hook to use tab health checking
import { useEffect, useRef } from 'react';

export function useTabHealthCheck(
  componentName: string,
  config: {
    activeTab: string;
    tabValues: string[];
    hasOnValueChange: boolean;
    hasTabsContent: boolean;
    tabContents: string[];
  }
) {
  const checker = TabHealthChecker.getInstance();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const report = checker.checkTabHealth(componentName, {
      ...config,
      renderCount: renderCount.current
    });

    if (report.status === 'error') {
      console.error(`Tab health check failed for ${componentName}:`, report.issues);
    } else if (report.status === 'warning') {
      console.warn(`Tab health warnings for ${componentName}:`, report.issues);
    }

    return report;
  }, [componentName, config.activeTab, config.tabValues.join(','), config.hasOnValueChange, config.hasTabsContent, config.tabContents.join(',')]);
}