# NODE CRM Design Guidelines
**AI-Powered B2B SaaS Platform**

## Design Philosophy

**Approach**: Hybrid system combining Linear's clarity, Notion's comfort, and Stripe's polish for enterprise CRM requiring sophisticated data visualization and comfortable long-session usability.

**Core Principles**:
- Depth through layering (rich backgrounds, elevated surfaces)
- Progressive disclosure (organize complexity)
- Consistent polish (every page intentional)
- Professional warmth (trustworthy yet approachable)

---

## Typography

**Fonts**: Inter (primary), JetBrains Mono (data/metrics)

**Scale**:
```
Page Titles:      text-3xl font-bold
Section Headers:  text-xl font-semibold  
Card Titles:      text-lg font-medium
Body:             text-base font-normal
Meta/Subtext:     text-sm font-normal
Labels:           text-xs font-medium uppercase tracking-wider
Metrics:          text-2xl md:text-4xl font-bold (monospace)
Buttons:          text-sm font-medium
```

---

## Layout & Spacing

**Primitives**: Use Tailwind units: 2, 3, 4, 6, 8, 12, 16, 20, 24

**Structure**:
- **Sidebar**: Fixed w-64 lg:w-72
- **Content**: max-w-7xl, px-6 lg:px-8
- **Top Bar**: h-16 sticky with backdrop-blur-md
- **Card Grids**: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6

**Rhythm**:
- Page padding: py-8 lg:py-12
- Section spacing: mb-8 lg:mb-12
- Card padding: p-6 lg:p-8
- List items: py-4

---

## Visual Treatment

**Backgrounds**:
- Base: Subtle diagonal gradients (top-left to bottom-right)
- Cards: Distinct backgrounds with borders (not transparent)
- Three depth levels: base → elevated (cards) → floating (modals)

**Shadows**:
- Cards: shadow-sm, hover:shadow-lg
- Dropdowns: shadow-xl
- Modals: shadow-2xl with backdrop blur
- Floating actions: shadow-lg with ring

---

## Components

### Navigation Sidebar

**Structure**: Fixed vertical nav with logo (h-16), grouped items, user footer

**Elements**:
- Icons: Heroicons outline, 20x20
- Active state: Background + border-l-4 accent
- Badges: Count pills on items
- Collapsible sections for sub-nav

**Categories**: Dashboard, Contacts, Companies, Deals, Pipeline, Tasks, Email, Reports, SEO Tools, Settings

### Top Bar

- Left: Breadcrumbs (Icon > Parent > Current)
- Center: Search (w-64, focus:w-96, cmd+k hint)
- Right: Quick actions, notifications, user menu with avatar dropdown

### Cards

**1. Metric Cards (KPI)**:
- Large monospace value
- Trend indicator with % change
- Optional mini sparkline
- Comparison text
- CTA link

**2. Chart Cards**:
- Title + time range selector
- Full-width chart with padding
- Horizontal legend below
- Export/fullscreen buttons (top-right)
- Footer with insights

**3. List Cards**:
- Scrollable (max-h-96)
- Rows: avatar/icon, title, subtitle, timestamp
- Hover states
- "View all" footer
- Empty state with illustration + CTA

**4. Pipeline Cards**:
- Stage name + count header
- Draggable deal items
- Progress indicator (total value)
- "+ Add deal" action

### Contact/Company Cards (Grid)

- Avatar (rounded-full) or logo (rounded-lg)
- Name (font-semibold), role/industry
- Key metrics (deal value, last contact)
- Quick actions (email, call, view)
- Hover elevation

### Data Tables

**Features**:
- Sticky header with sort
- Fixed first column
- Row selection checkboxes
- Inline editing (double-click)
- Bulk actions toolbar
- Pagination + density toggle

**Styling**:
- Alternating row backgrounds
- Full row hover highlight
- Cell formatting (links, tags, badges)
- Column visibility controls

### Forms

**Inputs** (h-11, rounded-lg):
- Label above with required indicator
- Helper text below
- Error/success states with icons
- Icon support (left/right)

**Types**:
- Text/email, select (searchable), multi-select (pills)
- Date pickers (range capable), rich text (toolbar)
- File upload (drag-drop with preview)

### Modals

**Sizes**: max-w-md (small), max-w-2xl (medium), max-w-5xl (large), full-screen

**Structure**:
- Header: Title, close, optional subtitle
- Scrollable body with padding
- Footer: Primary right, secondary left
- Backdrop: Blur with opacity

### Buttons

**Variants & Sizes**:
```
Primary:   Bold, gradient-capable (main actions)
Secondary: Bordered (alternatives)
Ghost:     Minimal (tertiary)
Danger:    Red (destructive)
Icon-only: Square with tooltip

Small:  h-8 px-3 text-sm
Medium: h-10 px-4 text-sm  
Large:  h-12 px-6 text-base
```

**States**: Hover, active, loading (spinner), disabled

### Badges & Tags

- Pill: rounded-full px-3 py-1
- Dot indicator with label
- Color-coded: success, warning, error, info, neutral
- Removable (X icon)

### Empty States

- Icon/illustration (120x120)
- Primary message (text-lg font-medium)
- Description text
- Primary CTA button
- Optional secondary link

---

## Page Layouts

### Dashboard

1. Welcome header (user name, date)
2. KPI row (4 metrics: Revenue, Deals, Contacts, Tasks)
3. Pipeline overview (horizontal stages)
4. Recent activity (left 2/3) + Quick actions (right 1/3)
5. Upcoming tasks/meetings

### CRM Pages (Contacts/Companies/Deals)

- Collapsible filter sidebar (saved views, filters)
- Table/grid toggle
- Bulk action toolbar
- Floating "+ Create" button (bottom-right)

### Analytics & Reports

- Time range selector (top-right)
- Summary metrics row
- Large featured chart
- Secondary insights (2-column)
- Exportable data table

### SEO Tools

- Domain/project selector (top)
- Health score (prominent)
- Issue prioritization (critical/medium/low)
- Charts (line, pie)
- Actionable recommendations list

### Settings

- Tab-based with vertical side menu
- Sectioned forms
- Save/cancel always visible
- Progressive disclosure for advanced options

---

## Data Visualization

**Library**: Chart.js or Recharts

**Charts**:
- Line: Trends (revenue, contacts)
- Bar: Comparisons (stages, performance)
- Pie/Donut: Distributions (sources, status)
- Funnel: Pipeline conversion
- Heatmap: Activity patterns

**Styling**:
- Smooth curves (line charts)
- Clear axis labels + gridlines
- Interactive tooltips
- Context-appropriate legends
- Responsive with min-height

---

## Icons & Images

**Icons**: Heroicons (outline primary, solid for active)
- Nav: 20x20
- Buttons: 16x16 or 20x20
- Cards: 24x24
- Empty states: 48x48 to 120x120

**Images**:
- Avatars: Circular, 32/40/48/64px, initials fallback
- Logos: Rounded square, 40/56/80px
- Empty states: Professional SVG
- Fallback: Colored backgrounds with initials

---

## Animations & Interactions

**Timing** (subtle, purposeful):
- Page transitions: 200ms fade
- Card hover: 150ms ease-out elevation
- Dropdowns: 200ms scale + fade
- Modals: 250ms scale (95% to 100%)
- Skeleton loading: Subtle pulse

---

## Accessibility

**Requirements**:
- Focus rings on all interactive elements (with offset)
- Full keyboard navigation (tab order, escape)
- Screen reader labels on icon buttons
- Proper heading hierarchy (h1→h2→h3)
- WCAG contrast ratios
- 44x44px minimum touch targets
- Loading states for async operations
- Error recovery guidance

**Consistency Rules**:
- Use only defined spacing primitives
- Reuse component patterns across pages
- Apply typography scale uniformly
- Identical interactive states everywhere

---

**Implementation Note**: Mobile-first responsive design. Prioritize information density with breathing room. Every element serves utility and builds trust.