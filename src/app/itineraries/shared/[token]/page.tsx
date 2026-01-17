'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Map,
  Download,
  MapPin,
  Star,
  ExternalLink,
  User,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  Dumbbell,
  GraduationCap,
} from 'lucide-react';

interface ItineraryItem {
  id: string;
  item_type: string;
  item_id: string;
  notes: string | null;
  sort_order: number;
  details: {
    name: string;
    slug: string;
    hero_image?: string;
    area: string;
    rating?: number;
  } | null;
}

interface SharedItinerary {
  id: string;
  title: string;
  description: string | null;
  items: ItineraryItem[];
  owner_name: string;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string; href: string }> = {
  restaurant: {
    icon: UtensilsCrossed,
    label: 'Restaurant',
    color: 'text-orange-600',
    href: '/places-to-eat',
  },
  hotel: {
    icon: Building2,
    label: 'Hotel',
    color: 'text-blue-600',
    href: '/places-to-stay/hotels',
  },
  mall: {
    icon: ShoppingBag,
    label: 'Mall',
    color: 'text-pink-600',
    href: '/places-to-shop/malls',
  },
  attraction: {
    icon: MapPin,
    label: 'Attraction',
    color: 'text-green-600',
    href: '/places-to-visit/attractions',
  },
  fitness: {
    icon: Dumbbell,
    label: 'Fitness',
    color: 'text-purple-600',
    href: '/things-to-do/fitness',
  },
  school: {
    icon: GraduationCap,
    label: 'School',
    color: 'text-cyan-600',
    href: '/places-to-learn/schools',
  },
};

export default function SharedItineraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [itinerary, setItinerary] = useState<SharedItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItinerary();
  }, [token]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(`/api/itineraries/shared/${token}`);
      if (response.ok) {
        const data = await response.json();
        setItinerary(data.itinerary);
      } else {
        setError('This itinerary is not available or has been made private.');
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setError('Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Itinerary Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/">Explore Goa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-8 print:bg-white print:text-black print:py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full print:hidden">
                <Map className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{itinerary.title}</h1>
                {itinerary.description && (
                  <p className="text-white/80 mt-1 print:text-gray-600">{itinerary.description}</p>
                )}
                <div className="flex items-center gap-2 text-white/60 text-sm mt-2 print:text-gray-500">
                  <User className="w-4 h-4" />
                  <span>Shared by {itinerary.owner_name}</span>
                  <span>-</span>
                  <span>
                    {itinerary.items.length} {itinerary.items.length === 1 ? 'place' : 'places'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="gap-1 print:hidden"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save PDF</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Items List */}
      <section className="container mx-auto px-4 py-8">
        {itinerary.items.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Empty Itinerary</CardTitle>
              <CardDescription>This itinerary doesn't have any places yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {itinerary.items.map((item, index) => {
              const config = CATEGORY_CONFIG[item.item_type];
              const Icon = config?.icon || MapPin;
              const href = item.details ? `${config?.href}/${item.details.slug}` : '#';

              return (
                <Card key={item.id} className="group print:shadow-none print:border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Index */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>

                      {/* Image */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden print:w-16 print:h-16">
                        {item.details?.hero_image ? (
                          <Image
                            src={item.details.hero_image}
                            alt={item.details?.name || 'Place'}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className={`w-8 h-8 ${config?.color || 'text-gray-400'}`} />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${config?.color || 'text-gray-500'}`}
                          >
                            {config?.label || item.item_type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {item.details?.name || 'Unknown Place'}
                        </h3>
                        {item.details?.area && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{item.details.area}</span>
                          </div>
                        )}
                        {item.details?.rating && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{item.details.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">"{item.notes}"</p>
                        )}
                      </div>

                      {/* View Link */}
                      <div className="print:hidden">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={href} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-gray-600 mb-4">Want to create your own itinerary?</p>
          <Button asChild>
            <Link href="/login">Sign Up for Free</Link>
          </Button>
        </div>
      </section>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-sm text-gray-500 py-4 border-t mt-8">
        Created with Best of Goa - bestofgoa.com
      </div>
    </div>
  );
}
