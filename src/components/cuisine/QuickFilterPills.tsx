import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Search, Utensils, Clock } from 'lucide-react';

interface QuickFilter {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickFilters: QuickFilter[] = [
  {
    label: 'Best Shawarma',
    href: '/places-to-eat/middle-eastern',
    icon: Utensils
  },
  {
    label: 'Fine Dining',
    href: '/places-to-eat/dishes/steak',
    icon: Utensils
  },
  {
    label: 'Best Biryani',
    href: '/places-to-eat/indian',
    icon: Utensils
  },
  {
    label: 'Best Burgers',
    href: '/places-to-eat/dishes/burger',
    icon: Utensils
  },
  {
    label: 'Breakfast Spots',
    href: '/places-to-eat/dishes/breakfast',
    icon: Clock
  },
  {
    label: 'Best Sushi',
    href: '/places-to-eat/dishes/sushi',
    icon: Utensils
  }
];

export function QuickFilterPills() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
        <Search className="w-4 h-4" />
        Trending:
      </span>
      {quickFilters.map((filter) => (
        <Link key={filter.label} href={filter.href}>
          <Badge
            variant="outline"
            className="px-4 py-2 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all cursor-pointer flex items-center gap-2 bg-white"
          >
            <filter.icon className="w-3.5 h-3.5" />
            {filter.label}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
