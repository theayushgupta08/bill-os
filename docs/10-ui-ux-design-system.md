# Chapter 10 — UI/UX Design System

> Back to [Index](./README.md) | Prev ← [API Documentation](./09-api-documentation.md) | Next → [Security](./11-security.md)

---

## 10.1 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Clarity First** | Indian SMB users may not be tech-savvy. Every screen must be self-explanatory. |
| **Dense but Not Cluttered** | Business users need data density — show key info without overwhelming. |
| **Action-Oriented** | Primary actions always visible. Reduce clicks to complete common tasks. |
| **Consistent** | Every table, form, modal, and status badge follows the same patterns. |
| **Responsive** | Fully usable on 360px mobile through 4K desktop. |
| **Accessible** | WCAG 2.1 AA minimum. Keyboard navigable. Screen reader friendly. |

---

## 10.2 Color System

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `hsl(222, 89%, 55%)` | `hsl(222, 89%, 65%)` | Primary actions, links, focus rings |
| `--primary-foreground` | `hsl(0, 0%, 100%)` | `hsl(0, 0%, 100%)` | Text on primary |
| `--primary-50` | `hsl(222, 89%, 97%)` | `hsl(222, 30%, 15%)` | Primary tint backgrounds |
| `--primary-100` | `hsl(222, 89%, 93%)` | `hsl(222, 30%, 20%)` | Primary hover backgrounds |
| `--primary-600` | `hsl(222, 89%, 48%)` | `hsl(222, 89%, 60%)` | Primary hover state |
| `--primary-700` | `hsl(222, 89%, 40%)` | `hsl(222, 89%, 55%)` | Primary active state |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--success` | `hsl(142, 71%, 45%)` | `hsl(142, 71%, 55%)` | Paid, active, positive |
| `--warning` | `hsl(38, 92%, 50%)` | `hsl(38, 92%, 55%)` | Pending, partially paid |
| `--destructive` | `hsl(0, 84%, 60%)` | `hsl(0, 84%, 65%)` | Delete, overdue, errors |
| `--info` | `hsl(199, 89%, 48%)` | `hsl(199, 89%, 58%)` | Informational notices |

### Neutral Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `hsl(0, 0%, 100%)` | `hsl(224, 30%, 8%)` | Page background |
| `--foreground` | `hsl(224, 30%, 10%)` | `hsl(0, 0%, 95%)` | Primary text |
| `--card` | `hsl(0, 0%, 100%)` | `hsl(224, 25%, 12%)` | Card backgrounds |
| `--card-foreground` | `hsl(224, 30%, 10%)` | `hsl(0, 0%, 95%)` | Card text |
| `--muted` | `hsl(220, 14%, 96%)` | `hsl(224, 20%, 16%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(220, 9%, 46%)` | `hsl(220, 9%, 60%)` | Secondary text |
| `--border` | `hsl(220, 13%, 91%)` | `hsl(224, 15%, 22%)` | Borders, dividers |
| `--input` | `hsl(220, 13%, 91%)` | `hsl(224, 15%, 22%)` | Input borders |
| `--ring` | `hsl(222, 89%, 55%)` | `hsl(222, 89%, 65%)` | Focus ring |
| `--sidebar` | `hsl(220, 14%, 97%)` | `hsl(224, 30%, 6%)` | Sidebar background |

### Status Colors (for badges/pills)

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Active / Paid | `bg-emerald-50` | `text-emerald-700` | ✅ Good states |
| Draft | `bg-slate-100` | `text-slate-600` | Neutral/pending creation |
| Pending / Sent | `bg-amber-50` | `text-amber-700` | Awaiting action |
| Partially Paid | `bg-blue-50` | `text-blue-700` | In progress |
| Overdue | `bg-red-50` | `text-red-700` | ⚠️ Needs attention |
| Cancelled / Void | `bg-gray-100` | `text-gray-500` | Inactive/terminated |

---

## 10.3 Typography

### Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

**Google Fonts import:**
```
Inter: 400, 500, 600, 700
JetBrains Mono: 400, 500 (for code/numbers)
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 30px / 1.875rem | 700 Bold | 1.2 | Page titles |
| `h2` | 24px / 1.5rem | 600 Semibold | 1.3 | Section headings |
| `h3` | 20px / 1.25rem | 600 Semibold | 1.4 | Card titles |
| `h4` | 16px / 1rem | 600 Semibold | 1.4 | Sub-section titles |
| `body` | 14px / 0.875rem | 400 Regular | 1.5 | Default body text |
| `body-sm` | 13px / 0.8125rem | 400 Regular | 1.5 | Dense table cells |
| `caption` | 12px / 0.75rem | 400 Regular | 1.4 | Labels, helper text |
| `overline` | 11px / 0.6875rem | 600 Semibold | 1.6 | Section labels (uppercase) |
| `mono` | 14px / 0.875rem | 500 Medium | 1.5 | Amounts, codes, IDs |

### Amount Display

```
Font: JetBrains Mono (tabular nums)
Format: ₹12,34,567.89 (Indian number system)
Positive: text-foreground
Negative: text-destructive
Zero: text-muted-foreground
```

---

## 10.4 Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | No spacing |
| `space-1` | 4px | Tight inline spacing |
| `space-2` | 8px | Icon gaps, badge padding |
| `space-3` | 12px | Small card padding |
| `space-4` | 16px | Standard padding, form gap |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Card padding, between sections |
| `space-8` | 32px | Large sections |
| `space-10` | 40px | Page padding (desktop) |
| `space-12` | 48px | Major section breaks |
| `space-16` | 64px | Page-level spacing |

---

## 10.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small elements (badges, chips) |
| `radius-md` | 6px | Buttons, inputs |
| `radius-lg` | 8px | Cards, dropdowns |
| `radius-xl` | 12px | Modals, sheets |
| `radius-2xl` | 16px | Large containers |
| `radius-full` | 9999px | Avatars, pills |

---

## 10.6 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Inputs, small elements |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.12)` | Command palette, sheets |

---

## 10.7 Icons

**Library:** Lucide React (consistent with shadcn/ui)

| Category | Icons |
|----------|-------|
| Navigation | `LayoutDashboard`, `Users`, `Package`, `ShoppingCart`, `FileText`, `CreditCard`, `BarChart3`, `Settings`, `Shield` |
| Actions | `Plus`, `Pencil`, `Trash2`, `Download`, `Upload`, `Send`, `Printer`, `Copy`, `Search`, `Filter`, `MoreVertical` |
| Status | `CheckCircle2`, `Clock`, `AlertCircle`, `XCircle`, `AlertTriangle`, `Info` |
| Finance | `IndianRupee`, `ArrowUpRight`, `ArrowDownRight`, `TrendingUp`, `TrendingDown`, `Wallet` |
| AI (P3) | `Sparkles`, `Bot`, `MessageSquare`, `ScanLine`, `Brain` |

**Icon Sizing:**

| Context | Size | Usage |
|---------|------|-------|
| Inline | 16px | Within text, buttons |
| Button | 18px | Icon + label buttons |
| Navigation | 20px | Sidebar items |
| Empty state | 48px | Empty state illustrations |
| Feature icon | 24px | Card feature icons |

---

## 10.8 Dark Mode

| Strategy | Detail |
|----------|--------|
| **Implementation** | `next-themes` with system preference detection |
| **Storage** | `localStorage` key: `billos-theme` |
| **Options** | Light, Dark, System |
| **CSS** | All colors via CSS custom properties; `.dark` class on `<html>` |
| **Transitions** | `transition: color 150ms, background-color 150ms` on theme switch |
| **Charts** | Recharts adapts via CSS variables |
| **Images** | Logo has light and dark variants |

---

## 10.9 Responsive Breakpoints

| Breakpoint | Width | Tailwind | Layout |
|-----------|-------|----------|--------|
| Mobile | 0–639px | (default) | Single column, bottom nav |
| Tablet | 640–1023px | `sm:` / `md:` | Collapsible sidebar, 2-col where useful |
| Desktop | 1024–1279px | `lg:` | Sidebar visible, full layout |
| Wide | 1280px+ | `xl:` / `2xl:` | Wider content area, data tables expand |

### Sidebar Behavior

| Screen | Sidebar State |
|--------|--------------|
| Mobile (< 1024px) | Hidden, toggle via hamburger → Sheet overlay |
| Desktop (≥ 1024px) | Visible, collapsible to icon-only (60px) |
| Collapsed state | Icons only + tooltip on hover |
| Expanded state | Icon + label (240px wide) |

---

## 10.10 Accessibility

| Requirement | Implementation |
|------------|---------------|
| **Keyboard Navigation** | All interactive elements focusable, logical tab order |
| **Focus Indicators** | Visible `--ring` color, 2px offset |
| **Screen Readers** | `aria-label` on icon buttons, `role` on custom widgets |
| **Color Contrast** | WCAG AA minimum (4.5:1 normal text, 3:1 large text) |
| **Form Labels** | Every input has associated `<label>` |
| **Error Messages** | Connected to inputs via `aria-describedby` |
| **Skip to Content** | Skip link for keyboard users |
| **Reduced Motion** | Respect `prefers-reduced-motion` media query |
| **ARIA Live Regions** | Toast notifications use `aria-live="polite"` |
| **Table Headers** | Data tables use proper `<th>` with `scope` attributes |

---

## 10.11 Component Patterns

### Data Table Pattern

```
┌──────────────────────────────────────────────────────┐
│  Page Header: "Customers"          [+ New Customer]  │
├──────────────────────────────────────────────────────┤
│  [Search: ________________]  [Status ▼]  [Export ▼]  │
├──────────────────────────────────────────────────────┤
│  □  Code      Name            Phone       Outstanding│
│  ─────────────────────────────────────────────────── │
│  □  CUST-001  Priya Elec.    98765xxxxx   ₹45,000   │
│  □  CUST-002  Raj Traders    98765xxxxx   ₹12,000   │
│  □  CUST-003  SK Stores      98765xxxxx        ₹0   │
│  ...                                                 │
├──────────────────────────────────────────────────────┤
│  Showing 1-20 of 156            [< 1 2 3 ... 8 >]   │
└──────────────────────────────────────────────────────┘
```

### Form Pattern

```
┌──────────────────────────────────────────────────────┐
│  ← Back    Create Customer                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Basic Information                                   │
│  ┌─────────────────────┐ ┌─────────────────────────┐ │
│  │ Display Name *      │ │ Customer Type *         │ │
│  │ [________________]  │ │ [Business         ▼]    │ │
│  └─────────────────────┘ └─────────────────────────┘ │
│  ┌─────────────────────┐ ┌─────────────────────────┐ │
│  │ GSTIN               │ │ PAN                     │ │
│  │ [________________]  │ │ [________________]      │ │
│  └─────────────────────┘ └─────────────────────────┘ │
│                                                      │
│  ──────── Contact ────────                           │
│  ┌─────────────────────┐ ┌─────────────────────────┐ │
│  │ Phone *             │ │ Email                   │ │
│  │ [________________]  │ │ [________________]      │ │
│  └─────────────────────┘ └─────────────────────────┘ │
│                                                      │
│  ──────── Financial ────────                         │
│  ┌─────────────────────┐ ┌─────────────────────────┐ │
│  │ Credit Limit (₹)    │ │ Payment Terms (days)    │ │
│  │ [________________]  │ │ [30_____________]       │ │
│  └─────────────────────┘ └─────────────────────────┘ │
│                                                      │
│                    [Cancel]  [Save Customer]         │
└──────────────────────────────────────────────────────┘
```

### Dashboard Card Pattern

```
┌─────────────────────────┐
│  Revenue                │
│  ┌───────────────────┐  │
│  │ ₹4,50,000        │  │
│  │ ↑ 18.4% vs last  │  │
│  │   month           │  │
│  └───────────────────┘  │
│  ▁▂▃▅▆▇█▆▅▃▂▁▂▃▅       │
│  (sparkline)            │
└─────────────────────────┘
```

---

## 10.12 Animation & Motion

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Fade in | 150ms | ease-out | Modals, popovers appearing |
| Fade out | 100ms | ease-in | Modals closing |
| Slide in | 200ms | ease-out | Sidebar, sheets |
| Scale in | 150ms | ease-out | Dropdown menus |
| Skeleton pulse | 1.5s | ease-in-out (infinite) | Loading states |
| Toast slide | 300ms | spring | Toast notifications |
| Number count-up | 500ms | ease-out | Dashboard KPI cards |
| Page transition | 200ms | ease-in-out | Route changes |

---

> **Next:** [Chapter 11 — Security](./11-security.md)
