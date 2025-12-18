# ARGILETTE Design Guidelines
**Enterprise B2B SaaS Platform - ZoomInfo-Inspired Light Theme**

## Design Philosophy

**Approach**: Clean, professional enterprise SaaS interface with a light theme. Data-focused design that prioritizes scannability, efficiency, and clarity. Minimal shadows, clear borders, and consistent patterns throughout.

**Core Principles**:
1. Clean & Professional - minimal shadows, clear borders
2. Data-Focused - numbers prominent, easy to scan
3. Efficient - dense information, little whitespace waste
4. Consistent - same patterns repeated
5. Action-Oriented - CTAs are clear, blue stands out

---

## Color System

### Primary Colors
- **Primary Blue**: #3B82F6 (blue-500) - links, highlights
- **Primary Blue Dark**: #2563EB (blue-600) - buttons, CTAs

### Backgrounds
- **Page Background**: #F9FAFB (gray-50)
- **Card Background**: #FFFFFF (white)
- **Table Header**: #F9FAFB (gray-50)
- **Hover State**: #F9FAFB (gray-50)

### Borders
- **Default Border**: #E5E7EB (gray-200)

### Text Colors
- **Text Primary**: #111827 (gray-900) - headings, important content
- **Text Secondary**: #6B7280 (gray-500) - body text, descriptions
- **Text Muted**: #9CA3AF (gray-400) - metadata, placeholders

### Status Colors
- **Success**: #10B981 (green-500)
- **Warning**: #F59E0B (yellow-500)
- **Error**: #EF4444 (red-500)
- **Info**: #3B82F6 (blue-500)

### Accent Colors
- **Purple (AI Features)**: #8B5CF6 - AI-powered features, smart suggestions

---

## Typography

**Font Family**: Inter, system-ui, sans-serif

### Type Scale
```
H1:       36px, font-weight: 600, line-height: 1.2
H2:       30px, font-weight: 600, line-height: 1.3
H3:       24px, font-weight: 600, line-height: 1.4
Body:     16px, font-weight: 400, line-height: 1.5
Small:    14px, font-weight: 400, line-height: 1.5
Caption:  12px, font-weight: 400, line-height: 1.4
```

### Usage
- **Headings**: Gray-900, semibold (600)
- **Body Text**: Gray-500, regular (400)
- **Labels**: Gray-500, 12px, uppercase for badges
- **Data/Numbers**: Gray-900, tabular-nums for alignment

---

## Layout & Spacing

### Structure
- **Top Navigation**: 64px height, white background, border-bottom gray-200
- **Left Sidebar**: 320px width, white background, border-right gray-200
- **Content Area**: Flexible, gray-50 background
- **Max Content Width**: 1280px for main content areas

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Grid
- Dashboard: 12-column grid
- Card gaps: 24px
- Section spacing: 32px

---

## Components

### Buttons

**Primary Button**:
- Background: #2563EB (blue-600)
- Text: #FFFFFF (white)
- Border Radius: 6px
- Padding: 10px 16px
- Font: 14px, weight 500
- No shadows
- Hover: #1D4ED8 (blue-700)

**Secondary Button**:
- Background: #FFFFFF (white)
- Border: 1px solid #E5E7EB (gray-200)
- Text: #374151 (gray-700)
- Border Radius: 6px
- Hover: #F9FAFB (gray-50) background

**Ghost Button**:
- Background: transparent
- Text: #6B7280 (gray-500)
- Hover: #F9FAFB (gray-50) background

**Icon Button**:
- Size: 36px x 36px
- Border Radius: 6px
- Icon: 20px

### Cards

- Background: #FFFFFF (white)
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 8px
- Padding: 24px
- No shadows (flat design)

**Card Header**:
- Title: 16px, font-weight 600, gray-900
- Actions: Right-aligned, ghost buttons

### Badges

- Shape: Pill (border-radius: 12px)
- Font: 12px, uppercase, font-weight 500
- Padding: 4px 12px

**Badge Variants**:
- Default: Gray-100 bg, Gray-700 text
- Success: Green-100 bg, Green-700 text
- Warning: Yellow-100 bg, Yellow-700 text
- Error: Red-100 bg, Red-700 text
- Info: Blue-100 bg, Blue-700 text
- Purple: Purple-100 bg, Purple-700 text

### Data Tables

**Header Row**:
- Background: #F9FAFB (gray-50)
- Text: 12px, uppercase, gray-500, font-weight 500
- Padding: 12px 16px

**Data Rows**:
- Background: #FFFFFF (white)
- Border-bottom: 1px solid #E5E7EB
- Padding: 16px
- Hover: #F9FAFB (gray-50) background

**Features**:
- Checkbox column for multi-select
- Sortable column headers
- Action menu (3-dot) per row
- Pagination at bottom

### Forms & Inputs

**Text Input**:
- Height: 40px
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 6px
- Padding: 8px 12px
- Focus: Blue-500 ring (2px)
- Background: #FFFFFF

**Labels**:
- Font: 14px, font-weight 500, gray-700
- Margin-bottom: 6px

**Helper Text**:
- Font: 12px, gray-500
- Margin-top: 4px

### Navigation

**Top Navigation** (64px height):
- Background: #FFFFFF
- Border-bottom: 1px solid #E5E7EB
- Logo: Left-aligned
- Search: Center (optional)
- Actions/Profile: Right-aligned

**Left Sidebar** (320px width):
- Background: #FFFFFF
- Border-right: 1px solid #E5E7EB
- Nav items: 40px height, 16px padding
- Active item: Blue-50 background, Blue-600 text, Blue-600 left border (3px)
- Hover: Gray-50 background
- Icons: 20px, gray-500 (active: blue-600)
- Collapsible groups with chevron

### Modals

- Background: #FFFFFF
- Border Radius: 8px
- Overlay: Black, 50% opacity
- Max-width: 480px (small), 640px (medium), 960px (large)
- Padding: 24px
- Header: Border-bottom, title + close button
- Footer: Border-top, actions right-aligned

### Tooltips

- Background: #111827 (gray-900)
- Text: #FFFFFF, 12px
- Border Radius: 4px
- Padding: 6px 10px
- Max-width: 200px

---

## Data Visualization

**Chart Colors**:
- Primary: #3B82F6 (blue-500)
- Secondary: #8B5CF6 (purple-500)
- Tertiary: #10B981 (green-500)
- Quaternary: #F59E0B (yellow-500)

**Chart Styling**:
- Grid lines: #E5E7EB (gray-200)
- Axis labels: #6B7280 (gray-500), 12px
- Tooltips: White background, gray-200 border
- Legend: Below chart, horizontal layout

---

## Icons

**Library**: Lucide React (recommended)

**Sizes**:
- Small: 16px
- Default: 20px
- Large: 24px

**Colors**:
- Default: #6B7280 (gray-500)
- Active: #3B82F6 (blue-500)
- Muted: #9CA3AF (gray-400)

---

## Accessibility

- Focus rings: 2px, blue-500, offset-2
- Minimum touch targets: 44px x 44px
- Color contrast: WCAG AA compliant
- Keyboard navigation: Full support
- Screen reader labels: All interactive elements

---

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

**Mobile Adaptations**:
- Sidebar: Collapsible drawer
- Tables: Horizontal scroll or card view
- Navigation: Bottom tab bar option

---

## Animation & Transitions

- **Duration**: 150ms (fast), 200ms (normal), 300ms (slow)
- **Easing**: ease-out for most transitions
- **Hover states**: 150ms
- **Modal open/close**: 200ms
- **Page transitions**: 200ms fade

---

## Implementation Notes

- Use Tailwind CSS utility classes
- Leverage shadcn/ui components
- Maintain consistent spacing with the 8px grid
- All interactive elements need hover and focus states
- Use semantic HTML for accessibility
- Icons should have aria-labels when used alone
