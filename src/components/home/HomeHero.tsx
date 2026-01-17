'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronRight,
  UtensilsCrossed,
  Building2,
  Landmark,
  GraduationCap,
  ShoppingBag,
  Dumbbell,
} from 'lucide-react';

const heroImages = [
  '/images/hero/hero-goa-beach.png',
  '/images/hero/hero-goa-heritage.png',
  '/images/hero/hero-goa-street.png',
];

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  area?: string;
  governorate?: string;
}

interface CategoryResults {
  results: SearchResult[];
  total: number;
}

interface SearchResults {
  restaurants: CategoryResults;
  hotels: CategoryResults;
  malls: CategoryResults;
  attractions: CategoryResults;
  schools: CategoryResults;
  fitness: CategoryResults;
}

export function HomeHero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search/universal?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (type: string, slug: string) => {
    setShowResults(false);
    setSearchQuery('');

    const routes: Record<string, string> = {
      restaurants: `/places-to-eat/restaurants/${slug}`,
      hotels: `/places-to-stay/hotels/${slug}`,
      malls: `/places-to-shop/malls/${slug}`,
      attractions: `/places-to-visit/attractions/${slug}`,
      schools: `/places-to-learn/schools/${slug}`,
      fitness: `/things-to-do/fitness/${slug}`,
    };

    router.push(routes[type] || '/');
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return (
      searchResults.restaurants.results.length +
      searchResults.hotels.results.length +
      searchResults.malls.results.length +
      searchResults.attractions.results.length +
      searchResults.schools.results.length +
      searchResults.fitness.results.length
    );
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Images Slider */}
      {heroImages.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Image
            src={src}
            alt="Goa Scenery"
            fill
            className="object-cover"
            priority={index === 0}
            quality={90}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        </div>
      ))}

      {/* Hero Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
          Your guide to the <span className="text-amber-400">real Goa</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          From hidden beach shacks to the best vindalho in Panjim, we've mapped out everything worth finding in Goa. No fluff, just places locals actually go.
        </p>

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-2 shadow-2xl transition-all hover:bg-white/15">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-6 h-6 text-white/70 mr-3 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Search restaurants, beaches, nightlife..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-white/60 text-lg h-12 w-full"
              />
              {isSearching && (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
              )}
            </div>
            <Button className="rounded-full px-8 py-6 bg-white text-[#1e40af] hover:bg-gray-100 font-semibold text-lg transition-colors">
              Search
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults && getTotalResults() > 0 && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto text-left">
              {/* Restaurants */}
              {searchResults.restaurants.results.length > 0 && (
                <div className="border-b border-gray-50">
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Restaurants
                  </div>
                  {searchResults.restaurants.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('restaurants', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
              {/* Other categories would go here similarly... for brevity in this single file edit, I'm keeping the logic consistent but concise. I'll make sure to include all categories if they were there before or if needed. */}

              {/* Hotels */}
              {searchResults.hotels.results.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Hotels
                  </div>
                  {searchResults.hotels.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('hotels', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* Malls */}
              {searchResults.malls.results.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Malls
                  </div>
                  {searchResults.malls.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('malls', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* Attractions */}
              {searchResults.attractions.results.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5" />
                    Attractions
                  </div>
                  {searchResults.attractions.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('attractions', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* Schools */}
              {searchResults.schools.results.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Schools
                  </div>
                  {searchResults.schools.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('schools', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* Fitness */}
              {searchResults.fitness.results.length > 0 && (
                <div>
                  <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Dumbbell className="w-3.5 h-3.5" />
                    Fitness
                  </div>
                  {searchResults.fitness.results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick('fitness', result.slug)}
                      className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.area || result.governorate}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && searchResults && getTotalResults() === 0 && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 p-6 text-center">
              <p className="text-gray-500">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
