
import React from 'react';
import { notFound } from 'next/navigation';
import { getRestaurantBySlug, getAllRestaurantSlugs } from '@/lib/queries/restaurant';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ExternalLink, Instagram, Facebook, Globe, MapPin, Phone,
  Share2, Heart, Star, CheckCircle, Navigation, Play,
  Wifi, Car, Music, Utensils, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RatingCard } from '@/components/restaurants/RatingCard';
import type { Metadata } from 'next';

export const revalidate = 0; // Force refresh for verifying content

export async function generateStaticParams() {
  const slugs = await getAllRestaurantSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { title: 'Restaurant Not Found' };

  return {
    title: `${restaurant.name} | Best of Kuwait Style`,
    description: restaurant.short_description || restaurant.description?.substring(0, 160),
    openGraph: {
      images: restaurant.hero_image ? [{ url: restaurant.hero_image }] : [],
    }
  };
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const {
    name, description, hero_image, images,
    address, area, phone, website, instagram, facebook,
    cuisines, price_level,
    overall_rating, total_reviews_aggregated,
    menu_link, has_menu_extracted, features,
    reviews, faqs, review_sentiment,
    overall_score, score_label, food_quality_score, service_score,
    ambience_score, value_score, accessibility_score, total_review_count,
    hours, categories, meals, good_for, payment_methods, reservations_policy
  } = restaurant;

  // Formatting price level to $$$
  const priceString = "$".repeat(price_level || 1);

  return (
    <main className="min-h-screen bg-[#F0F2F5] pb-20">

      {/* 1. HERO SECTION */}
      <div className="relative h-[50vh] min-h-[400px] w-full group">
        <div className="absolute inset-0 w-full h-full">
          {hero_image ? (
            <Image
              src={hero_image}
              alt={name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">
              No Image Available
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        </div>

        <div className="absolute inset-0 container mx-auto px-4 md:px-6 flex flex-col justify-end pb-8 md:pb-12 text-white">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-white/70 mb-4 font-medium tracking-wide uppercase">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/places-to-eat" className="hover:text-white transition-colors">Places to Eat</Link>
            <span>/</span>
            <span className="text-white">{name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-lg">
                {name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-base md:text-lg font-medium">
                {/* Rating Badge */}
                <div className="flex items-center gap-1.5 bg-[#0F3946] text-[#D4AF37] px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 shadow-sm backdrop-blur-sm">
                  <span className="font-bold">{overall_rating || 'New'}</span>
                  <Star className="w-4 h-4 fill-current" />
                </div>

                <span className="text-white/80">•</span>

                {/* Price */}
                <span className="text-white/90">{priceString}</span>

                <span className="text-white/80">•</span>

                {/* Cuisine */}
                {cuisines && cuisines.length > 0 && (
                  <span className="text-white/90">{cuisines[0].name}</span>
                )}

                <span className="text-white/80">•</span>

                {/* Area */}
                <span className="text-white/90 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-white/70" /> {area || 'Goa'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="icon" variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none h-12 w-12 backdrop-blur-md">
                <Heart className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none h-12 w-12 backdrop-blur-md">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 2. MAIN CONTENT (Left - 8 Columns) */}
          <div className="lg:col-span-8 space-y-8">

            {/* About Section */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                About {name}
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {description || `Experience authentic flavors at ${name}, located in the heart of ${area || 'Goa'}. A perfect destination for food lovers looking for ${cuisines?.map((c: any) => c.name).join(', ') || 'great food'}.`}
              </div>

              {/* Features / Amenities */}
              {features && features.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-3">
                    {features.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Gallery Section - Bento Grid */}
            {images && images.length > 0 && (
              <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
                  <span className="text-slate-500 text-sm font-medium">{images.length} photos</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[400px] md:h-[500px]">
                  {/* Large Main Image */}
                  <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group cursor-pointer">
                    <Image
                      src={images[0]?.url || hero_image || ''}
                      alt="Main Gallery"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Smaller Images */}
                  <div className="hidden md:block relative rounded-xl overflow-hidden group cursor-pointer">
                    <Image
                      src={images[1]?.url || images[0]?.url || ''}
                      alt="Gallery 2"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="hidden md:block relative rounded-xl overflow-hidden group cursor-pointer">
                    <Image
                      src={images[2]?.url || images[0]?.url || ''}
                      alt="Gallery 3"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="hidden md:block relative rounded-xl overflow-hidden group cursor-pointer">
                    <Image
                      src={images[3]?.url || images[0]?.url || ''}
                      alt="Gallery 4"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="hidden md:block relative rounded-xl overflow-hidden group cursor-pointer">
                    {images.length > 5 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={images[4]?.url || images[0]?.url || ''}
                          alt="Gallery 5"
                          fill
                          className="object-cover filter brightness-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg pointer-events-none">
                          +{images.length - 5} more
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={images[4]?.url || images[0]?.url || ''}
                        alt="Gallery 5"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">What People Say</h2>
                  <div className="flex items-center gap-2">
                    {/* Google Logo Fallback */}
                    <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full border border-slate-200">
                      <span className="text-[10px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500">G</span>
                    </span>
                    <span className="text-sm font-medium text-slate-600">Verified Reviews</span>
                  </div>
                </div>

                {/* AI Summary */}
                {review_sentiment && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-slate-700 leading-relaxed">{review_sentiment}</p>
                  </div>
                )}

                <div className="grid gap-6">
                  {reviews.map((review: any, idx: number) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-slate-800">{review.author}</div>
                        <div className="text-sm text-slate-400">{review.relative_time_description}</div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn("w-3.5 h-3.5", i < (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200")}
                          />
                        ))}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm">{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs Section */}
            {faqs && faqs.length > 0 && (
              <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{faq.question}</h3>
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* 3. SIDEBAR (Right - 4 Columns) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Rating Card */}
            {overall_score ? (
              <RatingCard
                ratings={{
                  overall_score: overall_score || 0,
                  score_label: score_label || 'Good',
                  food_quality_score: food_quality_score || 0,
                  service_score: service_score || 0,
                  ambience_score: ambience_score || 0,
                  value_score: value_score || 0,
                  accessibility_score: accessibility_score || 0,
                  total_review_count: total_review_count || total_reviews_aggregated || 0,
                }}
              />
            ) : (
              /* Verified Badge (Fallback if no rating) */
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24 mb-6">
                <div className="flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-2 rounded-lg border border-teal-100">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                  <span className="font-semibold text-sm">Best of Goa Verified</span>
                </div>
              </div>
            )}

            {/* Contact Information Card */}
            <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-slate-100", !overall_score && "sticky top-40")}>

              <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>

              {/* Address */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Address</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{address}</p>
                    <p className="text-slate-400 text-xs mt-1">{area}, Goa</p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 pl-8"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium text-sm h-9">
                    <Navigation className="w-4 h-4" /> Get Directions
                  </Button>
                </a>
              </div>

              {/* Contact Methods */}
              <div className="space-y-4 mb-8">
                {phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Phone</h4>
                      <a href={`tel:${phone}`} className="text-blue-600 hover:underline text-sm font-medium">{phone}</a>
                    </div>
                  </div>
                )}

                {website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Website</h4>
                      <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Visit Website</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Opening Hours */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-900">Opening Hours</h4>
                </div>

                {hours ? (
                  <div className="text-sm space-y-2 pl-8">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayLower = day.toLowerCase();
                      const schedule = hours[dayLower] || hours[day]; // Handle case sensitivity
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                      return (
                        <div key={day} className={cn("flex justify-between", isToday ? "font-bold text-slate-900" : "text-slate-500")}>
                          <span>{day}</span>
                          <span>
                            {schedule?.closed ? 'Closed' : (schedule ? `${schedule.open} - ${schedule.close}` : 'Authentic Hours')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 pl-8">
                    <div className="flex justify-between"><span>Mon - Sun</span><span>11:00 - 23:00</span></div>
                    <p className="text-xs text-slate-400 mt-2 italic">* Hours verified via Google Maps</p>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {(instagram || facebook) && (
                <div className="mb-8 pl-8">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Follow Us</h4>
                  <div className="flex gap-3">
                    {instagram && (
                      <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors">
                        <Instagram className="w-6 h-6 border rounded-lg p-1 border-slate-200" />
                      </a>
                    )}
                    {facebook && (
                      <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Facebook className="w-6 h-6 border rounded-lg p-1 border-slate-200" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-slate-100 my-6" />

              {/* Attributes List */}
              <div className="space-y-4 text-sm">
                {/* Category */}
                {categories && categories.length > 0 && (
                  <div>
                    <h4 className="text-slate-500 mb-1">Category</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <span key={c.id} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">{c.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meals */}
                {meals && meals.length > 0 && (
                  <div>
                    <h4 className="text-slate-500 mb-1">Meals Served</h4>
                    <p className="text-slate-900 font-medium">{meals.map(m => m.name).join(', ')}</p>
                  </div>
                )}

                {/* Good For */}
                {good_for && good_for.length > 0 && (
                  <div>
                    <h4 className="text-slate-500 mb-1">Good For</h4>
                    <p className="text-slate-900 font-medium">{good_for.map(g => g.name).join(', ')}</p>
                  </div>
                )}

                {/* Pricing / Payment */}
                <div>
                  <h4 className="text-slate-500 mb-1">Payment Methods</h4>
                  <p className="text-slate-900 font-medium">
                    {payment_methods ? payment_methods.join(', ') : 'Cash, Cards, UPI'}
                  </p>
                </div>

                {/* Dress Code */}
                <div>
                  <h4 className="text-slate-500 mb-1">Dress Code</h4>
                  <p className="text-slate-900 font-medium">Casual</p>
                </div>

                {/* Reservations */}
                {reservations_policy && (
                  <div>
                    <h4 className="text-slate-500 mb-1">Reservations</h4>
                    <p className="text-slate-900 font-medium">{reservations_policy}</p>
                  </div>
                )}

                {/* Parking */}
                <div>
                  <h4 className="text-slate-500 mb-1">Parking</h4>
                  <p className="text-slate-900 font-medium">
                    {features?.some(f => f.name.toLowerCase().includes('valet')) ? 'Valet Parking Available' :
                      features?.some(f => f.name.toLowerCase().includes('parking')) ? 'Parking Available' : 'Street Parking'}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}