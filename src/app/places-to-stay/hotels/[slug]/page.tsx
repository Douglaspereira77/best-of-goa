import { notFound } from 'next/navigation';
import { getHotelBySlug } from '@/lib/queries/hotel';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Star,
  Instagram,
  Facebook,
  Clock,
  Navigation,
  Building2,
  Users,
  Bed,
  CalendarDays,
  PawPrint,
  Cigarette,
  CreditCard,
} from 'lucide-react';
import { HotelPhotoGallery } from '@/components/hotel/HotelPhotoGallery';
import { LocationMap } from '@/components/shared/LocationMap';
import { HOKScoreCard } from '@/components/hotel/HOKScoreCard';
import { normalizeSocialUrl } from '@/lib/utils';
import type { Metadata } from 'next';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface HotelPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: HotelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);

  if (!hotel) {
    return {
      title: 'Hotel Not Found',
      description: 'The hotel you are looking for could not be found.',
    };
  }

  const categoryNames = hotel.categories?.map((c) => c.name).join(', ') || '';
  const primaryImage = hotel.images?.find((p) => p.is_hero)?.url || hotel.hero_image;
  const starText = hotel.star_rating ? `${hotel.star_rating}-Star ` : '';

  // Check if AI-generated SEO metadata exists
  if (hotel.meta_title && hotel.meta_description) {
    // Remove " | Best of Goa" suffix if present (layout template adds it)
    let metaTitle = hotel.meta_title;
    metaTitle = metaTitle.replace(/\s*\|\s*Best of Goa$/i, '').replace(/\s*-\s*Best of Goa$/i, '');

    // Truncate to ~45 chars to stay under 60 with template suffix
    if (metaTitle.length > 45) {
      metaTitle = metaTitle.substring(0, 42) + '...';
    }

    return {
      title: metaTitle,
      description: hotel.meta_description,
      openGraph: {
        title: hotel.og_title || hotel.meta_title,
        description: hotel.og_description || hotel.meta_description,
        images: primaryImage ? [{ url: primaryImage }] : [],
        type: 'website',
        locale: 'en_KW',
        siteName: 'Best of Goa',
      },
      twitter: {
        card: 'summary_large_image',
        title: hotel.og_title || hotel.meta_title,
        description: hotel.og_description || hotel.meta_description,
        images: primaryImage ? [primaryImage] : [],
      },
      keywords: hotel.meta_keywords || [],
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: `https://www.bestofgoa.com/places-to-stay/hotels/${slug}`,
      },
    };
  }

  // Fallback to template-based metadata if AI metadata not available
  // Don't add "| Best of Goa" - layout template adds it automatically
  const categoryShort = categoryNames ? categoryNames.split(',')[0].trim() : 'Hotel';
  let title = `${hotel.name} - ${starText}${categoryShort} in ${hotel.area}`;

  // Truncate if too long (keep under 45 chars so total stays under 60 with suffix)
  if (title.length > 45) {
    title = `${hotel.name} in ${hotel.area}`;
    if (title.length > 45) {
      title = hotel.name.substring(0, 42) + '...';
    }
  }
  const description =
    hotel.short_description ||
    hotel.description?.substring(0, 160) ||
    `Stay at ${hotel.name}, a ${starText}${categoryNames} hotel in ${hotel.area}, Goa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: primaryImage ? [{ url: primaryImage }] : [],
      type: 'website',
      locale: 'en_KW',
      siteName: 'Best of Goa',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-stay/hotels/${slug}`,
    },
  };
}

export default async function HotelPage({ params }: HotelPageProps) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);

  if (!hotel) {
    notFound();
  }

  // Get primary image from images array or use hero_image
  const primaryImage = hotel.images?.find((p) => p.is_hero)?.url || hotel.hero_image;

  // Format hotel type for display
  const hotelTypeDisplay = hotel.hotel_type
    ? hotel.hotel_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  // Format smoking policy for display
  const smokingPolicyDisplay = hotel.smoking_policy
    ? hotel.smoking_policy.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  // Prepare breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.bestofgoa.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Places to Stay',
        item: 'https://www.bestofgoa.com/places-to-stay',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Hotels',
        item: 'https://www.bestofgoa.com/places-to-stay',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: hotel.name,
        item: `https://www.bestofgoa.com/places-to-stay/hotels/${hotel.slug}`,
      },
    ],
  };

  // Prepare Hotel Schema.org
  const hotelSchema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description || hotel.short_description,
    url: `https://www.bestofgoa.com/places-to-stay/hotels/${hotel.slug}`,
    image: primaryImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: hotel.area,
      addressCountry: 'KW',
    },
    geo: hotel.latitude &&
      hotel.longitude && {
        '@type': 'GeoCoordinates',
        latitude: hotel.latitude,
        longitude: hotel.longitude,
      },
    telephone: hotel.phone,
    email: hotel.email,
    starRating: hotel.star_rating && {
      '@type': 'Rating',
      ratingValue: hotel.star_rating,
      bestRating: 5,
    },
    aggregateRating: hotel.google_rating && {
      '@type': 'AggregateRating',
      ratingValue: hotel.google_rating,
      bestRating: 5,
      reviewCount: hotel.total_reviews_aggregated || hotel.google_review_count,
    },
    priceRange: hotel.price_range,
    checkinTime: hotel.check_in_time,
    checkoutTime: hotel.check_out_time,
    petsAllowed: hotel.pets_allowed,
    amenityFeature: hotel.amenities?.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
    })),
  };

  return (
    <>
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, hotelSchema], null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-96 bg-gray-900">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={hotel.name}
              fill
              className="object-cover opacity-70"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Floating Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            <FavoriteButton
              itemType="hotel"
              itemId={hotel.id}
              size="lg"
            />
            <AddToItineraryButton
              itemType="hotel"
              itemId={hotel.id}
              itemName={hotel.name}
              size="lg"
            />
          </div>

          {/* Hotel Name & Basic Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold mb-2">{hotel.name}</h1>
              {hotel.short_description && (
                <p className="text-lg text-gray-200 mb-4">{hotel.short_description}</p>
              )}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Star Rating */}
                {hotel.star_rating && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      {[...Array(hotel.star_rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}
                {/* BOK Score */}
                {hotel.bok_score && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{hotel.bok_score.toFixed(1)}/10</span>
                  </div>
                )}
                {/* Price Range */}
                {hotel.price_range && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="font-semibold">{hotel.price_range}</span>
                  </div>
                )}
                {/* Hotel Categories */}
                {hotel.categories && hotel.categories.length > 0 && (
                  <div className="flex gap-2">
                    {hotel.categories.map((category) => (
                      <span
                        key={category.id}
                        className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {hotel.description && (
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
                </section>
              )}

              {/* Review Sentiment */}
              {hotel.review_sentiment && (
                <section className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2 text-blue-900">What Guests Say</h2>
                      <p className="text-gray-700 leading-relaxed">{hotel.review_sentiment}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Rooms & Suites */}
              {hotel.room_types && hotel.room_types.length > 0 && (
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4">Rooms & Suites</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotel.room_types.map((room) => (
                      <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{room.name}</h3>
                          {room.base_rate && (
                            <span className="text-green-600 font-semibold">
                              {hotel.currency || 'KWD'} {room.base_rate}/night
                            </span>
                          )}
                        </div>
                        {room.description && (
                          <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {room.size_sqm && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {room.size_sqm} sqm
                            </span>
                          )}
                          {room.max_occupancy && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Up to {room.max_occupancy} guests
                            </span>
                          )}
                          {room.bed_configuration && (
                            <span className="flex items-center gap-1">
                              <Bed className="w-3 h-3" />
                              {room.bed_configuration}
                            </span>
                          )}
                          {room.view && <span>{room.view}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Amenities & Facilities */}
              {((hotel.amenities && hotel.amenities.length > 0) ||
                (hotel.facilities && hotel.facilities.length > 0)) && (
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4">Amenities & Facilities</h2>

                  {/* Amenities */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.map((amenity) => (
                          <span
                            key={amenity.id}
                            className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            {amenity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Facilities */}
                  {hotel.facilities && hotel.facilities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Facilities</h3>
                      <div className="flex flex-wrap gap-2">
                        {hotel.facilities.map((facility) => (
                          <span
                            key={facility.id}
                            className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            {facility.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Photo Gallery */}
              {hotel.images && hotel.images.length > 0 && (
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4">Photos ({hotel.images.length})</h2>
                  <HotelPhotoGallery photos={hotel.images} hotelName={hotel.name} />
                </section>
              )}

              {/* Location Map */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-4">Location</h2>
                <LocationMap
                  placeId={hotel.apify_output?.placeId}
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                  name={hotel.name}
                  address={hotel.address || ''}
                  className="w-full h-[450px]"
                />
                <div className="mt-4 flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{hotel.address}</p>
                    {hotel.area && <p className="text-sm text-gray-600">{hotel.area}</p>}
                    {hotel.neighborhood && (
                      <p className="text-sm text-blue-600 font-medium">{hotel.neighborhood.name}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* FAQs */}
              {hotel.faqs && hotel.faqs.length > 0 && (
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {hotel.faqs.map((faq) => (
                      <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-0">
                        <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* HOK Score Card */}
              {hotel.bok_score && (
                <HOKScoreCard
                  bokScore={hotel.bok_score}
                  bokScoreBreakdown={hotel.bok_score_breakdown}
                  starRating={hotel.star_rating}
                  googleRating={hotel.google_rating}
                  googleReviewCount={hotel.google_review_count}
                  tripadvisorRating={hotel.tripadvisor_rating}
                  tripadvisorReviewCount={hotel.tripadvisor_review_count}
                  bookingComRating={hotel.booking_com_rating}
                  bookingComReviewCount={hotel.booking_com_review_count}
                  totalReviews={hotel.total_reviews_aggregated}
                />
              )}

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {hotel.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-gray-900">{hotel.address}</p>
                        {hotel.area && <p className="text-sm text-gray-600">{hotel.area}</p>}
                        {hotel.neighborhood && (
                          <p className="text-sm text-blue-600 font-medium">
                            {hotel.neighborhood.name}
                          </p>
                        )}
                        {/* Get Directions Button */}
                        {hotel.latitude && hotel.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`}
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
                  )}

                  {hotel.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <a
                          href={`tel:${hotel.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {hotel.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {hotel.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a
                          href={`mailto:${hotel.email}`}
                          className="text-blue-600 hover:underline break-all"
                        >
                          {hotel.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {hotel.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Website</p>
                        <a
                          href={hotel.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Check-in/Check-out Times */}
                  {(hotel.check_in_time || hotel.check_out_time) && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Check-in / Check-out
                        </p>
                        <div className="space-y-1">
                          {hotel.check_in_time && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Check-in</span>
                              <span className="font-medium">
                                {typeof hotel.check_in_time === 'string'
                                  ? hotel.check_in_time.substring(0, 5)
                                  : hotel.check_in_time}
                              </span>
                            </div>
                          )}
                          {hotel.check_out_time && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Check-out</span>
                              <span className="font-medium">
                                {typeof hotel.check_out_time === 'string'
                                  ? hotel.check_out_time.substring(0, 5)
                                  : hotel.check_out_time}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {(normalizeSocialUrl(hotel.instagram, 'instagram') || normalizeSocialUrl(hotel.facebook, 'facebook') || normalizeSocialUrl(hotel.twitter, 'twitter') || normalizeSocialUrl(hotel.tiktok, 'tiktok')) && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Follow Us</p>
                      <div className="flex gap-3">
                        {normalizeSocialUrl(hotel.instagram, 'instagram') && (
                          <a
                            href={normalizeSocialUrl(hotel.instagram, 'instagram')!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-pink-600 transition-colors"
                          >
                            <Instagram className="w-6 h-6" />
                          </a>
                        )}
                        {normalizeSocialUrl(hotel.facebook, 'facebook') && (
                          <a
                            href={normalizeSocialUrl(hotel.facebook, 'facebook')!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Facebook className="w-6 h-6" />
                          </a>
                        )}
                        {normalizeSocialUrl(hotel.twitter, 'twitter') && (
                          <a
                            href={normalizeSocialUrl(hotel.twitter, 'twitter')!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-blue-400 transition-colors"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>
                        )}
                        {normalizeSocialUrl(hotel.tiktok, 'tiktok') && (
                          <a
                            href={normalizeSocialUrl(hotel.tiktok, 'tiktok')!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-black transition-colors"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {hotel.categories && hotel.categories.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {hotel.categories.map((category) => (
                          <span key={category.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hotelTypeDisplay && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Hotel Type</p>
                      <p className="text-sm text-gray-900">{hotelTypeDisplay}</p>
                    </div>
                  )}

                  {hotel.total_rooms && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Rooms</p>
                      <p className="text-sm text-gray-900">{hotel.total_rooms} rooms</p>
                    </div>
                  )}

                  {hotel.total_floors && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Floors</p>
                      <p className="text-sm text-gray-900">{hotel.total_floors} floors</p>
                    </div>
                  )}

                  {(hotel.year_opened || hotel.year_renovated) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        <CalendarDays className="w-4 h-4 inline mr-1" />
                        History
                      </p>
                      <div className="text-sm text-gray-900">
                        {hotel.year_opened && <p>Opened: {hotel.year_opened}</p>}
                        {hotel.year_renovated && <p>Last Renovated: {hotel.year_renovated}</p>}
                      </div>
                    </div>
                  )}

                  {hotel.average_nightly_rate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Average Rate
                      </p>
                      <p className="text-sm text-gray-900">
                        {hotel.currency || 'KWD'} {hotel.average_nightly_rate}/night
                      </p>
                    </div>
                  )}

                  {hotel.pets_allowed !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        <PawPrint className="w-4 h-4 inline mr-1" />
                        Pet Policy
                      </p>
                      <p className="text-sm text-gray-900">
                        {hotel.pets_allowed ? 'Pets Allowed' : 'No Pets Allowed'}
                      </p>
                    </div>
                  )}

                  {smokingPolicyDisplay && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        <Cigarette className="w-4 h-4 inline mr-1" />
                        Smoking Policy
                      </p>
                      <p className="text-sm text-gray-900">{smokingPolicyDisplay}</p>
                    </div>
                  )}

                  {hotel.cancellation_policy && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Cancellation Policy</p>
                      <p className="text-sm text-gray-900">{hotel.cancellation_policy}</p>
                    </div>
                  )}

                  {hotel.certifications && hotel.certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {hotel.certifications.map((cert, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {cert.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
