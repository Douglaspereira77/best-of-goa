'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
// import { AnimatedSection } from '@/components/home/AnimatedSection';

const destinations = [
    {
        name: 'North Goa',
        slug: 'north-goa',
        description: 'Electric atmosphere, vibrant nightlife, and heritage villas.',
        image: '/images/destinations/goa-north.png',
    },
    {
        name: 'South Goa',
        slug: 'south-goa',
        description: 'Serene beaches, luxury resorts, and untouched nature.',
        image: '/images/destinations/goa-south.png',
    },
    {
        name: 'Hinterland',
        slug: 'hinterland',
        description: 'Spice plantations, waterfalls, and eco-retreats.',
        image: '/images/destinations/goa-hinterland.png',
    },
];

export function Destinations() {
    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* <AnimatedSection> */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-[#1e3a8a] mb-6">
                        Choose Your Vibe
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Goa isn't just one place — it's many worlds in one. Where will you start?
                    </p>
                </div>
                {/* </AnimatedSection> */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {destinations.map((dest, index) => (
                        // <AnimatedSection key={dest.name} delay={index * 100}>
                        <Link key={dest.name} href={`/places-to-visit/regions/${dest.slug}`} className="group block h-full">
                            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-500">
                                <Image
                                    src={dest.image}
                                    alt={dest.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 opacity-90 group-hover:opacity-100 transition-opacity" />

                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                    <ArrowUpRight className="w-6 h-6 text-white" />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-3xl md:text-4xl font-bold mb-3">{dest.name}</h3>
                                    <p className="text-white/80 text-lg leading-relaxed max-w-xs">{dest.description}</p>
                                </div>
                            </div>
                        </Link>
                        // </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
