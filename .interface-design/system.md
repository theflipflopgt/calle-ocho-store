# TheFlipFlop Admin - Design System

## Direction
Sneaker e-commerce admin panel. Clean, functional, utility-focused. The admin serves store managers who need to quickly scan inventory, process orders, and manage product catalogs. Feels like a well-organized stockroom — structured, efficient, no visual clutter.

## Framework
- Next.js + Tailwind CSS v3.4
- shadcn/ui components (Button, Input, Label, etc.)
- Lucide icons

## Depth Strategy
**Borders-only** — `border border-gray-200` on white cards. No shadows. Clean and technical.

## Spacing
- Base unit: 4px (Tailwind scale)
- Page sections: `space-y-6`
- Grid gaps: `gap-4` (stats), `gap-6` (major sections)
- Card padding: `p-4` (compact), `p-6` (spacious)
- Table cells: `px-6 py-3` (headers), `px-6 py-4` (body)

## Colors
- **Brand**: `brand-black` (#1a1a1a), `brand-blue` (#2563eb)
- **Surfaces**: `bg-white` cards on `bg-gray-50` background
- **Borders**: `border-gray-200` (cards), `border-gray-100` (dividers)
- **Status badges**: Soft colored backgrounds
  - Active/Success: `bg-green-100 text-green-800`
  - Warning/Pending: `bg-yellow-100 text-yellow-800`
  - Info/Paid: `bg-blue-100 text-blue-800`
  - Processing: `bg-purple-100 text-purple-800`
  - Shipped: `bg-indigo-100 text-indigo-800`
  - Error/Cancelled: `bg-red-100 text-red-800`
  - Inactive/Default: `bg-gray-100 text-gray-600`
  - Admin role: `bg-purple-100 text-purple-800`

## Typography
- Page title: `text-2xl font-bold text-brand-black`
- Page subtitle: `text-gray-600 mt-1`
- Section title: `font-semibold text-brand-black`
- Table header: `text-xs font-medium text-gray-500 uppercase tracking-wider`
- Body text / descriptions: `text-sm text-gray-600`
- Helper text (small): `text-xs text-gray-500`
- Labels (form): `text-sm font-medium text-gray-700` (via Label component)
- Code/SKU: `text-sm bg-gray-100 px-2 py-1 rounded`

## Contrast Rules
- **Never** use `text-gray-300` for any visible text or icons
- **Never** use `text-gray-400` for body text — only for disabled states
- Empty state icons: `text-gray-400` minimum
- Search icons: `text-gray-500`
- Placeholders (input): `placeholder:text-gray-500`
- Form borders: `border-gray-300` (not gray-200)
- Body descriptions/emails: `text-gray-600` minimum
- Small helper text below inputs: `text-xs text-gray-500` is acceptable

## Border Radius
- Cards: `rounded-xl`
- Buttons/inputs: `rounded-lg`
- Badges: `rounded-full`
- Icons: `rounded-lg`

## Component Patterns

### Stat Cards
```
bg-white rounded-xl border border-gray-200 p-4
  flex items-center gap-3
    w-10 h-10 bg-{color}-100 rounded-lg (icon container)
      h-5 w-5 text-{color}-600 (icon)
    text-2xl font-bold text-brand-black (value)
    text-sm text-gray-600 (label)
```

### Status Badges
```
inline-flex px-2 py-1 text-xs font-medium rounded-full
```
No icons inside badges. Plain text only.

### Empty States
```
Icon: h-8 w-8 mx-auto mb-2 text-gray-400
Text: text-gray-600, wrapped in <p>
Links: text-brand-blue hover:underline
```
Always include a contextual icon above the message.

### Filter Section
```
bg-white rounded-xl border border-gray-200 p-4
  form flex flex-wrap gap-4
    Search input: pl-10 with absolute Search icon
    Select: px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue
    Filter button: variant="outline"
```

### Tables (Desktop)
```
bg-white rounded-xl border border-gray-200 overflow-hidden
  thead: bg-gray-50 border-b border-gray-200
  tbody: divide-y divide-gray-100
  rows: hover:bg-gray-50
```

### Mobile Cards
```
bg-white rounded-xl border border-gray-200 p-4
  Footer: mt-4 pt-4 border-t border-gray-100
```
Clickable cards (links) get `active:bg-gray-50`.

### Page Header (with action)
```
flex flex-col sm:flex-row sm:items-center justify-between gap-4
  Title section on left
  Action button on right: bg-brand-blue hover:bg-brand-blue/90
```

### Info/Tips Box
```
bg-blue-50 border border-blue-200 rounded-lg p-4
  h3: font-medium text-brand-black mb-2
  ul: text-sm text-gray-600 space-y-1
```
