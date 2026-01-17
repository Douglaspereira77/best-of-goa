# Navigation Structure Documentation

**Date:** January 2025  
**Status:** âœ… Implemented  
**Version:** 1.0

---

## Overview

The navigation structure provides a unified header, footer, and breadcrumb system across all public pages of Best of Goa. The system is designed to be responsive, accessible, and SEO-friendly.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Components](#components)
3. [Navigation Structure](#navigation-structure)
4. [Breadcrumbs](#breadcrumbs)
5. [Implementation Details](#implementation-details)
6. [Usage Guide](#usage-guide)
7. [Customization](#customization)

---

## Architecture

### Layout System

The navigation system uses a layered approach:

```
Root Layout (src/app/layout.tsx)
  â””â”€â”€ PublicLayout (src/components/layout/PublicLayout.tsx)
      â”œâ”€â”€ PublicHeader (sticky, always visible)
      â”œâ”€â”€ Main Content (page-specific)
      â””â”€â”€ PublicFooter (comprehensive links)
```

### Route Exclusion

The `PublicLayout` component automatically excludes admin routes (`/admin/*`) from showing the public header and footer, allowing the admin section to maintain its own sidebar navigation.

---

## Components

### PublicHeader

**Location:** `src/components/layout/PublicHeader.tsx`

**Features:**
- Sticky header (always visible at top when scrolling)
- Logo linking to homepage
- Desktop navigation with all 6 main sections
- Search bar (always visible on desktop)
- "Submit Business" and "Sign In" buttons
- Mobile hamburger menu using Sheet component
- Active route highlighting

**Navigation Items:**
1. Places to Eat â†’ `/places-to-eat`
2. Places to Stay â†’ `/places-to-stay`
3. Places to Shop â†’ `/places-to-shop`
4. Places to Visit â†’ `/places-to-visit`
5. Places to Learn â†’ `/places-to-learn`
6. Things to Do â†’ `/things-to-do`

**Responsive Behavior:**
- Desktop (lg+): Full navigation menu with search bar
- Tablet (md): Search bar visible, navigation in hamburger menu
- Mobile: All navigation in hamburger menu

### PublicFooter

**Location:** `src/components/layout/PublicFooter.tsx`

**Sections:**
1. **Brand Section**
   - Logo
   - Description
   - Social media links (Instagram, Facebook, Twitter, LinkedIn)

2. **Quick Links**
   - About Us
   - Submit Business
   - Contact
   - Blog

3. **Categories**
   - All 6 main sections with links

4. **Newsletter & Legal**
   - Newsletter signup form
   - Privacy Policy
   - Terms of Service
   - Cookie Policy

**Layout:**
- Responsive grid: 1 column (mobile) â†’ 2 columns (tablet) â†’ 4 columns (desktop)
- Dark theme (slate-900 background)
- White text with hover effects

### Breadcrumbs

**Location:** `src/components/layout/Breadcrumbs.tsx`

**Features:**
- Reusable breadcrumb component using shadcn/ui
- Accepts array of breadcrumb items
- Auto-generates from pathname (optional helper function)
- Supports custom styling via className prop
- Generates Schema.org BreadcrumbList markup (when used with schema generators)

**Interface:**
```typescript
interface BreadcrumbItemData {
  label: string;
  href?: string; // Optional - if not provided, renders as current page
}
```

### PublicLayout

**Location:** `src/components/layout/PublicLayout.tsx`

**Purpose:**
- Wrapper component that conditionally renders header/footer
- Excludes admin routes automatically
- Client component (uses `usePathname()` hook)

**Logic:**
```typescript
const pathname = usePathname();
const isAdminRoute = pathname?.startsWith('/admin');

if (isAdminRoute) {
  return <>{children}</>; // No header/footer for admin
}

return (
  <>
    <PublicHeader />
    <main>{children}</main>
    <PublicFooter />
  </>
);
```

---

## Navigation Structure

### Main Navigation Items

All navigation items are defined in `PublicHeader.tsx`:

```typescript
const navigationItems = [
  { label: 'Places to Eat', href: '/places-to-eat' },
  { label: 'Places to Stay', href: '/places-to-stay' },
  { label: 'Places to Shop', href: '/places-to-shop' },
  { label: 'Places to Visit', href: '/places-to-visit' },
  { label: 'Places to Learn', href: '/places-to-learn' },
  { label: 'Things to Do', href: '/things-to-do' },
];
```

### Active Route Highlighting

The header automatically highlights the active route by checking if the current pathname starts with the navigation item's href:

```typescript
const isActive = (href: string) => {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(href);
};
```

---

## Breadcrumbs

### Breadcrumb Patterns

The breadcrumb system follows consistent patterns across different page types:

#### Homepage
```
Home
```

#### Hub Pages
```
Home â†’ [Section Name]
```
Examples:
- `Home â†’ Places to Eat`
- `Home â†’ Places to Stay`
- `Home â†’ Places to Visit`

#### Category Pages
```
Home â†’ [Section] â†’ [Category]
```
Examples:
- `Home â†’ Places to Eat â†’ Italian`
- `Home â†’ Places to Visit â†’ Cultural`

#### Detail Pages
```
Home â†’ [Section] â†’ [Subsection] â†’ [Item Name]
```
Examples:
- `Home â†’ Places to Eat â†’ Restaurants â†’ Restaurant Name`
- `Home â†’ Places to Eat â†’ Dishes â†’ Sushi`
- `Home â†’ Places to Shop â†’ Malls â†’ Mall Name`

### Implementation Examples

#### Hub Page
```tsx
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Places to Eat' }
]} />
```

#### Category Page
```tsx
<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Places to Visit', href: '/places-to-visit' },
  { label: categoryName }
]} />
```

#### Detail Page
```tsx
<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Places to Shop', href: '/places-to-shop' },
  { label: mall.name }
]} />
```

### Custom Styling

Breadcrumbs support custom styling via className prop, useful for hero sections with dark backgrounds:

```tsx
<Breadcrumbs
  items={breadcrumbItems}
  className="text-gray-300 [&_a]:text-gray-300 [&_a:hover]:text-white [&_span]:text-white"
/>
```

### Auto-Generation Helper

The `generateBreadcrumbsFromPath()` helper function can auto-generate breadcrumbs from the pathname:

```tsx
import { generateBreadcrumbsFromPath } from '@/components/layout/Breadcrumbs';
import { usePathname } from 'next/navigation';

const pathname = usePathname();
const breadcrumbs = generateBreadcrumbsFromPath(pathname);
```

**Note:** This helper provides basic breadcrumbs. For more complex pages, manually define breadcrumb items for better control.

---

## Implementation Details

### File Structure

```
src/
â”œâ”€â”€ components/
â”‚   â””â”€â”€ layout/
â”‚       â”œâ”€â”€ PublicHeader.tsx       # Main header component
â”‚       â”œâ”€â”€ PublicFooter.tsx        # Main footer component
â”‚       â”œâ”€â”€ Breadcrumbs.tsx         # Breadcrumb component
â”‚       â””â”€â”€ PublicLayout.tsx        # Layout wrapper
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ layout.tsx                  # Root layout (uses PublicLayout)
â”‚   â””â”€â”€ [public pages]              # All public pages
```

### Integration with Root Layout

The root layout (`src/app/layout.tsx`) wraps all pages with `PublicLayout`:

```tsx
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PublicLayout>{children}</PublicLayout>
      </body>
    </html>
  );
}
```

### Pages Updated

All public pages have been updated to:
- Remove inline headers/footers
- Add breadcrumbs where appropriate

**Pages with breadcrumbs:**
- Homepage (`/`)
- All hub pages (`/places-to-eat`, `/places-to-stay`, etc.)
- Category pages (`/places-to-visit?category=...`)
- Detail pages (malls, dishes, etc.)

---

## Usage Guide

### Adding Breadcrumbs to a New Page

1. Import the Breadcrumbs component:
```tsx
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
```

2. Add breadcrumbs at the top of your page content:
```tsx
<div className="container mx-auto px-4 pt-6">
  <Breadcrumbs items={[
    { label: 'Home', href: '/' },
    { label: 'Your Section', href: '/your-section' },
    { label: 'Current Page' }
  ]} />
</div>
```

### Modifying Navigation Items

To add or modify navigation items, edit `src/components/layout/PublicHeader.tsx`:

```typescript
const navigationItems = [
  // Add your new item here
  { label: 'New Section', href: '/new-section' },
];
```

### Updating Footer Links

Edit `src/components/layout/PublicFooter.tsx` to modify footer sections and links.

---

## Customization

### Header Styling

The header uses Tailwind classes. Key classes:
- `sticky top-0 z-50` - Makes header sticky
- `bg-white/80 backdrop-blur-sm` - Semi-transparent with blur effect
- `border-b` - Bottom border

### Footer Styling

Footer uses dark theme:
- `bg-slate-900` - Dark background
- `text-white` - White text
- `text-slate-400` - Muted text for links

### Mobile Menu

The mobile menu uses shadcn/ui's Sheet component. Customize in `PublicHeader.tsx`:
- Change `side` prop to `"left"` or `"right"` for menu position
- Modify `w-[300px] sm:w-[400px]` for menu width

### Search Bar

The search bar is the existing `SearchBar` component. It's integrated into the header and automatically adapts to the current page context.

---

## SEO Considerations

### Schema.org Breadcrumbs

Breadcrumbs work with existing Schema.org generators in `src/lib/schema/generators/breadcrumb.ts`:

- `generateRestaurantBreadcrumbSchema()`
- `generateHotelBreadcrumbSchema()`
- `generateDishTypeBreadcrumbSchema()`
- And more...

These generators create structured data that search engines use to display breadcrumbs in search results.

### Site Navigation Schema

Consider adding SiteNavigationElement schema to the header for enhanced SEO. This can be added to the root layout or header component.

---

## Accessibility

### ARIA Labels

- Navigation menu has proper ARIA labels
- Mobile menu button has `aria-label="Open menu"`
- Breadcrumbs use semantic `<nav>` element with `aria-label="breadcrumb"`

### Keyboard Navigation

- All navigation links are keyboard accessible
- Mobile menu supports keyboard navigation
- Focus management handled by shadcn/ui components

### Screen Readers

- Breadcrumbs use semantic HTML (`<nav>`, `<ol>`, `<li>`)
- Current page marked with `aria-current="page"`
- Proper heading hierarchy maintained

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes

---

## Future Enhancements

Potential improvements:

1. **Dropdown Menus**: Add dropdown submenus for each main section
2. **Mega Menu**: Large dropdown menus with category previews
3. **Search Enhancement**: Global search with category filters
4. **User Menu**: User account dropdown when logged in
5. **Language Switcher**: Multi-language support
6. **Theme Toggle**: Dark/light mode switcher

---

## Related Documentation

- **Architecture**: `.claude/docs/ARCHITECTURE.md`
- **Development Guide**: `.claude/docs/DEVELOPMENT_GUIDE.md`
- **Schema Implementation**: `docs/SCHEMA_ORG_IMPLEMENTATION.md`
- **Homepage Implementation**: `docs/HOMEPAGE_AND_BRANDING_IMPLEMENTATION.md`

---

## Version History

**v1.0** (January 2025)
- Initial implementation
- Unified header and footer
- Breadcrumb system
- Mobile navigation
- Route exclusion for admin

---

## Support

For questions or issues with the navigation structure:
1. Check this documentation
2. Review component source code in `src/components/layout/`
3. Check existing page implementations for examples


