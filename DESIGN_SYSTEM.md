# Design System

Apple-inspired light-mode design system. Strictly light-only (dark mode overrides exist in `globals.css` to prevent system-level dark activation).

---

## Color Tokens (`globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f5f5f7` | Page canvas (parchment) |
| `--foreground` | `#1d1d1f` | Primary text (ink) |
| `--card` | `#ffffff` | Card surfaces |
| `--primary` | `#0066cc` | Action blue — buttons, links, active states |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--muted-foreground` | `#6e6e73` | Secondary text, labels, placeholders |
| `--destructive` | `#ff3b30` | Errors, destructive actions |
| `--border` | `rgba(0,0,0,0.08)` | Borders, dividers |
| `--chart-1` | `#0066cc` | Blue |
| `--chart-2` | `#34c759` | Green |
| `--chart-3` | `#ff9500` | Orange |
| `--chart-4` | `#ff3b30` | Red |
| `--chart-5` | `#af52de` | Purple |

Do NOT use raw hex colors in components. Use `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `text-primary`, `border-border`, etc.

For values not covered by tokens, use the specific hex inline (e.g. `text-[#0066cc]`).

---

## Typography

Font stack (set in `@theme inline` in `globals.css`):
- `--font-sans`: SF Pro Text / -apple-system (body, UI)
- `--font-display`: SF Pro Display (headings h1/h2/h3)
- `--font-mono`: SF Mono / ui-monospace (code, IDs, API keys)

Apply via Tailwind classes: `font-sans`, `font-mono`

### Text Size Scale Used in Components
| Class | Size | Usage |
|-------|------|-------|
| `text-[11px]` | 11px | Section labels (uppercase), captions |
| `text-[12px]` | 12px | Sub-labels, timestamps |
| `text-[13px]` | 13px | Body text, form inputs, table cells |
| `text-[14px]` | 14px | Slightly emphasized body |
| `text-[15px]` | 15px | Sidebar item labels |
| `text-[17px]` | 17px | Header page title |
| `text-2xl` | 24px | Auth page headings |

---

## Spacing & Layout

- Page content: `px-4 lg:px-6 py-5 max-w-screen-xl mx-auto`
- Card padding: `p-5` or `p-6`
- Section gaps: `gap-4` or `gap-6`
- Row gaps inside cards: `space-y-3` or `space-y-4`

---

## Border Radius Scale

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Small buttons, badges, chips |
| `rounded-xl` | 12px | Input fields, small cards |
| `rounded-2xl` | 16px | Main cards, panels |
| `rounded-full` | 9999px | Avatars, pills, tags |

---

## Shared CSS Utilities (in `globals.css`)

### `.hairline`
Apple-style 1px border: `border: 1px solid rgba(0,0,0,0.08)`  
Used on cards instead of `border border-border` for exact visual parity.

### `.frosted`
Frosted glass surface: `background: rgba(255,255,255,0.8); backdrop-filter: blur(20px)`  
Used on the sticky header.

### `.page-section`
Standard content card: white bg, `rounded-2xl`, hairline border, `p-5 px-6`  
Use as a wrapping `<section>` for content blocks.

### `.section-label`
11px uppercase semibold label in `#6e6e73`. Use above content groups.

### `.empty-state`
Centered flex column for empty/loading states. Use inside table `<tbody>` or list containers.

### Action button/link helpers
- `.action-link-blue` — pill-shaped blue text link
- `.action-link-gray` — pill-shaped gray text link
- `.action-btn-blue` — pill-shaped filled blue button
- `.action-btn-green` — pill-shaped filled green button (WhatsApp)

---

## Component Patterns

### Stat Card
```tsx
<div className="bg-white rounded-2xl p-5 hairline">
  <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 flex items-center justify-center mb-4">
    <Icon className="w-5 h-5 text-[#0066cc]" />
  </div>
  <p className="text-[24px] font-semibold text-[#1d1d1f]">{value}</p>
  <p className="text-[13px] text-[#6e6e73] mt-1">{label}</p>
</div>
```

### Table
```tsx
<div className="bg-white rounded-2xl hairline overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-black/[0.06]">
        <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-black/[0.04] hover:bg-[#f5f5f7]/50 transition-colors cursor-pointer">
        <td className="px-4 py-3 text-[13px] text-[#1d1d1f]">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Input Field
```tsx
<input
  className="h-11 rounded-xl border border-[rgba(0,0,0,0.12)] px-3.5 text-[13px] text-[#1d1d1f] bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
/>
```

### Primary Button
```tsx
<button className="h-11 bg-[#0066cc] text-white text-[14px] font-medium rounded-xl hover:bg-[#0055b3] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
  Action
</button>
```

### Status Badge
```tsx
// Completed / success
<span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#34c759]/10 text-[#1a7a32]">
  Completed
</span>

// Failed / error
<span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ff3b30]/10 text-[#cc0000]">
  Failed
</span>

// Pending / neutral
<span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ff9500]/10 text-[#995900]">
  Pending
</span>
```

### Loading Spinner
```tsx
<Loader2 className="w-4 h-4 animate-spin text-[#6e6e73]" />
```

---

## Icon Library

Lucide React (`lucide-react` v1.16). Import named icons:
```tsx
import { PhoneCall, ShoppingBag, MessageCircle, Wallet } from "lucide-react"
```

Standard sizes: `w-4 h-4` (16px), `w-5 h-5` (20px), `w-6 h-6` (24px)

---

## Sidebar & Header

- Sidebar: `w-64`, white bg, fixed on desktop, drawer on mobile (controlled by `mobileOpen` prop)
- Active nav item: `bg-[#0066cc]/10 text-[#0066cc]`
- Inactive nav item: `text-[#1d1d1f] hover:bg-[#f5f5f7]`
- Header: `h-14`, frosted glass, sticky, `z-30`

---

## Animation

`tw-animate-css` is installed. Use `animate-spin` (Tailwind built-in) for spinners.  
Micro-interaction: `active:scale-[0.97]` on buttons (also set globally in `globals.css` via `button:active { transform: scale(0.97) }`).
