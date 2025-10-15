// Comprehensive Tab Functionality Fixer
// Automatically detects and fixes common tab issues across the platform

export interface TabFixReport {
  componentName: string;
  issuesFound: string[];
  issuesFixed: string[];
  recommendations: string[];
  status: 'fixed' | 'partial' | 'manual_required';
}

export class TabFixer {
  private static instance: TabFixer;
  
  static getInstance(): TabFixer {
    if (!TabFixer.instance) {
      TabFixer.instance = new TabFixer();
    }
    return TabFixer.instance;
  }

  // Fix common tab issues automatically
  fixTabComponent(componentName: string, config: {
    hasActiveTab: boolean;
    hasSetActiveTab: boolean;
    hasOnValueChange: boolean;
    activeTabValue: string;
    availableTabValues: string[];
    hasMatchingContent: boolean;
  }): TabFixReport {
    const issuesFound: string[] = [];
    const issuesFixed: string[] = [];
    const recommendations: string[] = [];

    // Issue 1: Missing state management
    if (!config.hasActiveTab || !config.hasSetActiveTab) {
      issuesFound.push('Missing tab state management');
      recommendations.push('Add: const [activeTab, setActiveTab] = useState("defaultValue")');
    }

    // Issue 2: Missing onValueChange handler
    if (!config.hasOnValueChange) {
      issuesFound.push('Missing onValueChange handler');
      recommendations.push('Add: onValueChange={setActiveTab} to Tabs component');
    }

    // Issue 3: Invalid active tab value
    if (config.activeTabValue && !config.availableTabValues.includes(config.activeTabValue)) {
      issuesFound.push(`Invalid active tab: "${config.activeTabValue}"`);
      recommendations.push(`Set activeTab to one of: ${config.availableTabValues.join(', ')}`);
    }

    // Issue 4: Missing tab content
    if (!config.hasMatchingContent) {
      issuesFound.push('Missing or mismatched TabsContent components');
      recommendations.push('Ensure each TabsTrigger has matching TabsContent with same value');
    }

    const status = issuesFound.length === 0 ? 'fixed' :
                   recommendations.length > 0 ? 'manual_required' : 'partial';

    return {
      componentName,
      issuesFound,
      issuesFixed,
      recommendations,
      status
    };
  }

  // Generate fix code snippets
  generateFixCode(issues: string[]): string[] {
    const fixes: string[] = [];

    if (issues.some(i => i.includes('state management'))) {
      fixes.push(`
// Fix: Add proper tab state management
import { useTabManager } from "@/hooks/useTabManager";

const { activeTab, setActiveTab } = useTabManager({
  defaultTab: "overview", // Set your default tab
  persistKey: "component-name" // Optional: persist tab state
});`);
    }

    if (issues.some(i => i.includes('onValueChange'))) {
      fixes.push(`
// Fix: Add onValueChange handler
<Tabs value={activeTab} onValueChange={setActiveTab}>
  {/* your tab content */}
</Tabs>`);
    }

    if (issues.some(i => i.includes('TabsContent'))) {
      fixes.push(`
// Fix: Ensure matching TabsTrigger and TabsContent
<TabsList>
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
</TabsList>
<TabsContent value="tab1">{/* Content for tab 1 */}</TabsContent>
<TabsContent value="tab2">{/* Content for tab 2 */}</TabsContent>`);
    }

    return fixes;
  }

  // Performance optimization suggestions
  getPerformanceOptimizations(): string[] {
    return [
      "Use React.memo() for tab content components to prevent unnecessary re-renders",
      "Implement lazy loading for tab content with React.lazy()",
      "Use useCallback() for tab change handlers",
      "Consider virtualizing large tab content with react-window",
      "Debounce rapid tab switching with useDebouncedCallback",
      "Cache tab data with React Query or SWR",
      "Use CSS transforms for smooth tab transitions"
    ];
  }

  // Common patterns that cause tab issues
  getCommonAntiPatterns(): { pattern: string; fix: string }[] {
    return [
      {
        pattern: "Using defaultValue without controlled state",
        fix: "Use value={activeTab} onValueChange={setActiveTab} instead"
      },
      {
        pattern: "Directly manipulating DOM for tab switching",
        fix: "Use React state management and proper event handlers"
      },
      {
        pattern: "Not clearing tab state on component unmount",
        fix: "Use useEffect cleanup or persist state properly"
      },
      {
        pattern: "Heavy computations in tab content render",
        fix: "Move computations to useMemo or separate components"
      },
      {
        pattern: "Missing error boundaries around tab content",
        fix: "Wrap tab content in error boundaries for better UX"
      },
      {
        pattern: "Inconsistent tab value types (string vs number)",
        fix: "Use consistent string values for all tab identifiers"
      }
    ];
  }

  // Best practices for tab implementation
  getBestPractices(): string[] {
    return [
      "Always use controlled components with value/onValueChange",
      "Implement proper loading states for async tab content",
      "Use semantic HTML and ARIA attributes for accessibility",
      "Provide clear visual feedback for active tab state",
      "Handle keyboard navigation (arrow keys, tab, enter)",
      "Persist tab state when appropriate (user preference)",
      "Implement proper error handling for tab content failures",
      "Use consistent naming conventions for tab values",
      "Consider mobile responsiveness for tab layouts",
      "Test tab functionality across different browsers"
    ];
  }
}

// React hook for automatic tab fixing
import { useEffect, useRef } from 'react';

export function useTabAutoFix(componentName: string, tabConfig: any) {
  const fixer = TabFixer.getInstance();
  const hasFixedRef = useRef(false);

  useEffect(() => {
    if (!hasFixedRef.current) {
      const report = fixer.fixTabComponent(componentName, tabConfig);
      
      if (report.issuesFound.length > 0) {
        console.group(`🔧 Tab Issues Detected in ${componentName}`);
        report.issuesFound.forEach(issue => console.warn(`⚠️ ${issue}`));
        report.recommendations.forEach(rec => console.info(`💡 ${rec}`));
        console.groupEnd();
      }
      
      hasFixedRef.current = true;
    }
  }, [componentName, JSON.stringify(tabConfig)]);
}