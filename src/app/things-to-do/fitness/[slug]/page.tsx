import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  MapPin,
  Clock,
  Star,
  Phone,
  Globe,
  Mail,
  Users,
  Camera,
  Accessibility,
  ParkingCircle,
  Info,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Music,
  Navigation,
  Dumbbell,
  Calendar,
  Award,
  DollarSign,
  CheckCircle2
} from 'lucide-react'
import Image from 'next/image'
import { FitnessPhotoGallery } from '@/components/fitness/FitnessPhotoGallery'
import { FitnessBOKScoreCard } from '@/components/fitness/FitnessBOKScoreCard'
import { LocationMap } from '@/components/shared/LocationMap'
import { FavoriteButton } from '@/components/user/FavoriteButton'
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton'
import { getFitnessPlaceBySlug } from '@/lib/queries/fitness'
import { Badge } from '@/components/ui/badge'
import { normalizeSocialUrl } from '@/lib/utils'

const GENDER_BADGE_COLORS: Record<string, string> = {
  'women-only': 'bg-pink-100 text-pink-700 border-pink-200',
  'men-only': 'bg-blue-100 text-blue-700 border-blue-200',
  'co-ed': 'bg-green-100 text-green-700 border-green-200',
  'separate-hours': 'bg-purple-100 text-purple-700 border-purple-200'
}

const GENDER_LABELS: Record<string, string> = {
  'women-only': 'Women Only',
  'men-only': 'Men Only',
  'co-ed': 'Co-Ed',
  'separate-hours': 'Separate Hours'
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const fitnessPlace = await getFitnessPlaceBySlug(slug)

  if (!fitnessPlace) {
    return {
      title: 'Fitness Center Not Found',
      description: 'The requested fitness center could not be found.'
    }
  }

  // Remove " | Best of Goa" suffix if present (layout template adds it)
  let metaTitle = fitnessPlace.meta_title || `${fitnessPlace.name} - Fitness in ${fitnessPlace.area}`;
  metaTitle = metaTitle.replace(/\s*\|\s*Best of Goa$/i, '').replace(/\s*-\s*Best of Goa$/i, '');
  metaTitle = metaTitle.replace(/\s*\|\s*Fitness Centers\s*-?\s*$/i, '');

  // Truncate to ~45 chars to stay under 60 with template suffix
  if (metaTitle.length > 45) {
    metaTitle = `${fitnessPlace.name} in ${fitnessPlace.area}`;
    if (metaTitle.length > 45) {
      metaTitle = fitnessPlace.name.substring(0, 42) + '...';
    }
  }

  return {
    title: metaTitle,
    description:
      fitnessPlace.meta_description ||
      fitnessPlace.short_description ||
      `Visit ${fitnessPlace.name} in ${fitnessPlace.area}, Goa`,
    keywords: fitnessPlace.meta_keywords || [],
    openGraph: {
      title: fitnessPlace.og_title || fitnessPlace.meta_title || fitnessPlace.name,
      description:
        fitnessPlace.og_description || fitnessPlace.meta_description || fitnessPlace.short_description,
      images: fitnessPlace.hero_image ? [fitnessPlace.hero_image] : [],
      type: 'website'
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/things-to-do/fitness/${slug}`,
    },
  }
}

export default async function FitnessPlacePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const isPreview = preview === 'true'
  const fitnessPlace = await getFitnessPlaceBySlug(slug, isPreview)

  if (!fitnessPlace) {
    notFound()
  }

  const genderBadgeColor = GENDER_BADGE_COLORS[fitnessPlace.gender_policy || 'co-ed'] || GENDER_BADGE_COLORS['co-ed']
  const genderBadgeLabel = GENDER_LABELS[fitnessPlace.gender_policy || 'co-ed'] || 'Co-Ed'

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
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ExerciseGym',
            name: fitnessPlace.name,
            description: fitnessPlace.description || fitnessPlace.short_description,
            address: {
              '@type': 'PostalAddress',
              streetAddress: fitnessPlace.address,
              addressLocality: fitnessPlace.area,
              addressCountry: 'Goa'
            },
            geo: fitnessPlace.latitude
              ? {
                  '@type': 'GeoCoordinates',
                  latitude: fitnessPlace.latitude,
                  longitude: fitnessPlace.longitude
                }
              : undefined,
            telephone: fitnessPlace.phone,
            url: fitnessPlace.website,
            image: fitnessPlace.hero_image,
            openingHours: fitnessPlace.opening_hours
              ? Object.entries(fitnessPlace.opening_hours)
                  .map(([day, hours]: [string, any]) =>
                    hours.open !== 'Closed'
                      ? `${day.substring(0, 2)} ${hours.open}-${hours.close}`
                      : null
                  )
                  .filter(Boolean)
              : undefined,
            aggregateRating: fitnessPlace.google_rating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: fitnessPlace.google_rating,
                  reviewCount: fitnessPlace.google_review_count
                }
              : undefined
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/30" />
        {fitnessPlace.hero_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${fitnessPlace.hero_image})` }}
          />
        )}

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <FavoriteButton
            itemType="fitness"
            itemId={fitnessPlace.id}
            size="lg"
          />
          <AddToItineraryButton
            itemType="fitness"
            itemId={fitnessPlace.id}
            itemName={fitnessPlace.name}
            size="lg"
          />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <nav className="text-sm mb-4 opacity-80">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              {' / '}
              <Link href="/things-to-do/fitness" className="hover:underline">
                Fitness Centers
              </Link>
              {' / '}
              <span>{fitnessPlace.name}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{fitnessPlace.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Fitness Types */}
              {fitnessPlace.fitness_types && fitnessPlace.fitness_types.length > 0 && (
                <>
                  {fitnessPlace.fitness_types.slice(0, 3).map((type, index) => (
                    <span
                      key={index}
                      className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize"
                    >
                      {type.replace(/-/g, ' ')}
                    </span>
                  ))}
                </>
              )}

              {/* Gender Policy Badge */}
              {fitnessPlace.gender_policy && fitnessPlace.gender_policy !== 'co-ed' && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm border ${genderBadgeColor}`}>
                  <Users className="w-3 h-3 inline mr-1" />
                  {genderBadgeLabel}
                </span>
              )}

              {/* Location */}
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {fitnessPlace.area}, Goa
              </span>

              {/* BOK Score */}
              {fitnessPlace.bok_score && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {fitnessPlace.bok_score.toFixed(1)}/10
                </span>
              )}

              {/* Google Rating */}
              {fitnessPlace.google_rating && (
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <Star className="w-4 h-4 fill-white text-white" />
                  {fitnessPlace.google_rating.toFixed(1)} Google
                </span>
              )}
            </div>

            <p className="text-lg opacity-90 max-w-2xl">
              {fitnessPlace.short_description || fitnessPlace.description?.substring(0, 200)}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. About - Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">About {fitnessPlace.name}</h2>
              {fitnessPlace.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {fitnessPlace.description}
                </p>
              ) : (
                <p className="text-gray-500 italic">Description coming soon.</p>
              )}
            </div>

            {/* 2. What Visitors Say - Review Sentiment */}
            {fitnessPlace.review_sentiment && (
              <section className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2 text-blue-900">What Members Say</h2>
                    <p className="text-gray-700 leading-relaxed">{fitnessPlace.review_sentiment}</p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Fitness & Membership Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Membership & Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Schedule */}
                {fitnessPlace.class_schedule && (
                  <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-gray-500">Class Schedule</div>
                      <div className="font-medium">Available</div>
                    </div>
                  </div>
                )}

                {/* Trainer Certifications */}
                {fitnessPlace.trainer_certifications && fitnessPlace.trainer_certifications.length > 0 && (
                  <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                    <Award className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-gray-500">Trainer Certifications</div>
                      <div className="font-medium">
                        {fitnessPlace.trainer_certifications.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Classes */}
                {fitnessPlace.group_classes_available && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Group Classes Available</div>
                  </div>
                )}

                {/* Personal Training */}
                {fitnessPlace.personal_training_available && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Personal Training Available</div>
                  </div>
                )}

                {/* Pricing */}
                {fitnessPlace.pricing_summary && (
                  <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg col-span-full">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Pricing</div>
                      <div className="font-medium">{fitnessPlace.pricing_summary}</div>
                    </div>
                  </div>
                )}

                {/* Trial Session */}
                {fitnessPlace.trial_session_available && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Trial Session Available</div>
                  </div>
                )}

                {/* Day Pass */}
                {fitnessPlace.day_pass_available && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Day Pass Available</div>
                  </div>
                )}

                {/* 24 Hours */}
                {fitnessPlace.open_24_hours && (
                  <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div className="font-medium">Open 24 Hours</div>
                  </div>
                )}

                {/* Age Restrictions */}
                {fitnessPlace.age_restrictions && (
                  <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500">Age Policy</div>
                      <div className="font-medium">{fitnessPlace.age_restrictions}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Facilities & Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fitnessPlace.locker_rooms && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Locker Rooms</span>
                  </div>
                )}
                {fitnessPlace.showers && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Showers</span>
                  </div>
                )}
                {fitnessPlace.towel_service && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Towel Service</span>
                  </div>
                )}
                {fitnessPlace.equipment_rental && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Equipment Rental</span>
                  </div>
                )}
                {fitnessPlace.juice_bar && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Juice Bar</span>
                  </div>
                )}
                {fitnessPlace.wheelchair_accessible && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Accessibility className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Wheelchair Accessible</span>
                  </div>
                )}
                {fitnessPlace.parking_available && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <ParkingCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">Parking Available</span>
                  </div>
                )}
              </div>

              {/* Parking Info */}
              {fitnessPlace.parking_info && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">{fitnessPlace.parking_info}</div>
                </div>
              )}

              {/* Accessibility Info */}
              {fitnessPlace.accessibility_info && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">{fitnessPlace.accessibility_info}</div>
                </div>
              )}
            </div>

            {/* 5. Photo Gallery */}
            {fitnessPlace.images && fitnessPlace.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Photo Gallery</h2>
                  <span className="text-sm text-gray-500">({fitnessPlace.images.length} photos)</span>
                </div>
                <FitnessPhotoGallery
                  images={fitnessPlace.images}
                  fitnessPlaceName={fitnessPlace.name}
                />
              </div>
            )}

            {/* 6. Features & Amenities from IDs */}
            {((fitnessPlace.features && fitnessPlace.features.length > 0) || 
              (fitnessPlace.amenitiesResolved && fitnessPlace.amenitiesResolved.length > 0)) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Additional Features</h2>
                <div className="flex flex-wrap gap-2">
                  {fitnessPlace.features && fitnessPlace.features.map((feature: any) => (
                    <Badge
                      key={feature.id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 px-3 py-2 text-sm font-medium"
                    >
                      {feature.name}
                    </Badge>
                  ))}
                  {fitnessPlace.amenitiesResolved && fitnessPlace.amenitiesResolved.map((amenity: any) => (
                    <Badge
                      key={amenity.id}
                      variant="secondary"
                      className="bg-green-50 text-green-700 px-3 py-2 text-sm font-medium"
                    >
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Location Map */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              <LocationMap
                placeId={fitnessPlace.apify_output?.placeId || fitnessPlace.google_place_id}
                latitude={fitnessPlace.latitude}
                longitude={fitnessPlace.longitude}
                name={fitnessPlace.name}
                address={fitnessPlace.address || ''}
                className="w-full h-[450px]"
              />
              <div className="mt-4 flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{fitnessPlace.address}</p>
                  {fitnessPlace.area && (
                    <p className="text-sm text-gray-600">{fitnessPlace.area}, Goa</p>
                  )}
                  {/* Get Directions Button */}
                  {(fitnessPlace.latitude && fitnessPlace.longitude) && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fitnessPlace.latitude},${fitnessPlace.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* 8. FAQs */}
            {fitnessPlace.faqs && fitnessPlace.faqs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {fitnessPlace.faqs.map((faq: any) => (
                    <div key={faq.id} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* BOK Score Card */}
            {fitnessPlace.bok_score && (
              <FitnessBOKScoreCard
                bokScore={fitnessPlace.bok_score}
                bokScoreBreakdown={fitnessPlace.bok_score_breakdown}
                googleRating={fitnessPlace.google_rating}
                googleReviewCount={fitnessPlace.google_review_count}
                facebookRating={fitnessPlace.facebook_rating}
                facebookReviewCount={fitnessPlace.facebook_review_count}
                totalReviews={fitnessPlace.total_reviews_aggregated}
              />
            )}

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{fitnessPlace.address}</div>
                    <div className="text-sm text-gray-500">{fitnessPlace.area}, Goa</div>
                  </div>
                </div>
                {fitnessPlace.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${fitnessPlace.phone}`} className="text-blue-600 hover:underline">
                      {fitnessPlace.phone}
                    </a>
                  </div>
                )}
                {fitnessPlace.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${fitnessPlace.email}`} className="text-blue-600 hover:underline break-all">
                      {fitnessPlace.email}
                    </a>
                  </div>
                )}
                {fitnessPlace.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a
                      href={fitnessPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            {(normalizeSocialUrl(fitnessPlace.instagram, 'instagram') ||
              normalizeSocialUrl(fitnessPlace.facebook, 'facebook') ||
              normalizeSocialUrl(fitnessPlace.tiktok, 'tiktok') ||
              normalizeSocialUrl(fitnessPlace.youtube, 'youtube')) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {normalizeSocialUrl(fitnessPlace.instagram, 'instagram') && (
                    <a
                      href={normalizeSocialUrl(fitnessPlace.instagram, 'instagram')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white hover:opacity-80 transition"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(fitnessPlace.facebook, 'facebook') && (
                    <a
                      href={normalizeSocialUrl(fitnessPlace.facebook, 'facebook')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:opacity-80 transition"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(fitnessPlace.tiktok, 'tiktok') && (
                    <a
                      href={normalizeSocialUrl(fitnessPlace.tiktok, 'tiktok')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:opacity-80 transition"
                    >
                      <Music className="w-5 h-5" />
                    </a>
                  )}
                  {normalizeSocialUrl(fitnessPlace.youtube, 'youtube') && (
                    <a
                      href={normalizeSocialUrl(fitnessPlace.youtube, 'youtube')!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white hover:opacity-80 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {fitnessPlace.opening_hours && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Opening Hours</h3>
                <div className="space-y-2">
                  {Object.entries(fitnessPlace.opening_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="text-gray-600">
                        {hours.open === 'Closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {fitnessPlace.specialties && fitnessPlace.specialties.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Dumbbell className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-purple-900 mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {fitnessPlace.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Year Established */}
            {fitnessPlace.year_established && (
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Established</h3>
                    <p className="text-blue-800">{fitnessPlace.year_established}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}































