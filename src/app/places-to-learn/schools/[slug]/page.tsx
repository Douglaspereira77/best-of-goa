import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  MapPin,
  Clock,
  Star,
  Phone,
  Globe,
  Mail,
  GraduationCap,
  Users,
  DollarSign,
  BookOpen,
  Award,
  Calendar,
  Instagram,
  Facebook,
  Music,
  Youtube,
  Info,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { SchoolPhotoGallery } from '@/components/school/SchoolPhotoGallery'
import { SchoolBOKScoreCard } from '@/components/school/SchoolBOKScoreCard'
import { LocationMap } from '@/components/shared/LocationMap'
import { normalizeSocialUrl } from '@/lib/utils'
import { FavoriteButton } from '@/components/user/FavoriteButton'
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton'

async function getSchool(slug: string, isPreview: boolean = false) {
  const supabase = createClient()

  // Build query - skip active check if preview mode
  let query = supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)

  // Only check active status for public views (not preview)
  if (!isPreview) {
    query = query.eq('active', true)
  }

  const { data: school, error } = await query.single()

  if (error || !school) {
    return null
  }

  // Get categories
  const { data: categories } = await supabase
    .from('school_categories')
    .select('id, name, slug')
    .in('id', school.school_category_ids || [])

  // Get features
  const { data: features } = await supabase
    .from('school_features')
    .select('id, name, slug, icon')
    .in('id', school.school_feature_ids || [])

  // Get hero image (prioritize is_hero flag, fallback to first exterior)
  const { data: heroImage } = await supabase
    .from('school_images')
    .select('*')
    .eq('school_id', school.id)
    .eq('is_active', true)
    .or('is_hero.eq.true,type.eq.exterior')
    .order('is_hero', { ascending: false })
    .order('display_order')
    .limit(1)
    .maybeSingle()

  // Get gallery images (prioritize non-exteriors, but ensure we get 6 images)
  // First, get non-exterior images from school_images table
  const { data: nonExteriorImages } = await supabase
    .from('school_images')
    .select('*')
    .eq('school_id', school.id)
    .eq('is_active', true)
    .not('type', 'eq', 'exterior')
    .order('display_order')
    .limit(6)

  let galleryImages = nonExteriorImages || []

  // If we have fewer than 6, supplement with best exterior images (excluding hero)
  if (galleryImages.length < 6) {
    let exteriorQuery = supabase
      .from('school_images')
      .select('*')
      .eq('school_id', school.id)
      .eq('is_active', true)
      .eq('type', 'exterior')
    
    // Exclude hero image if it exists
    if (heroImage?.id) {
      exteriorQuery = exteriorQuery.neq('id', heroImage.id)
    }

    const { data: exteriorImages } = await exteriorQuery
      .order('quality_score', { ascending: false })
      .order('display_order')
      .limit(6 - galleryImages.length)

    if (exteriorImages && exteriorImages.length > 0) {
      galleryImages = [...galleryImages, ...exteriorImages]
    }
  }

  // FALLBACK: If no images from school_images table, use photos column
  if (galleryImages.length === 0 && school.photos && school.photos.length > 0) {
    // Convert photos array to gallery format
    galleryImages = school.photos.map((url: string, index: number) => ({
      id: `photo-${index}`,
      url: url,
      school_id: school.id,
      type: 'photo',
      display_order: index,
      is_active: true
    }))
  }

  // Determine hero image URL: prioritize school_images table, fallback to hero_image column
  const heroImageUrl = heroImage?.url || school.hero_image || null

  return {
    ...school,
    categories: categories || [],
    features: features || [],
    heroImage: heroImage || null,
    heroImageUrl,
    galleryImages: galleryImages || []
  }
}

// Helper to generate SEO-optimized title under 45 characters (layout adds " | Best of Goa" suffix)
function generateSchoolTitle(school: { name: string; area?: string; meta_title?: string }): string {
  const MAX_LENGTH = 45; // Keep under 45 so total stays under 60 with suffix

  // If meta_title exists, clean it first
  if (school.meta_title) {
    let title = school.meta_title;
    // Remove any existing suffix (layout template adds it)
    title = title.replace(/\s*\|\s*Best of Goa$/i, '').replace(/\s*-\s*Best of Goa$/i, '');

    if (title.length <= MAX_LENGTH) {
      return title;
    }
    // Truncate if too long
    let truncated = title.substring(0, MAX_LENGTH - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > MAX_LENGTH * 0.6) {
      truncated = truncated.substring(0, lastSpace);
    }
    return `${truncated}...`;
  }

  // Build title from name
  let title = school.name;
  if (school.area && title.length + school.area.length + 4 <= MAX_LENGTH) {
    title = `${school.name} in ${school.area}`;
  }

  if (title.length <= MAX_LENGTH) {
    return title;
  }

  // Truncate school name intelligently (avoid cutting mid-word)
  let truncatedName = school.name.substring(0, MAX_LENGTH - 3);
  const lastSpace = truncatedName.lastIndexOf(' ');
  if (lastSpace > MAX_LENGTH * 0.6) {
    truncatedName = truncatedName.substring(0, lastSpace);
  }

  return `${truncatedName}...`;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const school = await getSchool(slug)

  if (!school) {
    return {
      title: 'School Not Found',
      description: 'The requested school could not be found.'
    }
  }

  const title = generateSchoolTitle(school);
  const description = school.meta_description ||
    school.short_description ||
    `Discover ${school.name} in ${school.area || 'Goa'}. View curriculum, facilities, fees, and reviews.`;

  return {
    title,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: school.meta_keywords || [],
    openGraph: {
      title: school.og_title || school.name,
      description: school.og_description || school.short_description || description,
      images: school.heroImageUrl ? [school.heroImageUrl] : [],
      type: 'website'
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-learn/schools/${slug}`,
    },
  }
}

export default async function SchoolPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const isPreview = preview === 'true'
  const school = await getSchool(slug, isPreview)

  if (!school) {
    notFound()
  }

  // Use google_rating or fall back to parent_rating
  const displayRating = school.google_rating || school.parent_rating
  const reviewCount = school.google_review_count || school.total_reviews_aggregated

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          Preview Mode - This page is not published yet
        </div>
      )}
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            // Filter out undefined values to prevent schema validation errors
            Object.fromEntries(
              Object.entries({
                '@context': 'https://schema.org',
                '@type': 'EducationalOrganization',
                name: school.name,
                alternateName: school.name_ar || undefined,
                description: school.description || school.short_description || undefined,
                address: school.address ? {
                  '@type': 'PostalAddress',
                  streetAddress: school.address,
                  addressLocality: school.area || undefined,
                  addressCountry: 'Goa'
                } : undefined,
                geo: school.latitude && school.longitude
                  ? {
                      '@type': 'GeoCoordinates',
                      latitude: school.latitude,
                      longitude: school.longitude
                    }
                  : undefined,
                telephone: school.phone || undefined,
                email: school.email || undefined,
                url: school.website || undefined,
                image: school.heroImageUrl || undefined,
                logo: school.logo_image || undefined,
                sameAs: [
                  school.facebook,
                  school.instagram,
                  school.twitter,
                  school.linkedin,
                  school.youtube
                ].filter(Boolean).length > 0
                  ? [school.facebook, school.instagram, school.twitter, school.linkedin, school.youtube].filter(Boolean)
                  : undefined,
                // Only include aggregateRating if BOTH ratingValue AND reviewCount are valid numbers
                aggregateRating: displayRating && reviewCount && reviewCount > 0
                  ? {
                      '@type': 'AggregateRating',
                      ratingValue: displayRating,
                      reviewCount: reviewCount,
                      bestRating: 5,
                      worstRating: 1
                    }
                  : undefined,
                foundingDate: school.year_established ? school.year_established.toString() : undefined,
                hasOfferCatalog: school.special_programs && school.special_programs.length > 0
                  ? {
                      '@type': 'OfferCatalog',
                      name: 'Academic Programs',
                      itemListElement: school.special_programs.map((program: string) => ({
                        '@type': 'Offer',
                        itemOffered: {
                          '@type': 'Course',
                          name: program
                        }
                      }))
                    }
                  : undefined,
                employee: school.principal_name
                  ? {
                      '@type': 'Person',
                      name: school.principal_name,
                      jobTitle: 'Principal'
                    }
                  : undefined,
                availableLanguage: school.languages_taught && school.languages_taught.length > 0
                  ? school.languages_taught.map((lang: string) => ({
                      '@type': 'Language',
                      name: lang
                    }))
                  : undefined
              }).filter(([, v]) => v !== undefined)
            )
          )
        }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black/30" />
        {school.heroImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${school.heroImageUrl})` }}
          />
        )}

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <FavoriteButton
            itemType="school"
            itemId={school.id}
            size="lg"
          />
          <AddToItineraryButton
            itemType="school"
            itemId={school.id}
            itemName={school.name}
            size="lg"
          />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <nav className="text-sm mb-6 opacity-90">
              <Link href="/" className="hover:underline hover:opacity-100 transition-opacity">
                Home
              </Link>
              <span className="mx-2 opacity-60">/</span>
              <Link href="/places-to-learn" className="hover:underline hover:opacity-100 transition-opacity">
                Places to Learn
              </Link>
              <span className="mx-2 opacity-60">/</span>
              <span className="opacity-80">{school.name}</span>
            </nav>

            {/* Logo and Name */}
            <div className="flex items-start gap-4 mb-4">
              {school.logo_image ? (
                <div className="w-20 h-20 bg-white rounded-xl shadow-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={school.logo_image}
                    alt={`${school.name} logo`}
                    width={80}
                    height={80}
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {school.name
                      .split(' ')
                      .slice(0, 2)
                      .map(word => word[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{school.name}</h1>
                {school.name_ar && (
                  <p className="text-xl opacity-90 mb-2">{school.name_ar}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {school.school_type && (
                <Badge className="bg-white/20 text-white border-white/30 capitalize">
                  {school.school_type.replace(/_/g, ' ')}
                </Badge>
              )}
              {school.curriculum && school.curriculum.length > 0 && (
                <div className="flex gap-2">
                  {school.curriculum.slice(0, 3).map((curr: string, i: number) => (
                    <Badge key={i} className="bg-purple-700 text-white capitalize">
                      {curr}
                    </Badge>
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {school.area}, Goa
              </span>
              {school.bok_score && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{school.bok_score.toFixed(1)}/10</span>
                </div>
              )}
            </div>

            <p className="text-lg opacity-90 max-w-2xl">
              {school.short_description || school.description?.substring(0, 200)}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. About */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-4">About {school.name}</h2>
              {school.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {school.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">Description coming soon.</p>
              )}
            </div>

            {/* 2. What Parents Say */}
            {school.review_sentiment && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2 text-blue-900">What Parents Say</h2>
                    <p className="text-gray-700 leading-relaxed">{school.review_sentiment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Principal's Message */}
            {school.principal_message && school.principal_name && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-8 border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {school.principal_name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-purple-900 mb-1">Message from the Principal</h3>
                    <p className="text-sm text-purple-700 font-medium mb-3">{school.principal_name}</p>
                    <p className="text-gray-700 leading-relaxed italic">"{school.principal_message}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* Unique Selling Points */}
            {school.unique_selling_points && school.unique_selling_points.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Why Choose {school.name}?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {school.unique_selling_points.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        ✓
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Programs */}
            {school.special_programs && school.special_programs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-7 h-7 text-purple-600" />
                  Special Programs
                </h2>
                <div className="flex flex-wrap gap-3">
                  {school.special_programs.map((program: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200 hover:shadow-md transition-shadow">
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracurricular & Sports */}
            {((school.extracurricular_activities && school.extracurricular_activities.length > 0) || 
              (school.sports_offered && school.sports_offered.length > 0) ||
              (school.clubs_offered && school.clubs_offered.length > 0)) && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Beyond the Classroom</h2>
                
                {school.sports_offered && school.sports_offered.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">⚽</span>
                      Sports & Athletics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {school.sports_offered.map((sport: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {school.clubs_offered && school.clubs_offered.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎭</span>
                      Clubs & Societies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {school.clubs_offered.map((club: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                          {club}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {school.extracurricular_activities && school.extracurricular_activities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎨</span>
                      Extracurricular Activities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {school.extracurricular_activities.slice(0, 20).map((activity: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200">
                          {activity}
                        </span>
                      ))}
                      {school.extracurricular_activities.length > 20 && (
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          +{school.extracurricular_activities.length - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Languages Taught */}
            {school.languages_taught && school.languages_taught.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-8 border border-indigo-100">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🌍</span>
                  Languages Taught
                </h2>
                <div className="flex flex-wrap gap-3">
                  {school.languages_taught.map((language: string, i: number) => (
                    <div key={i} className="px-5 py-3 bg-white rounded-xl shadow-sm border border-indigo-200 flex items-center gap-2">
                      <span className="text-2xl">💬</span>
                      <span className="font-semibold text-indigo-900">{language}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Information - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <GraduationCap className="w-7 h-7 text-purple-600" />
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {school.curriculum && school.curriculum.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                    <BookOpen className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-purple-900 mb-1">Curriculum</div>
                      <div className="flex flex-wrap gap-2">
                        {school.curriculum.map((curr: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-purple-700 shadow-sm capitalize">
                            {curr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {school.grade_levels && school.grade_levels.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <GraduationCap className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 mb-1">Grade Levels</div>
                      <div className="font-medium text-blue-700 capitalize">
                        {school.min_grade && school.max_grade
                          ? `${school.min_grade} - ${school.max_grade}`
                          : school.grade_levels.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
                {school.year_established && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-100">
                    <Calendar className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-green-900 mb-1">Established</div>
                      <div className="font-medium text-green-700">{school.year_established}</div>
                    </div>
                  </div>
                )}
                {school.gender_policy && (
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100">
                    <Users className="w-6 h-6 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-pink-900 mb-1">Gender Policy</div>
                      <div className="font-medium text-pink-700 capitalize">
                        {school.gender_policy.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                )}
                {school.accreditation_bodies && school.accreditation_bodies.length > 0 && (
                  <div className="md:col-span-2 flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                    <Award className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-amber-900 mb-2">Accreditation Bodies</div>
                      <div className="flex flex-wrap gap-2">
                        {school.accreditation_bodies.map((body: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-amber-700 shadow-sm">
                            {body}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Facilities & Features - Enhanced */}
            {school.features && school.features.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Facilities & Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {school.features.map((feature: any) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      {feature.icon && <span className="text-xl">{feature.icon}</span>}
                      <span className="text-sm font-medium text-gray-800">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {school.galleryImages && school.galleryImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center gap-2 mb-6">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold">Photo Gallery</h2>
                  <span className="text-sm text-gray-500">({school.galleryImages.length} photos)</span>
                </div>
                <SchoolPhotoGallery
                  images={school.galleryImages}
                  schoolName={school.name}
                />
              </div>
            )}

            {/* Special Features */}
            {(school.has_boarding || school.accepts_special_needs || school.transportation_available || school.has_sports_facilities) && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4">Special Features</h2>
                <div className="grid grid-cols-2 gap-4">
                  {school.has_boarding && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                      <div className="text-2xl">🏠</div>
                      <div>
                        <div className="font-semibold text-gray-900">Boarding Facilities</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                    </div>
                  )}
                  {school.accepts_special_needs && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="text-2xl">♿</div>
                      <div>
                        <div className="font-semibold text-gray-900">Special Needs Support</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                    </div>
                  )}
                  {school.transportation_available && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg">
                      <div className="text-2xl">🚌</div>
                      <div>
                        <div className="font-semibold text-gray-900">Transportation</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                    </div>
                  )}
                  {school.has_sports_facilities && (
                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                      <div className="text-2xl">⚽</div>
                      <div>
                        <div className="font-semibold text-gray-900">Sports Facilities</div>
                        <div className="text-sm text-gray-600">Available</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Map */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              <LocationMap
                placeId={school.google_place_id}
                latitude={school.latitude}
                longitude={school.longitude}
                name={school.name}
                address={school.address}
                className="w-full h-[450px]"
              />
              <div className="mt-4 flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{school.address}</p>
                  {school.area && (
                    <p className="text-sm text-gray-600">{school.area}, Goa</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* BOK Score Card */}
            {school.bok_score && (
              <SchoolBOKScoreCard
                bokScore={school.bok_score}
                bokScoreBreakdown={school.bok_score_breakdown}
                googleRating={school.google_rating}
                googleReviewCount={school.google_review_count}
                totalReviews={school.total_reviews_aggregated}
              />
            )}

            {/* Tuition Information - Enhanced */}
            {(school.tuition_range_min || school.tuition_range_max) && (
              <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Annual Tuition</h3>
                </div>
                <div className="text-3xl font-bold mb-2">
                  {school.tuition_range_min && school.tuition_range_max
                    ? `${school.currency || 'KWD'} ${school.tuition_range_min.toLocaleString()} - ${school.tuition_range_max.toLocaleString()}`
                    : school.tuition_range_min
                    ? `From ${school.currency || 'KWD'} ${school.tuition_range_min.toLocaleString()}`
                    : `Up to ${school.currency || 'KWD'} ${school.tuition_range_max?.toLocaleString()}`}
                </div>
                <p className="text-sm text-purple-100 mb-3">per academic year</p>
                {school.registration_fee && (
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-sm text-purple-100">
                      Registration Fee: <span className="font-semibold text-white">{school.currency || 'KWD'} {school.registration_fee.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Card - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{school.address}</div>
                    <div className="text-sm text-gray-500">{school.area}, Goa</div>
                  </div>
                </div>
                {school.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${school.phone}`} className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                      {school.phone}
                    </a>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${school.email}`} className="text-purple-600 hover:text-purple-700 font-medium hover:underline break-all">
                      {school.email}
                    </a>
                  </div>
                )}
                {school.website && (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Highlight - School Type/Distinction */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">School Information</h3>
                  {school.school_type && (
                    <p className="text-blue-100 mb-2 capitalize">
                      <span className="font-semibold">Type:</span> {school.school_type.replace(/_/g, ' ')}
                    </p>
                  )}
                  {school.curriculum && school.curriculum.length > 0 && (
                    <p className="text-blue-100">
                      <span className="font-semibold">Primary Curriculum:</span> {school.curriculum[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Media */}
            {(normalizeSocialUrl(school.instagram, 'instagram') || normalizeSocialUrl(school.facebook, 'facebook') || normalizeSocialUrl(school.tiktok, 'tiktok') || normalizeSocialUrl(school.youtube, 'youtube') || normalizeSocialUrl(school.twitter, 'twitter') || school.linkedin) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3 flex-wrap">
                  {normalizeSocialUrl(school.instagram, 'instagram') && (
                    <a
                      href={normalizeSocialUrl(school.instagram, 'instagram')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white hover:opacity-80 transition"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(school.facebook, 'facebook') && (
                    <a
                      href={normalizeSocialUrl(school.facebook, 'facebook')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:opacity-80 transition"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(school.tiktok, 'tiktok') && (
                    <a
                      href={normalizeSocialUrl(school.tiktok, 'tiktok')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:opacity-80 transition"
                    >
                      <Music className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(school.youtube, 'youtube') && (
                    <a
                      href={normalizeSocialUrl(school.youtube, 'youtube')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white hover:opacity-80 transition"
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(school.twitter, 'twitter') && (
                    <a
                      href={normalizeSocialUrl(school.twitter, 'twitter')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:opacity-80 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {school.linkedin && (
                    <a
                      href={school.linkedin.startsWith('http') ? school.linkedin : `https://linkedin.com/company/${school.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 text-white hover:opacity-80 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Office Hours - Enhanced */}
            {school.office_hours && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Office Hours
                </h3>
                <div className="space-y-2">
                  {Object.entries(school.office_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between text-sm py-2 border-b last:border-b-0">
                      <span className="capitalize font-semibold text-gray-700">{day}</span>
                      <span className={hours.open === 'Closed' ? 'text-gray-400' : 'text-gray-600 font-medium'}>
                        {hours.open === 'Closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
