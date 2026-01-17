'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search,
  Globe,
  Menu,
} from 'lucide-react';

export function HomeHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-[#1e3a8a] shadow-lg'
        : 'bg-gradient-to-b from-black/50 to-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/BrandAssets/logo-dark.png"
              alt="Best of Goa"
              width={240}
              height={80}
              className="h-20 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Home', href: '/' },
              { label: 'Places to Eat', href: '/places-to-eat' },
              { label: 'Places to Stay', href: '/places-to-stay' },
              { label: 'Places to Shop', href: '/places-to-shop' },
              { label: 'Places to Visit', href: '/places-to-visit' },
              { label: 'Places to Learn', href: '/places-to-learn' },
              { label: 'Things to Do', href: '/things-to-do/fitness' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hidden md:flex"
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Link href="/login">
              <Button
                className="hidden sm:flex bg-amber-500 hover:bg-amber-600 text-white border-0"
              >
                Sign In
              </Button>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#1e3a8a] border-[#1e3a8a] p-0">
                <SheetHeader className="p-6 border-b border-white/10">
                  <SheetTitle className="text-white text-left">
                    <Image
                      src="/BrandAssets/logo-dark.png"
                      alt="Best of Goa"
                      width={160}
                      height={50}
                      className="h-12 w-auto"
                    />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4">
                  {[
                    { label: 'Home', href: '/' },
                    { label: 'Places to Eat', href: '/places-to-eat' },
                    { label: 'Places to Stay', href: '/places-to-stay' },
                    { label: 'Places to Shop', href: '/places-to-shop' },
                    { label: 'Places to Visit', href: '/places-to-visit' },
                    { label: 'Places to Learn', href: '/places-to-learn' },
                    { label: 'Things to Do', href: '/things-to-do/fitness' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-base font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Separator className="my-4 bg-white/10" />
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4"
                  >
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                      Sign In
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
