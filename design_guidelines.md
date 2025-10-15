# ARGILETTE Design Guidelines
## Analytics Dashboard Clone of Neil Patel's Ubersuggest

### Design Approach: Professional Analytics Dashboard System

**Selected Approach**: Design System-based approach inspired by modern analytics platforms (Material Design principles for data-rich applications)

**Justification**: SEO analytics dashboard requiring clarity, data density, and professional credibility. Utility-focused with information-dense content where performance and usability are paramount.

**Core Design Principles**:
- Clarity over complexity - present complex data digestibly
- Card-based modular layouts for metric grouping
- Single-page overview philosophy with minimal nested navigation
- Professional, trustworthy aesthetic for B2B SaaS context

---

## Color Palette

### Light Mode (Primary)
**Primary Brand**: 220 70% 45% (Professional blue - trust and reliability)
**Accent**: 142 65% 45% (Success green for positive metrics)
**Warning**: 25 85% 55% (Orange for alerts)
**Error**: 0 72% 51% (Red for critical issues)
**Background**: 0 0% 98% (Near white)
**Surface**: 0 0% 100% (Pure white cards)
**Border**: 220 15% 90% (Subtle gray)
**Text Primary**: 220 20% 15% (Near black)
**Text Secondary**: 220 10% 45% (Medium gray)

### Dark Mode
**Background**: 220 18% 12% (Deep blue-gray)
**Surface**: 220 15% 16% (Elevated cards)
**Border**: 220 15% 24% (Subtle borders)
**Text Primary**: 220 15% 95% (Near white)
**Text Secondary**: 220 10% 65% (Light gray)

---

## Typography

**Primary Font**: Inter (via Google Fonts CDN)
**Monospace Font**: JetBrains Mono (for metrics/numbers)

**Hierarchy**:
- **Page Titles**: text-2xl font-semibold (Dashboard sections)
- **Card Headers**: text-lg font-medium
- **Body Text**: text-sm font-normal
- **Metric Values**: text-3xl font-bold (using monospace)
- **Labels**: text-xs font-medium uppercase tracking-wide
- **Button Text**: text-sm font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20 (p-2, m-4, gap-6, etc.)

**Grid Structure**:
- **Sidebar**: Fixed w-64 with vertical navigation
- **Main Content**: Flexible flex-1 with max-w-7xl container
- **Card Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- **Responsive Padding**: px-4 md:px-6 lg:px-8
- **Section Spacing**: mb-8 between major sections

---

## Component Library

### Navigation (Left Sidebar)
**Structure**: Fixed vertical sidebar with logo at top, navigation items with icons, user profile at bottom

**Elements**:
- ARGILETTE logo/wordmark (h-8)
- Navigation items with Heroicons (outline style) and labels
- Active state: bg-primary/10 with border-l-4 border-primary
- Hover state: bg-surface-secondary
- Categories: Dashboard, Keyword Research, Traffic Analyzer, SEO Analyzer, Competitors

### Dashboard Cards
**Base Style**: 
- White background (dark mode: elevated surface)
- Rounded corners: rounded-lg
- Subtle shadow: shadow-sm hover:shadow-md
- Padding: p-6
- Border: border border-border

**Card Types**:
1. **Metric Cards**: Large number display with trend indicator (↑↓) and sparkline
2. **Chart Cards**: Header with title/action button, chart area, footer with legend
3. **List Cards**: Header, scrollable list with row items, "View all" footer link
4. **Action Cards**: Icon, title, description, primary CTA button

### Data Visualization

**Chart Library**: Use Chart.js or Recharts via CDN

**Chart Types**:
- **Pie Charts**: For keyword ranking distribution (positions 1-3, 4-10, 11-20, 21+)
- **Line Graphs**: For traffic trends over 30-day periods
- **Bar Charts**: For competitor comparisons and backlink growth
- **Sparklines**: For metric trend indicators in cards

**Color Coding**:
- Positive metrics: Success green
- Negative metrics: Error red  
- Neutral/stable: Text secondary gray
- Primary data series: Primary brand blue

### Forms & Inputs
**Style**:
- Input fields: h-10 rounded-md border border-border px-3
- Focus state: ring-2 ring-primary/20 border-primary
- Dark mode: bg-surface with proper contrast
- Search bars: w-full with search icon (Heroicons)
- Dropdowns: Select with chevron icon, max-h-60 overflow-auto

### Buttons
**Primary**: bg-primary text-white hover:bg-primary/90 rounded-md px-4 py-2
**Secondary**: border border-border hover:bg-surface-secondary rounded-md px-4 py-2
**Ghost**: text-primary hover:bg-primary/10 rounded-md px-4 py-2
**Icon Buttons**: Square p-2 with icon, hover:bg-surface-secondary rounded-md

### Tables
**Structure**: 
- Striped rows for readability (alternate bg-surface-secondary/50)
- Sticky header: bg-surface-secondary font-medium
- Sortable columns with sort indicators
- Responsive: Scroll horizontally on mobile
- Cell padding: px-4 py-3

### Modals & Overlays
**Modal**: max-w-2xl centered with backdrop blur-sm bg-black/50
**Dropdown Menus**: Elevated with shadow-lg, rounded-lg, border
**Tooltips**: Small rounded bg-gray-900 text-white px-2 py-1 text-xs

---

## Page Sections

### Top Bar
- Breadcrumb navigation (Home > Projects > Dashboard)
- Project switcher dropdown (right side)
- User avatar/settings (far right)
- Height: h-16 with border-b border-border

### Project Overview Card
- Project name (text-2xl font-bold)
- Domain URL with copy button
- Integration badges (Google Analytics, Search Console)
- Quick action buttons (Edit, Delete, Settings)

### SEO Health Score Section
- Large circular progress indicator (0-100 score)
- Color-coded: Red (<50), Orange (50-70), Green (70+)
- "Improve Score" CTA button
- List of top 3-5 critical issues with severity indicators

### Keyword Ranking Widget
- Pie chart showing distribution by position ranges
- Legend with counts: Top 3, 4-10, 11-20, 21-50, 50+
- Date range selector (Last 7 days, 30 days, 90 days)
- Average position metric prominently displayed

### Traffic Analytics Card
- Line graph showing 30-day organic traffic trend
- Y-axis: Visit count, X-axis: Dates
- Metric callouts: Total visits, % change vs previous period
- Google Analytics integration badge
- Export chart button (icon only)

### Backlinks Overview
- Headline metric: Total backlinks count
- Line graph: Backlink growth over time
- Referring domains count
- "View Opportunities" CTA linking to full backlink tool

### Competitor Tracking Section
- Grid of competitor cards (up to 3)
- Each card: Domain, domain score, top keyword, traffic estimate
- "+ Add Competitor" card to add new ones
- "Compare All" button

---

## Animations

**Minimal Approach**: 
- Card hover: Subtle shadow elevation (150ms ease)
- Chart rendering: Fade-in on load (300ms)
- Page transitions: None (instant)
- Loading states: Skeleton screens with subtle pulse

---

## Icons

**Library**: Heroicons (outline style) via CDN
**Common Icons**: 
- Dashboard: ChartBarIcon
- Keywords: MagnifyingGlassIcon  
- Traffic: ChartLineUpIcon
- SEO: CheckCircleIcon/ExclamationTriangleIcon
- Competitors: UsersIcon
- Settings: CogIcon

---

## Images

**No hero images** - This is a data-focused dashboard utility application. All visual elements are functional (charts, graphs, icons, data visualizations). Profile pictures and website favicons only where functionally necessary.