import { Inter } from 'next/font/google';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeFooter } from '@/components/home/HomeFooter';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { HomeHero } from '@/components/home/HomeHero';
import { ValueProps } from '@/components/home/ValueProps';
import { CategoryHighlights } from '@/components/home/CategoryHighlights';
import { Neighborhoods } from '@/components/home/Neighborhoods';
import { Destinations } from '@/components/home/Destinations';
import { CTASection } from '@/components/home/CTASection';

// Optimize Google Font loading - only essential weights
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '700'],
});

export default function Home() {
  return (
    <div className={`${inter.className} min-h-screen bg-white`} suppressHydrationWarning>
      {/* Sticky Header - Client Component */}
      <HomeHeader />

      {/* Hero Section - Static Impact Hero - Updated */}
      <HomeHero />

      {/* Value Props Section */}
      <ValueProps />

      {/* Categories Section */}
      <CategoryHighlights />

      {/* Popular Neighborhoods - New Section */}
      <Neighborhoods />

      {/* Destinations - New Section */}
      <Destinations />

      {/* CTA Section */}
      <CTASection />

      {/* Newsletter Section - Client Component */}
      <NewsletterSection />

      {/* Footer - Client Component */}
      <HomeFooter />
    </div>
  );
}

