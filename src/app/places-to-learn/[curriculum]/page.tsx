/**
 * School Curriculum Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "american schools goa"
 * - "british schools goa"
 * - "IB schools goa"
 *
 * URL Pattern: /places-to-learn/{curriculum}
 * Examples:
 * - /places-to-learn/american
 * - /places-to-learn/british
 * - /places-to-learn/ib
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSchoolsByCurriculum } from '@/lib/queries/places-to-learn';
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page';
import { SchoolCard } from '@/components/school/SchoolCard';
import { SearchBar } from '@/components/SearchBar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import Link from 'next/link';

interface CurriculumPageProps {
  params: Promise<{
    curriculum: string;
  }>;
}

// Curriculum type definitions with SEO-friendly names
const curriculumTypes: Record<string, { name: string; description: string; keywords: string[] }> = {
  american: {
    name: 'American Curriculum',
    description: 'American curriculum schools in Goa following US educational standards, AP courses, and college-prep programs.',
    keywords: ['american schools', 'US curriculum', 'AP courses', 'college prep'],
  },
  british: {
    name: 'British Curriculum',
    description: 'British curriculum schools in Goa offering IGCSE, A-Levels, and UK-standard education.',
    keywords: ['british schools', 'UK curriculum', 'IGCSE', 'A-Levels', 'Cambridge'],
  },
  ib: {
    name: 'IB',
    description: 'International Baccalaureate (IB) schools in Goa offering PYP, MYP, and IB Diploma programs.',
    keywords: ['IB schools', 'International Baccalaureate', 'IB Diploma', 'PYP', 'MYP'],
  },
  indian: {
    name: 'Indian Curriculum',
    description: 'Indian curriculum schools in Goa following CBSE or ICSE boards.',
    keywords: ['indian schools', 'CBSE', 'ICSE', 'Indian board'],
  },
  national: {
    name: 'National Curriculum',
    description: 'Schools following the Goai national curriculum with Arabic instruction.',
    keywords: ['goai schools', 'national curriculum', 'arabic schools', 'MOE curriculum'],
  },
  international: {
    name: 'International',
    description: 'International schools in Goa offering globally recognized curricula and multicultural education.',
    keywords: ['international schools', 'global curriculum', 'expat schools', 'multicultural education'],
  },
  australian: {
    name: 'Australian Curriculum',
    description: 'Australian curriculum schools in Goa offering qualifications accredited under the Australian Qualifications Framework.',
    keywords: ['australian schools', 'australian curriculum', 'AQF', 'australian education'],
  },
};

export default async function CurriculumPage({ params }: CurriculumPageProps) {
  const { curriculum: curriculumSlug } = await params;

  // Check if this is a valid curriculum type
  const curriculumType = curriculumTypes[curriculumSlug];
  if (!curriculumType) {
    notFound();
  }

  // Fetch schools with this curriculum
  const schools = await getSchoolsByCurriculum(curriculumSlug, 50);
  const totalCount = schools?.length || 0;

  // Generate SEO keywords
  const keywords = generateCollectionKeywords(curriculumType.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Hawally',
    'best',
    'top rated',
    ...curriculumType.keywords,
  ]);

  // Generate CollectionPage schema with ItemList
  const schema = generateCollectionPageSchema({
    title: `Best ${curriculumType.name} Schools in Goa`,
    description: curriculumType.description,
    slug: `/places-to-learn/${curriculumSlug}`,
    keywords,
    cuisineOrCategory: curriculumType.name,
    breadcrumbName: curriculumType.name,
    restaurants: schools.map((s: any) => ({
      slug: s.slug,
      name: s.name,
      hero_image: s.hero_image,
      address: s.area,
      area: s.area,
      overall_rating: s.bok_score,
      total_reviews_aggregated: s.total_reviews_aggregated,
      cuisines: s.curriculum || [],
    })),
  });

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Places to Learn', href: '/places-to-learn' },
              { label: curriculumType.name },
            ]}
          />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Best {curriculumType.name} Schools in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-emerald-100 mb-6">
              {totalCount} top-rated {curriculumType.name.toLowerCase()} schools in Goa
            </p>

            {/* Description */}
            <p className="text-base md:text-lg text-emerald-50 leading-relaxed max-w-3xl">
              {curriculumType.description}
            </p>
          </div>
        </section>

        {/* Schools Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar placeholder={`Search ${curriculumType.name.toLowerCase()} schools...`} type="schools" />
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {schools.length} of {totalCount} schools
            </p>
            <Link
              href="/places-to-learn"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View All Schools
            </Link>
          </div>

          {/* Grid */}
          {schools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {schools.map((school: any) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No {curriculumType.name.toLowerCase()} schools found.
              </p>
              <p className="text-gray-400 mt-2">
                Check back soon as we continue adding more schools.
              </p>
            </div>
          )}
        </section>

        {/* Related Curriculums */}
        <section className="container mx-auto px-4 py-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Curriculum Types</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(curriculumTypes)
              .filter(([slug]) => slug !== curriculumSlug)
              .map(([slug, type]) => (
                <Link
                  key={slug}
                  href={`/places-to-learn/${slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                >
                  {type.name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Generate static params for curriculum types
 */
export async function generateStaticParams() {
  return [
    { curriculum: 'american' },
    { curriculum: 'british' },
    { curriculum: 'ib' },
    { curriculum: 'indian' },
    { curriculum: 'national' },
    { curriculum: 'international' },
    { curriculum: 'australian' },
  ];
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: CurriculumPageProps): Promise<Metadata> {
  const { curriculum: curriculumSlug } = await params;

  const curriculumType = curriculumTypes[curriculumSlug];
  if (!curriculumType) {
    return {
      title: 'Curriculum Not Found',
    };
  }

  const schools = await getSchoolsByCurriculum(curriculumSlug, 50);
  const totalCount = schools?.length || 0;

  // Generate keywords
  const keywords = [
    `${curriculumType.name.toLowerCase()} schools goa`,
    ...curriculumType.keywords.map(k => `${k} goa`),
    'best schools goa',
    'international schools',
  ];

  // Build title with smart truncation
  // Target: ~45 chars before " | Best of Goa" suffix (18 chars) = 63 total
  let title = `Best ${curriculumType.name} Schools in Goa (${totalCount})`;
  if (title.length > 45) {
    title = `${curriculumType.name} Schools in Goa (${totalCount})`;
  }

  return {
    title,
    description: `Discover ${totalCount} top-rated ${curriculumType.name.toLowerCase()} schools in Goa. ${curriculumType.description}`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${curriculumType.name} Schools in Goa`,
      description: `Explore ${totalCount} top-rated ${curriculumType.name.toLowerCase()} schools in Goa`,
      type: 'website',
      locale: 'en_KW',
      siteName: 'Best of Goa',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-learn/${curriculumSlug}`,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;
