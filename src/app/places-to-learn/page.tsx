import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { SchoolCard } from '@/components/school/SchoolCard';
import { SchoolGovernorateCard } from '@/components/school/SchoolGovernorateCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  getTopRatedSchools,
  getInternationalSchools,
  getAllCategoriesWithCounts,
  getGovernoratesWithStats,
  getTotalSchoolCount,
  getAllSchools
} from '@/lib/queries/places-to-learn';

// Valid curriculum slugs for redirect
const validCurriculumSlugs = [
  'american', 'british', 'ib', 'indian', 'national', 'international', 'australian'
];

export const metadata: Metadata = {
  title: 'Best Schools in Goa | Places to Learn',
  description: 'Discover Goa\'s best schools - international curricula, British, American & IB programs. Top-rated across all governorates.',
  openGraph: {
    title: 'Best Schools in Goa | Places to Learn',
    description: 'Discover Goa\'s best schools - international, British, American & IB programs.',
    type: 'website',
    locale: 'en_KW',
    siteName: 'Best of Goa',
    url: 'https://www.bestofgoa.com/places-to-learn',
    images: [
      {
        url: 'https://www.bestofgoa.com/images/categories/schools.jpg',
        width: 1200,
        height: 630,
        alt: 'Best Schools in Goa',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Schools in Goa",
    description: "Discover Goa's best schools - international, British, American & IB programs.",
    images: ['https://www.bestofgoa.com/images/categories/schools.jpg'],
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/places-to-learn',
  },
};

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function PlacesToLearnPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Redirect ?category=X to /places-to-learn/X for SEO
  if (params.category && validCurriculumSlugs.includes(params.category.toLowerCase())) {
    redirect(`/places-to-learn/${params.category.toLowerCase()}`);
  }

  // Fetch all data in parallel
  const [
    topRated,
    international,
    categories,
    governorates,
    totalSchools,
    allSchools
  ] = await Promise.all([
    getTopRatedSchools(8),
    getInternationalSchools(8),
    getAllCategoriesWithCounts(),
    getGovernoratesWithStats(),
    getTotalSchoolCount(),
    getAllSchools()
  ]);

  // Safety checks - ensure arrays exist
  const safeTopRated = topRated || [];
  const safeInternational = international || [];
  const safeCategories = categories || [];
  const safeGovernorates = governorates || [];
  const safeAllSchools = allSchools || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Learn' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent">
                Best Schools
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated by parent reviews, academic excellence, and proven results.
              Explore {totalSchools}+ schools across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar
                placeholder="Search schools by name, curriculum, or area..."
                type="schools"
              />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="text-sm text-slate-500">Popular:</span>
              {["British Curriculum", "International", "IB", "American", "Salmiya"].map(
                (term) => (
                  <Link key={term} href={`/places-to-learn?q=${term}`}>
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
            <Badge variant="secondary" className="mb-2 bg-purple-100 text-purple-700 border-purple-200">
              Featured
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Top Rated Schools
            </h2>
            <p className="text-slate-600 mt-2">
              Highest rated schools in Goa
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/places-to-learn?sort=rating">
              View All â†’
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeTopRated.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/places-to-learn?sort=rating">
              View All Top Rated â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* Browse by Governorate */}
      <section className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
              Explore Goa
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Best Schools by Governorate
            </h2>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Find exceptional education in every corner of Goa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {safeGovernorates.map((governorate) => (
              <SchoolGovernorateCard key={governorate.id} governorate={governorate} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-purple-100 text-purple-700 border-purple-200">
              Categories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Browse by Curriculum & Type
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From international curricula to local excellence
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {safeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/places-to-learn/${category.slug}`}
                className="group"
              >
                <div className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 bg-white">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    {category.icon || 'ðŸŽ“'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-purple-600 transition-colors">
                    {category.name}
                  </span>
                  {category.school_count > 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {category.school_count} schools
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Categories Button */}
          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/places-to-learn?view=all-categories">
                View All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* International Schools Section */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
              International
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              International Schools
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              World-class education with globally recognized curricula
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeInternational.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>

          {/* View All International Schools Button */}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/places-to-learn/international">
                View All International Schools â†’
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* All Schools - Comprehensive Directory */}
      {safeAllSchools.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Schools in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllSchools.length} schools across Goa
              </p>
            </div>

            {/* Compact Grid - All Schools */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllSchools.map((school) => (
                <Link
                  key={school.id}
                  href={`/places-to-learn/schools/${school.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-600 line-clamp-2 mb-1">
                    {school.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{school.area}</p>
                  {school.curriculum && school.curriculum.length > 0 && (
                    <p className="text-xs text-purple-600 mt-1 line-clamp-1 capitalize">
                      {school.curriculum[0]}
                    </p>
                  )}
                  {(school.bok_score || school.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(school.bok_score || school.google_rating)?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find the School You're Looking For?
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new schools. Have a school we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">
                Suggest a School
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/places-to-learn?view=all">
                Browse All {totalSchools}+ Schools
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}