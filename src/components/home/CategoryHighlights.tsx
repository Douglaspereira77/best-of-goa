import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { AnimatedSection } from '@/components/home/AnimatedSection';

const categories = [
    {
        name: 'Restaurants & Cafés',
        slug: 'places-to-eat',
        description: 'From beach shacks to fine dining',
        image: '/images/categories/goa-restaurants.png',
    },
    {
        name: 'Beaches & Water Sports',
        slug: 'things-to-do',
        description: 'Beyond Baga and Calangute',
        image: '/images/categories/goa-beaches.png',
    },
    {
        name: 'Heritage & Culture',
        slug: 'places-to-visit',
        description: 'Portuguese mansions, churches, and museums',
        image: '/images/categories/goa-heritage.png',
    },
    {
        name: 'Nightlife & Entertainment',
        slug: 'things-to-do', // Assuming nightlife falls under things to do for now, or could be a new category
        description: 'Where the music actually matters',
        image: '/images/categories/goa-nightlife.png',
    },
    {
        name: 'Shopping',
        slug: 'places-to-shop',
        description: 'Markets, boutiques, and what to bring home',
        image: '/images/categories/goa-shopping.png',
    },
    {
        name: 'Services',
        slug: 'places-to-learn', // Mapping services to learn or similar for now if specific service category doesn't exist
        description: 'Everything from mechanics to yoga studios',
        image: '/images/categories/goa-services.png',
    },
];

export function CategoryHighlights() {
    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <AnimatedSection>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-4">
                            Explore by Category
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Dive into the best of what Goa has to offer, curated just for you.
                        </p>
                    </div>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {categories.map((category, index) => (
                        <AnimatedSection key={index} delay={index * 100}>
                            <Link href={`/${category.slug}`}>
                                <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full rounded-2xl bg-white">
                                    <div className="relative h-64 overflow-hidden">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                                    </div>
                                    <div className="p-6 md:p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-[#1e3a8a] group-hover:text-amber-600 transition-colors">
                                                {category.name}
                                            </h3>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors transform group-hover:translate-x-1" />
                                        </div>
                                        <p className="text-gray-600">
                                            {category.description}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
