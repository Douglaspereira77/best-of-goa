
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
  Ticket,
  Users,
  Camera,
  Accessibility,
  ParkingCircle,
  Info,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Music
} from 'lucide-react'
import { LocationMap } from '@/components/shared/LocationMap'
import { AttractionBOKScoreCard } from '@/components/attraction/AttractionBOKScoreCard'
import { AttractionCard } from '@/components/attraction/AttractionCard'
import {
  getAttractionDetails,
  getNearbyAttractions,
  getAttractionsByCategorySlug
} from '@/lib/queries/places-to-visit'

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const attraction = await getAttractionDetails(slug)

  if (!attraction) {
    return {
      title: 'Attraction Not Found | Best of Goa',
      description: 'The requested attraction could not be found.'
    }
  }

  return {
    title: attraction.meta_title || `${attraction.name} | Best of Goa`,
    description:
      attraction.meta_description ||
      attraction.short_description ||
      `Visit ${attraction.name} in ${attraction.area}, Goa`,
    keywords: attraction.meta_keywords || [],
    openGraph: {
      title: attraction.og_title || attraction.meta_title || attraction.name,
      description:
        attraction.og_description || attraction.meta_description || attraction.short_description,
      images: attraction.hero_image ? [attraction.hero_image] : [],
      type: 'website'
    }
  }
}

export default async function AttractionPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const attraction = await getAttractionDetails(slug)

  if (!attraction) {
    notFound()
  }

  // Fetch related content
  const [nearbyAttractions, relatedAttractions] = await Promise.all([
    getNearbyAttractions(attraction.area, attraction.id, 3),
    attraction.categories?.[0]
      ? getAttractionsByCategorySlug(attraction.categories[0].slug, 4).then(res =>
        res.filter((a: any) => a.id !== attraction.id).slice(0, 3)
      )
      : Promise.resolve([])
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TouristAttraction',
            name: attraction.name,
            description: attraction.description || attraction.short_description,
            address: {
              '@type': 'PostalAddress',
              streetAddress: attraction.address,
              addressLocality: attraction.area,
              addressCountry: 'India',
              addressRegion: 'Goa'
            },
            geo: attraction.latitude
              ? {
                '@type': 'GeoCoordinates',
                latitude: attraction.latitude,
                longitude: attraction.longitude
              }
              : undefined,
            telephone: attraction.phone,
            url: attraction.website,
            image: attraction.hero_image,
            aggregateRating: attraction.google_rating
              ? {
                '@type': 'AggregateRating',
                ratingValue: attraction.google_rating,
                reviewCount: attraction.google_review_count
              }
              : undefined
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/30" />
        {attraction.hero_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${attraction.hero_image})` }}
          />
        )}

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <FavoriteButton
            itemType="attraction"
            itemId={attraction.id}
            size="lg"
          />
          <AddToItineraryButton
            itemType="attraction"
            itemId={attraction.id}
            itemName={attraction.name}
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
              <Link href="/places-to-visit" className="hover:underline">
                Places to Visit
              </Link>
              {' / '}
              <span>{attraction.name}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{attraction.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              {attraction.attraction_type && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize">
                  {attraction.attraction_type.replace(/_/g, ' ')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {attraction.area}, Goa
              </span>
              {attraction.google_rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {attraction.google_rating.toFixed(1)} ({attraction.google_review_count} reviews)
                </span>
              )}
            </div>

            <p className="text-lg opacity-90 max-w-2xl">
              {attraction.short_description || attraction.description?.substring(0, 200)}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">About {attraction.name}</h2>
              <div className="prose max-w-none">
                {attraction.description ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {attraction.description}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">Description coming soon.</p>
                )}
              </div>
            </div>

            {/* Review Sentiment */}
            {attraction.review_sentiment && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2 text-blue-900">What Visitors Say</h2>
                    <p className="text-gray-700 leading-relaxed">{attraction.review_sentiment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Features & Amenities */}
            {attraction.amenities && attraction.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Features & Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {attraction.amenities.map((amenity: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {attraction.images && attraction.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">Photo Gallery</h2>
                  <span className="text-sm text-gray-500">({attraction.images.length} photos)</span>
                </div>
                <AttractionPhotoGallery
                  images={attraction.images}
                  attractionName={attraction.name}
                />
              </div>
            )}

            {/* Reviews */}
            {attraction.reviews && attraction.reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-2xl font-bold">Visitor Reviews</h2>
                  <span className="text-sm text-gray-500">
                    ({attraction.reviews.length} reviews)
                  </span>
                </div>
                <div className="space-y-4">
                  {attraction.reviews
                    .filter((review: any) => review.review_text && review.review_text.trim())
                    .slice(0, 10)
                    .map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">{review.author_name}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.source && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                              {review.source}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                        {review.review_date && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.review_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Key Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Visitor Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {attraction.typical_visit_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="font-medium">{attraction.typical_visit_duration}</div>
                    </div>
                  </div>
                )}
                {attraction.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Capacity</div>
                      <div className="font-medium">{attraction.capacity.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                {attraction.age_suitability && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Suitable For</div>
                      <div className="font-medium capitalize">
                        {attraction.age_suitability.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Admission</div>
                    <div className="font-medium">
                      {attraction.is_free
                        ? 'Free Entry'
                        : attraction.admission_fee
                          ? `${attraction.admission_fee} KWD`
                          : 'Contact for info'}
                    </div>
                  </div>
                </div>
                {attraction.wheelchair_accessible && (
                  <div className="flex items-center gap-2">
                    <Accessibility className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Wheelchair Accessible</div>
                  </div>
                )}
                {attraction.parking_available && (
                  <div className="flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Parking Available</div>
                  </div>
                )}
                {attraction.photography_allowed && (
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    <div className="font-medium">Photography Allowed</div>
                  </div>
                )}
              </div>
            </div>

            {/* FAQs */}
            {attraction.faqs && attraction.faqs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {attraction.faqs.map((faq: any) => (
                    <div key={faq.id} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              <LocationMap
                placeId={attraction.google_place_id}
                latitude={attraction.latitude}
                longitude={attraction.longitude}
                name={attraction.name}
                address={attraction.address}
                className="w-full h-[450px]"
              />
              <div className="mt-4 flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{attraction.address}</p>
                  <p className="text-sm text-gray-600">{attraction.area}, Goa</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* BOK Score Card */}
            {attraction.bok_score && (
              <AttractionBOKScoreCard
                bokScore={attraction.bok_score}
                bokScoreBreakdown={attraction.bok_score_breakdown}
                googleRating={attraction.google_rating}
                googleReviewCount={attraction.google_review_count}
                tripadvisorRating={attraction.tripadvisor_rating}
                tripadvisorReviewCount={attraction.tripadvisor_review_count}
                totalReviews={attraction.total_reviews_aggregated || attraction.google_review_count}
              />
            )}
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">{attraction.address}</div>
                    <div className="text-sm text-gray-500">{attraction.area}, Goa</div>
                  </div>
                </div>
                {attraction.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${attraction.phone}`} className="text-blue-600 hover:underline">
                      {attraction.phone}
                    </a>
                  </div>
                )}
                {attraction.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${attraction.email}`} className="text-blue-600 hover:underline">
                      {attraction.email}
                    </a>
                  </div>
                )}
                {attraction.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a
                      href={attraction.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            {(attraction.instagram || attraction.facebook || attraction.tiktok) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {attraction.instagram && (
                    <a
                      href={attraction.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white hover:opacity-80 transition"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {attraction.facebook && (
                    <a
                      href={attraction.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:opacity-80 transition"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {attraction.tiktok && (
                    <a
                      href={attraction.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:opacity-80 transition"
                    >
                      <Music className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {attraction.opening_hours && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Opening Hours</h3>
                <div className="space-y-2">
                  {Object.entries(attraction.opening_hours).map(([day, hours]: [string, any]) => (
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

            {/* Best Time to Visit */}
            {attraction.best_time_to_visit && (
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Best Time to Visit</h3>
                    <p className="text-blue-800">{attraction.best_time_to_visit}</p>
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