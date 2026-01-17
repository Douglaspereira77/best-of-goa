'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from '@/components/user/FavoriteButton';
import {
  Heart,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  MapPin,
  Dumbbell,
  GraduationCap,
  Star,
  ArrowRight
} from 'lucide-react';

interface FavoriteItem {
  id: string;
  item_type: string;
  item_id: string;
  created_at: string;
  item: {
    name: string;
    slug: string;
    hero_image?: string;
    area: string;
    rating?: number;
  } | null;
}

const CATEGORY_CONFIG = {
  restaurant: {
    icon: UtensilsCrossed,
    label: 'Restaurants',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    href: '/places-to-eat',
  },
  hotel: {
    icon: Building2,
    label: 'Hotels',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    href: '/places-to-stay/hotels',
  },
  mall: {
    icon: ShoppingBag,
    label: 'Malls',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    href: '/places-to-shop/malls',
  },
  attraction: {
    icon: MapPin,
    label: 'Attractions',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    href: '/places-to-visit/attractions',
  },
  fitness: {
    icon: Dumbbell,
    label: 'Fitness',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    href: '/things-to-do/fitness',
  },
  school: {
    icon: GraduationCap,
    label: 'Schools',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    href: '/places-to-learn/schools',
  },
};

type CategoryType = keyof typeof CATEGORY_CONFIG;

function FavoriteCard({ favorite, onRemove }: { favorite: FavoriteItem; onRemove: () => void }) {
  const config = CATEGORY_CONFIG[favorite.item_type as CategoryType];
  const Icon = config?.icon || Heart;

  if (!favorite.item) {
    return null;
  }

  const href = `${config?.href}/${favorite.item.slug}`;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-40 bg-gray-200">
        {favorite.item.hero_image ? (
          <Image
            src={favorite.item.hero_image}
            alt={favorite.item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Icon className={`w-12 h-12 ${config?.color || 'text-gray-400'}`} />
          </div>
        )}

        {/* Favorite Button */}
        <FavoriteButton
          itemType={favorite.item_type as 'restaurant' | 'hotel' | 'mall' | 'attraction' | 'fitness' | 'school'}
          itemId={favorite.item_id}
          className="absolute top-2 right-2"
          size="sm"
        />

        {/* Category Badge */}
        <div className={`absolute bottom-2 left-2 ${config?.bgColor || 'bg-gray-100'} rounded-full px-2 py-1 flex items-center gap-1`}>
          <Icon className={`w-3 h-3 ${config?.color || 'text-gray-600'}`} />
          <span className={`text-xs font-medium ${config?.color || 'text-gray-600'}`}>
            {config?.label || favorite.item_type}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={href} className="group/link">
          <h3 className="font-semibold text-gray-900 group-hover/link:text-blue-600 transition-colors line-clamp-1">
            {favorite.item.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{favorite.item.area}</span>
          </div>
          {favorite.item.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{favorite.item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <Link
          href={href}
          className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <Skeleton className="h-4 w-1/3 mt-3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/favorites');
      return;
    }

    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, router]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/user/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = (itemId: string) => {
    setFavorites(prev => prev.filter(f => f.item_id !== itemId));
  };

  // Group favorites by category
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const type = fav.item_type as CategoryType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(fav);
    return acc;
  }, {} as Record<CategoryType, FavoriteItem[]>);

  // Get counts for each category
  const categoryCounts = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
    key,
    ...config,
    count: groupedFavorites[key as CategoryType]?.length || 0,
  }));

  // Filter favorites based on active tab
  const filteredFavorites = activeTab === 'all'
    ? favorites
    : favorites.filter(f => f.item_type === activeTab);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FavoritesSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Heart className="w-8 h-8 fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Favorites</h1>
                <p className="text-white/80 mt-1">
                  {favorites.length} {favorites.length === 1 ? 'place' : 'places'} saved
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-8">
          {isLoading ? (
            <FavoritesSkeleton />
          ) : favorites.length === 0 ? (
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-gray-100 rounded-full w-fit">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
                <CardTitle>No favorites yet</CardTitle>
                <CardDescription>
                  Start exploring and save your favorite places in Goa!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <Button asChild>
                  <Link href="/places-to-eat">Explore Restaurants</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Browse All Categories</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Category Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {categoryCounts.map(({ key, icon: Icon, label, color, bgColor, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(count > 0 ? key : activeTab)}
                    className={`p-4 rounded-lg border transition-all ${
                      activeTab === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={count === 0}
                  >
                    <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </button>
                ))}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">
                    All ({favorites.length})
                  </TabsTrigger>
                  {categoryCounts.filter(c => c.count > 0).map(({ key, label, count }) => (
                    <TabsTrigger key={key} value={key}>
                      {label} ({count})
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((favorite) => (
                      <FavoriteCard
                        key={favorite.id}
                        favorite={favorite}
                        onRemove={() => handleRemoveFavorite(favorite.item_id)}
                      />
                    ))}
                  </div>
                </TabsContent>

                {Object.keys(CATEGORY_CONFIG).map((categoryKey) => (
                  <TabsContent key={categoryKey} value={categoryKey}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {favorites
                        .filter((f) => f.item_type === categoryKey)
                        .map((favorite) => (
                          <FavoriteCard
                            key={favorite.id}
                            favorite={favorite}
                            onRemove={() => handleRemoveFavorite(favorite.item_id)}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </section>
      </div>
  );
}
