import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { AttractionCard } from '@/components/attraction/AttractionCard';
import { AttractionGovernorateCard } from '@/components/attraction/AttractionGovernorateCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  getTopRatedAttractions,
  getFamilyFriendlyAttractions,
  getAllCategoriesWithCounts,
  getGovernoratesWithStats,
  getTotalAttractionCount,
  getAttractionsByCategorySlug,
  getAttractionsByGovernorate,
  getAllAttractions
} from '@/lib/queries/places-to-visit';
import {
  ArrowLeft,
  Building2,
  TreePine,
  Landmark,
  Sparkles,
  Drama,
  Leaf,
  ShoppingBag,
  Clock,
  Umbrella,
  LucideIcon,
  MapPin,
  MoonStar
} from 'lucide-react';

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  museum: Building2,
  park: TreePine,
  landmark: Landmark,
  entertainment: Sparkles,
  cultural: Drama,
  nature: Leaf,
  shopping: ShoppingBag,
  historical: Clock,
  beach: Umbrella,
  religious: MoonStar,
};

function getCategoryIcon(slug: string): LucideIcon {
  return categoryIcons[slug] || MapPin;
}

interface PlacesToVisitPageProps {
  searchParams: Promise<{
    category?: string;
    governorate?: string;
  }>;
}

// Dynamic metadata for self-referencing canonicals on filtered pages
export async function generateMetadata({ searchParams }: PlacesToVisitPageProps): Promise<Metadata> {
  const params = await searchParams;
  const { category, governorate } = params;

  // Build canonical URL based on filters
  let canonicalUrl = 'https://www.bestofgoa.com/places-to-visit';
  let title = 'Best Attractions in Goa | Places to Visit';
  let description = 'Discover Goa\'s best attractions - historical landmarks, museums, parks & entertainment. Top-rated across all governorates.';

  if (category) {
    canonicalUrl = `https://www.bestofgoa.com/places-to-visit?category=${category}`;
    const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title = `Best ${categoryName} Attractions in Goa | Places to Visit`;
    description = `Discover the best ${categoryName.toLowerCase()} attractions in Goa. Top-rated ${categoryName.toLowerCase()} places to visit across all governorates.`;
  } else if (governorate) {
    canonicalUrl = `https://www.bestofgoa.com/places-to-visit?governorate=${governorate}`;
    const governorateNames: Record<string, string> = {
      'goa-city': 'Goa City',
      'hawalli': 'Hawalli',
      'farwaniya': 'Al Farwaniyah',
      'ahmadi': 'Al Ahmadi',
      'jahra': 'Al Jahra',
      'mubarak-al-kabeer': 'Mubarak Al-Kabeer'
    };
    const governorateName = governorateNames[governorate] || governorate.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title = `Best Attractions in ${governorateName} | Places to Visit`;
    description = `Discover the best attractions in ${governorateName}, Goa. Top-rated landmarks, museums, parks and entertainment venues.`;
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
          url: 'https://www.bestofgoa.com/images/categories/attractions.jpg',
          width: 1200,
          height: 630,
          alt: 'Best Attractions in Goa',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ['https://www.bestofgoa.com/images/categories/attractions.jpg'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PlacesToVisitPage({ searchParams }: PlacesToVisitPageProps) {
  const params = await searchParams;
  const { category, governorate } = params;

  // If filtering, fetch filtered data
  if (category) {
    const filteredAttractions = await getAttractionsByCategorySlug(category);
    const totalAttractions = await getTotalAttractionCount();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Hero Section */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/places-to-visit" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Attractions
                </Link>
              </Button>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 capitalize">
                {category.replace(/-/g, ' ')} Attractions in Goa
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 mb-8">
                Showing {filteredAttractions.length} {category.replace(/-/g, ' ')} attractions
              </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-16">
          {filteredAttractions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAttractions.map((attraction, index) => (
                <AttractionCard key={`${attraction.id}-${index}`} attraction={attraction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg mb-4">
                No attractions found in this category yet.
              </p>
              <Button asChild>
                <Link href="/places-to-visit">Browse All Attractions</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (governorate) {
    const filteredAttractions = await getAttractionsByGovernorate(governorate);
    const totalAttractions = await getTotalAttractionCount();

    // Get governorate display name
    const governorateNames: Record<string, string> = {
      'goa-city': 'Goa City',
      'hawalli': 'Hawalli',
      'farwaniya': 'Al Farwaniyah',
      'ahmadi': 'Al Ahmadi',
      'jahra': 'Al Jahra',
      'mubarak-al-kabeer': 'Mubarak Al-Kabeer'
    };
    const governorateName = governorateNames[governorate] || governorate;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Visit', href: '/places-to-visit' }, { label: governorateName }]} />
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/places-to-visit" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Attractions
                </Link>
              </Button>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                Best Attractions in {governorateName}
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 mb-8">
                Showing {filteredAttractions.length} attractions in {governorateName}
              </p>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-16">
          {filteredAttractions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAttractions.map((attraction, index) => (
                <AttractionCard key={`${attraction.id}-${index}`} attraction={attraction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg mb-4">
                No attractions found in this governorate yet.
              </p>
              <Button asChild>
                <Link href="/places-to-visit">Browse All Attractions</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Default view - fetch all data in parallel
  const [
    topRated,
    familyFriendly,
    categories,
    governorates,
    totalAttractions,
    allAttractions
  ] = await Promise.all([
    getTopRatedAttractions(8),
    getFamilyFriendlyAttractions(8),
    getAllCategoriesWithCounts(),
    getGovernoratesWithStats(),
    getTotalAttractionCount(),
    getAllAttractions()
  ]);

  // Safety checks - ensure arrays exist
  const safeTopRated = topRated || [];
  const safeFamilyFriendly = familyFriendly || [];
  const safeCategories = categories || [];
  const safeGovernorates = governorates || [];
  const safeAllAttractions = allAttractions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Visit' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent">
                Best Places to Visit
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated by public reviews, local expertise, and authentic experiences.
              Explore {totalAttractions}+ attractions across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar
                placeholder="Search attractions by name, area, or category..."
                type="attractions"
              />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="text-sm text-slate-500">Popular:</span>
              {["Cultural", "Historical", "Goa Towers", "Grand Mosque", "Family-Friendly"].map(
                (term) => (
                  <Link key={term} href={`/places-to-visit?q=${term}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs h-7"
                    >
                      {term}
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 border-blue-200">
              Featured
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Top Rated Attractions
            </h2>
            <p className="text-slate-600 mt-2">
              Highest rated experiences in Goa
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/places-to-visit?sort=rating">
              View All â†’
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeTopRated.map((attraction, index) => (
            <AttractionCard key={`${attraction.id}-${index}`} attraction={attraction} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/places-to-visit?sort=rating">
              View All Top Rated â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
              Categories
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              From cultural landmarks to modern entertainment
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8 max-w-6xl mx-auto">
            {safeCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/places-to-visit?category=${category.slug}`}
                  className="group"
                >
                  <div className="flex flex-col items-center p-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-all duration-300">
                    <IconComponent className="w-7 h-7 mb-2 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-white text-center transition-colors">
                      {category.name}
                    </span>
                    {category.attraction_count > 0 && (
                      <span className="text-xs text-blue-200 mt-1">
                        {category.attraction_count} places
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Categories Button */}
          <div className="text-center">
            <Button variant="secondary" size="lg" asChild>
              <Link href="/places-to-visit?view=all-categories">
                View All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by Governorate */}
      <section className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
              Explore Goa
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Best Attractions by Governorate
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Discover exceptional places in every corner of Goa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {safeGovernorates.map((governorate) => (
              <AttractionGovernorateCard key={governorate.id} governorate={governorate} />
            ))}
          </div>
        </div>
      </section>

      {/* Family-Friendly Section */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-cyan-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-green-100 text-green-700 border-green-200">
              For Families
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Family-Friendly Attractions
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Perfect experiences for all ages
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeFamilyFriendly.map((attraction, index) => (
              <AttractionCard key={`${attraction.id}-${index}`} attraction={attraction} />
            ))}
          </div>

          {/* View All Family-Friendly Button */}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/places-to-visit?family=true">
                View All Family-Friendly â†’
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* All Attractions - Comprehensive Directory */}
      {safeAllAttractions.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Attractions in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllAttractions.length} attractions across Goa
              </p>
            </div>

            {/* Compact Grid - All Attractions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllAttractions.map((attraction, index) => (
                <Link
                  key={`${attraction.id}-${index}`}
                  href={`/places-to-visit/attractions/${attraction.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
                    {attraction.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{attraction.area}</p>
                  {(attraction.bok_score || attraction.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(attraction.bok_score || attraction.google_rating)?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new attractions. Have a favorite spot we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">
                Suggest an Attraction
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/places-to-visit?view=all">
                Browse All {totalAttractions}+ Attractions
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
