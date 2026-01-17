import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { MallCard } from '@/components/mall/MallCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  getAllMalls,
  getFeaturedMalls,
  getMallCategoriesWithCount,
  getAllMallsForListing,
  getMallsByCategorySlug,
} from '@/lib/queries/mall';
import { ArrowLeft } from 'lucide-react';

interface PlacesToShopPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

// Dynamic metadata for self-referencing canonicals on filtered pages
export async function generateMetadata({ searchParams }: PlacesToShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const { category } = params;

  // Build canonical URL based on filters
  let canonicalUrl = 'https://www.bestofgoa.com/places-to-shop';
  let title = 'Best Shopping Malls in Goa | Places to Shop';
  let description = 'Discover Goa\'s best shopping malls. From luxury centers to family-friendly malls with dining and entertainment.';

  if (category) {
    canonicalUrl = `https://www.bestofgoa.com/places-to-shop?category=${category}`;
    const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title = `Best ${categoryName} Shopping Malls in Goa | Places to Shop`;
    description = `Discover the best ${categoryName.toLowerCase()} shopping malls in Goa. Top-rated ${categoryName.toLowerCase()} malls with dining, entertainment, and more.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_KW',
      siteName: 'Best of Goa',
      url: canonicalUrl,
      images: [
        {
          url: 'https://www.bestofgoa.com/images/categories/malls.jpg',
          width: 1200,
          height: 630,
          alt: 'Best Shopping Malls in Goa',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ['https://www.bestofgoa.com/images/categories/malls.jpg'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PlacesToShopPage({ searchParams }: PlacesToShopPageProps) {
  const params = await searchParams;
  const { category } = params;

  // If category filter is present, show filtered view
  if (category) {
    const { malls: filteredMalls, categoryName } = await getMallsByCategorySlug(category);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" suppressHydrationWarning>
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6" suppressHydrationWarning>
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Places to Shop', href: '/places-to-shop' },
            { label: categoryName || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
          ]} />
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b" suppressHydrationWarning>
          <div className="container mx-auto px-4 py-16 md:py-24" suppressHydrationWarning>
            <div className="max-w-4xl mx-auto" suppressHydrationWarning>
              {/* Back Button */}
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/places-to-shop" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Malls
                </Link>
              </Button>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                {categoryName || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}{' '}
                <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
                  Shopping Malls
                </span>{' '}
                in Goa
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 mb-8">
                Showing {filteredMalls.length} {categoryName?.toLowerCase() || category.replace(/-/g, ' ')} {filteredMalls.length === 1 ? 'mall' : 'malls'}
              </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-16" suppressHydrationWarning>
          {filteredMalls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMalls.map((mall) => (
                <MallCard key={mall.id} mall={mall} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16" suppressHydrationWarning>
              <p className="text-slate-600 text-lg mb-4">
                No malls found in this category yet.
              </p>
              <Button asChild>
                <Link href="/places-to-shop">Browse All Malls</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Default view - fetch all data in parallel
  const [featuredMalls, { malls: allMalls, count: totalMalls }, categories, allMallsListing] = await Promise.all([
    getFeaturedMalls(8),
    getAllMalls({ limit: 12 }),
    getMallCategoriesWithCount(),
    getAllMallsForListing(),
  ]);

  // Safety checks - ensure arrays exist
  const safeFeaturedMalls = featuredMalls || [];
  const safeAllMalls = allMalls || [];
  const safeCategories = categories || [];
  const safeAllMallsListing = allMallsListing || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" suppressHydrationWarning>
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6" suppressHydrationWarning>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Shop' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b" suppressHydrationWarning>
        <div className="container mx-auto px-4 py-16 md:py-24" suppressHydrationWarning>
          <div className="max-w-4xl mx-auto text-center" suppressHydrationWarning>
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
                Best Places to Shop
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated by public reviews, local expertise, and shopping experiences. Explore{' '}
              {totalMalls}+ malls and shopping centers across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar
                placeholder="Search malls by name, area, or category..."
                type="malls"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Malls Section */}
      {safeFeaturedMalls.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge
                variant="secondary"
                className="mb-2 bg-purple-100 text-purple-700 border-purple-200"
              >
                Featured
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Featured Malls</h2>
              <p className="text-slate-600 mt-2">Top shopping destinations in Goa</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/places-to-shop?view=all">View All Malls</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeFeaturedMalls.map((mall) => (
              <MallCard key={mall.id} mall={mall} />
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/places-to-shop?view=all">View All Featured Malls</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Browse by Category */}
      {safeCategories.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge
                variant="secondary"
                className="mb-3 bg-purple-100 text-purple-700 border-purple-200"
              >
                Categories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Browse by Category
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Find the perfect shopping experience for your needs
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {safeCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/places-to-shop?category=${category.slug}`}
                  className="group"
                >
                  <div className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 bg-white">
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {getCategoryIcon(category.slug)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-purple-600 transition-colors">
                      {category.name}
                    </span>
                    {category.mall_count > 0 && (
                      <span className="text-xs text-gray-500 mt-1">
                        {category.mall_count} {category.mall_count === 1 ? 'mall' : 'malls'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Malls - Comprehensive Directory */}
      {safeAllMallsListing.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Shopping Malls in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllMallsListing.length} shopping malls across Goa
              </p>
            </div>

            {/* Compact Grid - All Malls */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllMallsListing.map((mall) => (
                <Link
                  key={mall.id}
                  href={`/places-to-shop/malls/${mall.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-600 line-clamp-2 mb-1">
                    {mall.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{mall.area}</p>
                  {(mall.bok_score || mall.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(mall.bok_score || mall.google_rating)?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new shopping destinations. Have a favorite mall we should
            feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">Suggest a Mall</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/places-to-shop?view=all">Browse All {totalMalls}+ Malls</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Get an appropriate icon for mall category
 */
function getCategoryIcon(slug: string): string {
  const iconMap: Record<string, string> = {
    luxury: 'ðŸ’Ž',
    'super-regional': 'ðŸ¬',
    regional: 'ðŸ›ï¸',
    community: 'ðŸ˜ï¸',
    lifestyle: 'âœ¨',
    outlet: 'ðŸ·ï¸',
    family: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦',
    entertainment: 'ðŸŽ®',
    specialty: 'ðŸŽ¯',
  };

  return iconMap[slug] || 'ðŸ›’';
}