'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SearchBar } from '@/components/SearchBar';
import { UserMenu } from '@/components/auth/UserMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navigationItems = [
  { label: 'Places to Eat', href: '/places-to-eat' },
  { label: 'Places to Stay', href: '/places-to-stay' },
  { label: 'Places to Shop', href: '/places-to-shop' },
  { label: 'Places to Visit', href: '/places-to-visit' },
  { label: 'Places to Learn', href: '/places-to-learn' },
  { label: 'Things to Do', href: '/things-to-do' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-4" suppressHydrationWarning>
        <div className="flex items-center justify-between gap-4" suppressHydrationWarning>
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src="/BrandAssets/logo.png"
              alt="Best of Goa"
              width={200}
              height={50}
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${isActive(item.href)
                  ? 'text-blue-600'
                  : 'text-slate-700 hover:text-blue-600'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar type="universal" placeholder="Search restaurants, hotels, malls..." />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" asChild>
              <Link href="/application">Submit Business</Link>
            </Button>
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Mobile Search */}
                <div className="md:hidden">
                  <SearchBar type="universal" placeholder="Search..." />
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <Separator />

                {/* Mobile Actions */}
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/application" onClick={() => setMobileMenuOpen(false)}>
                      Submit Business
                    </Link>
                  </Button>
                  <div className="flex justify-center pt-2">
                    <UserMenu />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


