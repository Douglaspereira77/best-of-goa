
import React from 'react';
import { notFound } from 'next/navigation';
import { getRestaurantBySlug, getAllRestaurantSlugs } from '@/lib/queries/restaurant';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    ExternalLink, Instagram, Facebook, Globe, MapPin, Phone,
    Share2, Heart, Star, CheckCircle, Navigation, Play,
    Wifi, Car, Music, Utensils
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const revalidate = 3600;

export async function generateStaticParams() {
    const slugs = await getAllRestaurantSlugs();
    return slugs.map((slug) => ({ slug }));
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
        reviews
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
                                        <Image src="/google-logo.png" width={20} height={20} alt="Google" className="w-5 h-5" />
                                        <span className="text-sm font-medium text-slate-600">Verified Reviews</span>
                                    </div>
                                </div>

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

                    </div>

                    {/* 3. SIDEBAR (Right - 4 Columns) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Contact Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">

                            {/* Verified Badge */}
                            <div className="flex items-center gap-2 mb-6 bg-teal-50 text-teal-800 px-3 py-2 rounded-lg border border-teal-100">
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                                <span className="font-semibold text-sm">Best of Goa Verified</span>
                            </div>

                            <div className="space-y-6">
                                {/* Address */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h3>
                                    <p className="text-slate-700 font-medium leading-snug mb-3">{address}</p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 gap-2 font-semibold">
                                            <Navigation className="w-4 h-4" /> Get Directions
                                        </Button>
                                    </a>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100" />

                                {/* Contact Details */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact</h3>
                                    <div className="space-y-3">
                                        {phone && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="font-medium">Phone</span>
                                                </div>
                                                <a href={`tel:${phone}`} className="text-teal-600 font-semibold hover:underline">{phone}</a>
                                            </div>
                                        )}
                                        {website && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Globe className="w-4 h-4" />
                                                    <span className="font-medium">Website</span>
                                                </div>
                                                <a href={website} target="_blank" rel="noopener noreferrer" className="text-teal-600 font-semibold hover:underline truncate max-w-[150px]">Visit Site</a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100" />

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    {(menu_link || has_menu_extracted) && (
                                        <a href={menu_link || website || '#'} target="_blank" rel="noopener noreferrer" className="col-span-2">
                                            <Button variant="outline" className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-teal-600">
                                                <Utensils className="w-4 h-4" /> View Menu
                                            </Button>
                                        </a>
                                    )}
                                    {instagram && (
                                        <a href={instagram} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-pink-600">
                                                <Instagram className="w-4 h-4" /> Instagram
                                            </Button>
                                        </a>
                                    )}
                                    {facebook && (
                                        <a href={facebook} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600">
                                                <Facebook className="w-4 h-4" /> Facebook
                                            </Button>
                                        </a>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </main>
    );
}
