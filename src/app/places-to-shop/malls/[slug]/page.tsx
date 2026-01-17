import { notFound } from 'next/navigation';
import { getMallBySlug } from '@/lib/queries/mall';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Globe,
  Star,
  Instagram,
  Facebook,
  Clock,
  Store,
  ParkingCircle,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { MallPhotoGallery } from '@/components/mall/MallPhotoGallery';
import { MallBOKScoreCard } from '@/components/mall/MallBOKScoreCard';
import { LocationMap } from '@/components/shared/LocationMap';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Navigation } from 'lucide-react';
import { normalizeSocialUrl } from '@/lib/utils';
import type { Metadata } from 'next';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

interface MallPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MallPageProps): Promise<Metadata> {
  const { slug } = await params;
  const mall = await getMallBySlug(slug);

  if (!mall) {
    return {
      title: 'Mall Not Found',
      description: 'The mall you are looking for could not be found.',
    };
  }

  const categoryNames = mall.categories?.map((c) => c.name).join(', ') || 'Shopping Mall';
  const primaryImage = mall.images?.find((p) => p.is_hero)?.url || mall.hero_image;

  // Check if AI-generated SEO metadata exists
  if (mall.meta_title && mall.meta_description) {
    // Remove " | Best of Goa" suffix if present (layout template adds it)
    let metaTitle = mall.meta_title;
    metaTitle = metaTitle.replace(/\s*\|\s*Best of Goa$/i, '').replace(/\s*-\s*Best of Goa$/i, '');

    // Truncate to ~45 chars to stay under 60 with template suffix
    if (metaTitle.length > 45) {
      metaTitle = metaTitle.substring(0, 42) + '...';
    }

    return {
      title: metaTitle,
      description: mall.meta_description,
      openGraph: {
        title: mall.og_title || mall.meta_title,
        description: mall.og_description || mall.meta_description,
        images: primaryImage ? [{ url: primaryImage }] : [],
        type: 'website',
        locale: 'en_KW',
        siteName: 'Best of Goa',
      },
      twitter: {
        card: 'summary_large_image',
        title: mall.og_title || mall.meta_title,
        description: mall.og_description || mall.meta_description,
        images: primaryImage ? [primaryImage] : [],
      },
      keywords: mall.meta_keywords || [],
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: `https://www.bestofgoa.com/places-to-shop/malls/${slug}`,
      },
    };
  }

  // Fallback to template-based metadata
  // Don't add "| Best of Goa" - layout template adds it automatically
  const categoryShort = categoryNames.split(',')[0].trim();
  let title = `${mall.name} - ${categoryShort} in ${mall.area}`;

  // Truncate if too long (keep under 45 chars so total stays under 60 with suffix)
  if (title.length > 45) {
    title = `${mall.name} in ${mall.area}`;
    if (title.length > 45) {
      title = mall.name.substring(0, 42) + '...';
    }
  }
  const description =
    mall.short_description ||
    mall.description?.substring(0, 160) ||
    `Visit ${mall.name}, a ${categoryNames} in ${mall.area}, Goa. ${mall.total_stores ? `Features ${mall.total_stores} stores.` : ''}`;

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
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-shop/malls/${slug}`,
    },
  };
}

export default async function MallPage({ params }: MallPageProps) {
  const { slug } = await params;
  const mall = await getMallBySlug(slug);

  if (!mall) {
    notFound();
  }

  // Get primary image
  const primaryImage = mall.images?.find((p) => p.is_hero)?.url || mall.hero_image;

  // Format mall type for display
  const mallTypeDisplay = mall.mall_type
    ? mall.mall_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  // Format operating hours
  const formatTime = (time: string | undefined) => {
    if (!time) return null;
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

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
        name: 'Places to Shop',
        item: 'https://www.bestofgoa.com/places-to-shop',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: mall.name,
        item: `https://www.bestofgoa.com/places-to-shop/malls/${slug}`,
      },
    ],
  };

  // Prepare shopping center schema
  const mallSchema = {
    '@context': 'https://schema.org',
    '@type': 'ShoppingCenter',
    name: mall.name,
    description: mall.description || mall.short_description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: mall.address,
      addressLocality: mall.area,
      addressCountry: 'KW',
    },
    geo: mall.latitude && mall.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: mall.latitude,
      longitude: mall.longitude,
    } : undefined,
    telephone: mall.phone,
    url: mall.website,
    image: primaryImage,
    aggregateRating: mall.google_rating ? {
      '@type': 'AggregateRating',
      ratingValue: mall.google_rating,
      reviewCount: mall.google_review_count || 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mallSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative h-[400px] bg-gray-900">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={mall.name}
              fill
              className="object-cover opacity-70"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Floating Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            <FavoriteButton
              itemType="mall"
              itemId={mall.id}
              size="lg"
            />
            <AddToItineraryButton
              itemType="mall"
              itemId={mall.id}
              itemName={mall.name}
              size="lg"
            />
          </div>

          <div className="relative container mx-auto px-4 h-full flex items-end pb-12">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="mb-4">
                <Breadcrumbs
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Places to Shop', href: '/places-to-shop' },
                    { label: mall.name },
                  ]}
                  className="text-gray-300 [&_a]:text-gray-300 [&_a:hover]:text-white [&_span]:text-white"
                />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {mall.name}
              </h1>

              {mall.short_description && (
                <p className="text-lg text-gray-200 mb-4 max-w-2xl">
                  {mall.short_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-white">
                {/* BOK Score */}
                {mall.bok_score && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{mall.bok_score.toFixed(1)}/10</span>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  <span>{mall.area}</span>
                </div>

                {/* Mall Type */}
                {mallTypeDisplay && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {mallTypeDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* 1. About */}
              {mall.description && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4">About {mall.name}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {mall.description}
                  </p>
                </div>
              )}

              {/* 2. What Visitors Say */}
              {mall.review_sentiment && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2 text-blue-900">What Visitors Say</h2>
                      <p className="text-gray-700 leading-relaxed">{mall.review_sentiment}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mall.total_stores && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Store className="w-5 h-5" />
                      <span className="text-sm font-medium">Stores</span>
                    </div>
                    <div className="text-2xl font-bold">{mall.total_stores}</div>
                  </div>
                )}
                {mall.total_floors && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Store className="w-5 h-5" />
                      <span className="text-sm font-medium">Floors</span>
                    </div>
                    <div className="text-2xl font-bold">{mall.total_floors}</div>
                  </div>
                )}
                {mall.total_parking_spaces && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <ParkingCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Parking</span>
                    </div>
                    <div className="text-2xl font-bold">{mall.total_parking_spaces.toLocaleString()}</div>
                  </div>
                )}
                {mall.year_opened && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium">Opened</span>
                    </div>
                    <div className="text-2xl font-bold">{mall.year_opened}</div>
                  </div>
                )}
              </div>

              {/* 4. Photo Gallery */}
              {mall.images && mall.images.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4">Photo Gallery</h2>
                  <MallPhotoGallery photos={mall.images} mallName={mall.name} />
                </div>
              )}

              {/* 5. Special Features Badges */}
              {mall.special_features && mall.special_features.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4 text-purple-900">Special Features</h2>
                  <div className="flex flex-wrap gap-3">
                    {mall.special_features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-purple-200"
                      >
                        🎯 {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Categories & Amenities Combined */}
              {((mall.categories && mall.categories.length > 0) || (mall.amenities && mall.amenities.length > 0)) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4">Categories & Amenities</h2>
                  
                  {mall.categories && mall.categories.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">CATEGORIES</h3>
                      <div className="flex flex-wrap gap-2">
                        {mall.categories.map((category) => (
                          <span
                            key={category.id}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {mall.amenities && mall.amenities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">AMENITIES</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {mall.amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-gray-700 text-sm">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Parking Information */}
              {(mall.parking_type || mall.valet_parking || mall.parking_fee || mall.ev_charging_stations || mall.total_parking_spaces) && (
                <div className="bg-green-50 border border-green-100 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ParkingCircle className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-green-900">Parking Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mall.total_parking_spaces && (
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 font-bold">•</div>
                        <div>
                          <div className="font-semibold text-gray-900">Capacity</div>
                          <div className="text-gray-700">{mall.total_parking_spaces.toLocaleString()} spaces</div>
                        </div>
                      </div>
                    )}
                    {mall.parking_type && (
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 font-bold">•</div>
                        <div>
                          <div className="font-semibold text-gray-900">Type</div>
                          <div className="text-gray-700 capitalize">{mall.parking_type.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    )}
                    {mall.parking_fee && (
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 font-bold">•</div>
                        <div>
                          <div className="font-semibold text-gray-900">Fee</div>
                          <div className="text-gray-700 capitalize">{mall.parking_fee.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    )}
                    {mall.valet_parking && (
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 font-bold">•</div>
                        <div>
                          <div className="font-semibold text-gray-900">Valet Service</div>
                          <div className="text-gray-700">Available</div>
                        </div>
                      </div>
                    )}
                    {mall.ev_charging_stations && mall.ev_charging_stations > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 font-bold">•</div>
                        <div>
                          <div className="font-semibold text-gray-900">EV Charging</div>
                          <div className="text-gray-700">{mall.ev_charging_stations} stations</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 8. Anchor Stores */}
              {mall.anchor_stores && mall.anchor_stores.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4">Anchor Stores</h2>
                  <div className="flex flex-wrap gap-2">
                    {mall.anchor_stores.map((store) => (
                      <span
                        key={store.id}
                        className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        {store.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Location Map */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <LocationMap
                  placeId={mall.google_place_id}
                  latitude={mall.latitude}
                  longitude={mall.longitude}
                  name={mall.name}
                  address={mall.address}
                  className="w-full h-[450px]"
                />
                <div className="mt-4 flex items-start gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{mall.address}</p>
                    {mall.area && (
                      <p className="text-sm text-gray-600">{mall.area}, Goa</p>
                    )}
                    {(mall.latitude && mall.longitude) && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${mall.latitude},${mall.longitude}`}
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
              </div>

              {/* 10. FAQs */}
              {mall.faqs && mall.faqs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {mall.faqs.map((faq) => (
                      <div key={faq.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact & Hours */}
            <div className="space-y-6">
              {/* BOK Score Card */}
              {mall.bok_score && (
                <MallBOKScoreCard
                  bokScore={mall.bok_score}
                  bokScoreBreakdown={mall.bok_score_breakdown}
                  googleRating={mall.google_rating}
                  googleReviewCount={mall.google_review_count}
                  tripadvisorRating={mall.tripadvisor_rating}
                  tripadvisorReviewCount={mall.tripadvisor_review_count}
                  totalReviews={mall.total_reviews_aggregated}
                />
              )}

              {/* Contact Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {mall.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{mall.address}</span>
                    </div>
                  )}
                  {mall.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <a href={`tel:${mall.phone}`} className="text-blue-600 hover:underline">
                        {mall.phone}
                      </a>
                    </div>
                  )}
                  {mall.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <a
                        href={mall.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {mall.latitude && mall.longitude && (
                    <div className="pt-3 border-t border-gray-200">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${mall.latitude},${mall.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <MapPin className="w-4 h-4" />
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Operating Hours */}
              {(mall.weekday_open_time || mall.weekend_open_time) && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Operating Hours</h3>
                  <div className="space-y-2">
                    {mall.weekday_open_time && mall.weekday_close_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sat - Thu</span>
                        <span className="font-medium">
                          {formatTime(mall.weekday_open_time)} - {formatTime(mall.weekday_close_time)}
                        </span>
                      </div>
                    )}
                    {mall.friday_open_time && mall.friday_close_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Friday</span>
                        <span className="font-medium">
                          {formatTime(mall.friday_open_time)} - {formatTime(mall.friday_close_time)}
                        </span>
                      </div>
                    )}
                    {mall.ramadan_hours && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-sm text-gray-500">Ramadan Hours: </span>
                        <span className="text-sm">{mall.ramadan_hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(normalizeSocialUrl(mall.instagram, 'instagram') || normalizeSocialUrl(mall.facebook, 'facebook') || normalizeSocialUrl(mall.twitter, 'twitter')) && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {normalizeSocialUrl(mall.instagram, 'instagram') && (
                      <a
                        href={normalizeSocialUrl(mall.instagram, 'instagram')!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {normalizeSocialUrl(mall.facebook, 'facebook') && (
                      <a
                        href={normalizeSocialUrl(mall.facebook, 'facebook')!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
