import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItemUI>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-slate-500">{item.label}</span>
                )}
              </BreadcrumbItemUI>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Generate breadcrumb items from pathname
 * Helper function to auto-generate breadcrumbs from route structure
 */
export function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItemData[] {
  const items: BreadcrumbItemData[] = [{ label: 'Home', href: '/' }];

  if (pathname === '/') {
    return items;
  }

  const segments = pathname.split('/').filter(Boolean);

  // Map route segments to readable labels
  const segmentLabels: Record<string, string> = {
    'places-to-eat': 'Places to Eat',
    'places-to-stay': 'Places to Stay',
    'places-to-shop': 'Places to Shop',
    'places-to-visit': 'Places to Visit',
    'places-to-learn': 'Places to Learn',
    'things-to-do': 'Things to Do',
    restaurants: 'Restaurants',
    hotels: 'Hotels',
    malls: 'Malls',
    attractions: 'Attractions',
    schools: 'Schools',
    fitness: 'Fitness',
    dishes: 'Dishes',
    'restaurants': 'Restaurants',
  };

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Skip numeric IDs (like [id] in admin routes)
    if (/^\d+$/.test(segment)) {
      return;
    }

    // Get label from mapping or format segment
    const label =
      segmentLabels[segment] ||
      segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

