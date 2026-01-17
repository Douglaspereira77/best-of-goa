'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { ChevronRight, MapPin } from 'lucide-react';

const neighborhoods = [
    {
        name: 'Panjim',
        slug: 'panjim',
        description: 'Latin Quarter & Capital',
        image: '/images/destinations/goa-panjim.png',
    },
    {
        name: 'Anjuna',
        slug: 'anjuna',
        description: 'Bohemian & Cliffside Vibe',
        image: '/images/destinations/goa-anjuna.png',
    },
    {
        name: 'Assagao',
        slug: 'assagao',
        description: 'Premium Dining & Villas',
        image: '/images/destinations/goa-assagao.png',
    },
    {
        name: 'Calangute',
        slug: 'calangute',
        description: 'The Heart of Tourism',
        image: '/images/destinations/goa-calangute.png',
    },
    {
        name: 'Palolem',
        slug: 'palolem',
        description: 'Scenic South Paradise',
        image: '/images/destinations/goa-palolem.png',
    },
    {
        name: 'Old Goa',
        slug: 'old-goa',
        description: 'Historic Heritage Hub',
        image: '/images/destinations/goa-old-goa.png',
    },
];

export function Neighborhoods() {
    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-8 md:mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
                            Popular Neighborhoods
                        </h2>
                        <p className="text-gray-600 max-w-lg">
                            Explore the distinct vibes of Goa's most loved areas.
                        </p>
                    </div>
                    <Link
                        href="/places-to-visit"
                        className="hidden md:flex items-center text-amber-600 font-semibold hover:text-amber-700 transition-colors group"
                    >
                        View all areas
                        <ChevronRight className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                <div className="relative overflow-x-auto pb-4 md:overflow-visible scrollbar-hide">
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 min-w-[300px]">
                        {neighborhoods.map((area) => (
                            <Link key={area.name} href={`/places-to-visit/neighborhoods/${area.slug}`} className="w-[280px] md:w-auto flex-shrink-0">
                                <Card className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 relative aspect-[4/3] md:aspect-[16/10] rounded-2xl">
                                    <Image
                                        src={area.image}
                                        alt={area.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 280px, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-1 opacity-90">
                                                <MapPin className="w-4 h-4 text-amber-400" />
                                                <span className="text-sm font-medium tracking-wide uppercase">{area.slug === 'panjim' || area.slug === 'old-goa' ? 'Central' : 'Coastal'}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1">{area.name}</h3>
                                            <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                {area.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-6 md:hidden text-center">
                    <Link
                        href="/places-to-visit"
                        className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                    >
                        View all areas
                        <ChevronRight className="w-5 h-5 ml-1" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
