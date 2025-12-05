# NODE CRM Design Guidelines
**B2B Sales Intelligence & CRM Platform - Apollo.io Inspired**

## Design Philosophy

**Approach**: Dark, modern SaaS interface combining Apollo.io's data density with Linear's clarity and Notion's organization. Professional B2B aesthetic with flat design, strategic use of color, and generous breathing room.

**Core Principles**:
- Information density without clutter
- Dark backgrounds with strategic accent use
- Flat, bordered cards (minimal shadows)
- Whitespace creates hierarchy
- Data-first presentation

---

## Color System

**Backgrounds**:
- Deep Navy Base: #0B0D17 (page background)
- Dark Indigo Surface: #11152B (cards, elevated surfaces)
- Raised Elements: #1A1F3A (hover states, active elements)

**Accents**:
- Primary Blue: #4C6EF5 (CTAs, links, primary actions)
- Purple Accent: #7048E8 (secondary highlights, gradients)
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

**Text**:
- Primary: #F8F9FA (headings, emphasis)
- Secondary: #94A3B8 (body, descriptions)
- Tertiary: #64748B (metadata, labels)

**Borders**: #1E293B (subtle separation)

---

## Typography

**Font**: Inter (all weights, tight tracking -0.02em)

**Scale**:
```
Page Titles:      text-3xl font-bold tracking-tight
Section Headers:  text-xl font-semibold tracking-tight
Card Titles:      text-lg font-semibold
Body:             text-sm font-normal
Meta/Labels:      text-xs font-medium uppercase tracking-wide
Metrics:          text-4xl font-bold tabular-nums
```

---

## Layout & Spacing

**Primitives**: 4, 6, 8, 12, 16, 20, 24, 32, 48

**Structure**:
- Sidebar: Fixed w-64 with #11152B background
- Content: max-w-7xl px-8 py-12
- Top Bar: h-16 with border-b
- Grid rhythm: 24px mobile, 32px desktop

**Containers**:
- Dashboard widgets: gap-6 lg:gap-8
- Form sections: space-y-6
- Card padding: p-6 lg:p-8

---

## Navigation Sidebar

**Layout**: Fixed left, #11152B background, subtle border-r

**Structure**:
- Logo area (h-16, px-6)
- Nav groups (space-y-8, py-8)
- User section (bottom, border-t, p-6)

**Nav Items**:
- Heroicons outline (20x20)
- Active: #1A1F3A background, #4C6EF5 left border (3px), primary text
- Inactive: Secondary text, hover to raised background
- Badges: Small pills with counts

**Groups**: Prospecting, CRM, Engagement, Intelligence, Analytics, Settings

---

## Top Navigation

**Layout**: h-16, border-b, flex justify-between

**Left**: Breadcrumbs with Heroicons, current page emphasized
**Center**: Global search (w-96, #1A1F3A bg, focus ring primary)
**Right**: Quick actions (icon buttons), notifications (badge), user avatar menu

---

## Cards & Surfaces

**Base Card**:
- Background: #11152B
- Border: 1px #1E293B
- Rounded: rounded-lg
- Padding: p-6
- NO shadows (flat design)

**Card Types**:

**Metric Widgets**:
- Large tabular number (text-4xl)
- Label above (text-xs uppercase)
- Trend indicator (+/- with arrow, colored)
- Mini sparkline chart (Recharts)
- Comparison text below

**Data Cards**:
- Header with title + action buttons
- Content area (scrollable if needed)
- Footer with pagination/actions

**List Cards**:
- Items with hover (#1A1F3A background)
- Left icon/avatar, title, metadata
- Right actions (ghost buttons)
- Empty state with illustration + CTA

---

## Data Tables

**Design**:
- Sticky header (#0B0D17 background)
- Row hover: #1A1F3A
- Borders: Horizontal only (#1E293B)
- Cell padding: px-6 py-4
- Column sorting indicators
- Inline filters (dropdown menus)

**Features**:
- Multi-select checkboxes (left)
- Bulk action bar (appears on selection)
- Column visibility toggle
- Density controls (comfortable/compact)
- Export button (top-right)

**Cell Types**:
- Text with truncation
- Pills/badges for status
- Avatar + name combos
- Action dropdowns (3-dot menu)
- Inline editable fields

---

## Forms & Inputs

**Input Fields** (h-10, rounded-md):
- Background: #1A1F3A
- Border: 1px #1E293B
- Focus: Ring primary color
- Label: text-xs above, font-medium
- Helper: text-xs below, tertiary color

**Types**:
- Text inputs with icons
- Searchable dropdowns
- Multi-select with pill removals
- Date range pickers
- Toggle switches (primary color)
- Radio/checkbox groups

**Validation**:
- Error state: Red border + message
- Success: Green checkmark icon

---

## Buttons

**Primary**: bg-primary (#4C6EF5), hover:bg-#3D5DDB, white text, h-10 px-6
**Secondary**: border-#1E293B, hover:bg-#1A1F3A, h-10 px-6
**Ghost**: hover:bg-#1A1F3A, text-secondary, h-10 px-4
**Danger**: bg-error, hover:bg-#DC2626
**Icon-only**: Square 40x40, ghost style

**States**: Loading spinner, disabled opacity-50

---

## Modals & Overlays

**Modal**:
- Backdrop: Black opacity-60 with blur
- Container: #11152B, border #1E293B, rounded-lg
- Sizes: max-w-md, max-w-2xl, max-w-5xl
- Header: Title + close, border-b
- Footer: Actions right-aligned, border-t

**Dropdowns**:
- #11152B background
- Border #1E293B
- Rounded-md
- Items hover to #1A1F3A
- Dividers between groups

---

## Dashboard Layout

**Widget Grid**: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8

**Sections**:
1. KPI Row (4 metric widgets)
2. Activity Chart (full-width, height 400px)
3. Pipeline Funnel (2/3 width) + Quick Stats (1/3 width)
4. Recent Leads Table (full-width)
5. Tasks/Calendar (2-column split)

---

## Data Visualization

**Library**: Recharts

**Chart Styling**:
- Line/Area: Smooth curves, gradient fills (primary → transparent)
- Bar: Rounded tops, primary color
- Grid: #1E293B subtle lines
- Tooltips: #11152B with border
- Legend: Below charts, horizontal

**Chart Types**:
- Line: Revenue trends, activity over time
- Bar: Pipeline stages, performance
- Funnel: Conversion tracking
- Donut: Source distribution

---

## Icons & Images

**Icons**: Heroicons outline, consistent sizing
- Navigation: 20x20
- Buttons: 16x16
- Headers: 24x24

**Images**:
- Avatars: Circular, 32/40/48px, colored fallbacks with initials
- Company logos: Rounded square, 40/56px
- Empty states: Monochrome illustrations (secondary color)

**Hero Images**: Use for marketing pages - full-width with gradient overlay, buttons with backdrop-blur-md

---

## Accessibility & Interactions

**Focus States**: 2px ring offset-2 primary color
**Keyboard**: Full navigation, escape closes, enter submits
**Screen Readers**: aria-labels on icon buttons
**Touch Targets**: 44x44px minimum
**Contrast**: Maintain WCAG AA on dark backgrounds

**Transitions**:
- Hover: 150ms ease-out
- Dropdowns: 200ms scale
- Page loads: Skeleton pulse

---

**Implementation**: Mobile-first responsive. Collapse sidebar to drawer on mobile. Maintain 24/32px rhythm across breakpoints. Every page uses widget/card-based layout for consistency.