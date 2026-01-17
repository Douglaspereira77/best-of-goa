'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';

interface RestaurantSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  overall_rating?: number;
  cuisines?: Array<{ name: string }>;
}

interface HotelSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  google_rating?: number;
  star_rating?: number;
  categories?: Array<{ name: string }>;
}

interface AttractionSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  google_rating?: number;
  categories?: Array<{ name: string }>;
}

interface SchoolSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  logo_image?: string;
  google_rating?: number;
  parent_rating?: number;
  curriculum?: string[];
  categories?: Array<{ name: string }>;
}

interface MallSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  google_rating?: number;
  categories?: Array<{ name: string }>;
}

interface FitnessSearchResult {
  id: string;
  slug: string;
  name: string;
  short_description?: string;
  area: string;
  hero_image?: string;
  bok_score?: number;
  google_rating?: number;
  fitness_types?: string[];
  gender_policy?: string;
  categories?: Array<{ name: string }>;
}

interface UniversalSearchResults {
  restaurants: { results: RestaurantSearchResult[]; total: number };
  hotels: { results: HotelSearchResult[]; total: number };
  malls: { results: MallSearchResult[]; total: number };
  attractions: { results: AttractionSearchResult[]; total: number };
  schools: { results: SchoolSearchResult[]; total: number };
  fitness: { results: FitnessSearchResult[]; total: number };
  totalResults: number;
}

type SearchResult = RestaurantSearchResult | HotelSearchResult | AttractionSearchResult | SchoolSearchResult | MallSearchResult | FitnessSearchResult;

interface SearchBarProps {
  placeholder?: string;
  cuisineFilter?: string;
  categoryFilter?: string;
  areaFilter?: string;
  className?: string;
  type?: 'restaurants' | 'hotels' | 'attractions' | 'schools' | 'malls' | 'fitness' | 'universal';
}

// Category configuration for universal search
const categoryConfig = {
  restaurants: { emoji: '🍽️', label: 'Restaurants', basePath: '/places-to-eat', detailPath: '/places-to-eat' },
  hotels: { emoji: '🏨', label: 'Hotels', basePath: '/places-to-stay', detailPath: '/places-to-stay' },
  malls: { emoji: '🛍️', label: 'Malls', basePath: '/places-to-shop', detailPath: '/places-to-shop' },
  attractions: { emoji: '🏛️', label: 'Attractions', basePath: '/places-to-visit', detailPath: '/places-to-visit' },
  schools: { emoji: '🎓', label: 'Schools', basePath: '/places-to-learn', detailPath: '/places-to-learn' },
  fitness: { emoji: '💪', label: 'Fitness', basePath: '/things-to-do/fitness', detailPath: '/things-to-do/fitness' },
};

export function SearchBar({
  placeholder = "Search restaurants...",
  cuisineFilter,
  categoryFilter,
  areaFilter,
  className = "",
  type = "restaurants"
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [universalResults, setUniversalResults] = useState<UniversalSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Update dropdown position when showing results
  useEffect(() => {
    if (showResults && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showResults, query]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!showResults) return;

    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showResults]);

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setUniversalResults(null);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        if (type === 'universal') {
          // Universal search
          const response = await fetch(`/api/search/universal?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setUniversalResults(data);
          setResults([]);
        } else {
          // Single-type search
          const params = new URLSearchParams({ q: query, limit: '10' });
          if (type === 'restaurants' && cuisineFilter) {
            params.append('cuisine', cuisineFilter);
          }
          if ((type === 'hotels' || type === 'attractions' || type === 'schools' || type === 'malls' || type === 'fitness') && categoryFilter) {
            params.append('category', categoryFilter);
          }
          if (areaFilter) params.append('area', areaFilter);

          const endpoint = type === 'hotels'
            ? '/api/search/hotels'
            : type === 'attractions'
            ? '/api/search/attractions'
            : type === 'schools'
            ? '/api/search/schools'
            : type === 'malls'
            ? '/api/search/malls'
            : type === 'fitness'
            ? '/api/search/fitness'
            : '/api/search/restaurants';
          const response = await fetch(`${endpoint}?${params}`);
          const data = await response.json();

          setResults(data.results || []);
          setUniversalResults(null);
        }
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setUniversalResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, cuisineFilter, categoryFilter, areaFilter, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is inside search ref
      if (searchRef.current && searchRef.current.contains(target)) {
        return;
      }
      // Check if click is inside portal dropdown (has our specific classes)
      const dropdown = document.querySelector('[data-search-dropdown="true"]');
      if (dropdown && dropdown.contains(target)) {
        return;
      }
      setShowResults(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setUniversalResults(null);
    setShowResults(false);
  };

  // Check if we have any results (universal or single-type)
  const hasResults = type === 'universal'
    ? universalResults && universalResults.totalResults > 0
    : results.length > 0;

  // Render a single result item
  const renderResultItem = (result: SearchResult, resultType: keyof typeof categoryConfig) => {
    const config = categoryConfig[resultType];
    const href = `${config.detailPath}/${result.slug}`;

    return (
      <Link
        key={`${resultType}-${result.id}`}
        href={href}
        onClick={() => setShowResults(false)}
        className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
      >
        {/* Image */}
        <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
          {result.hero_image ? (
            <Image
              src={result.hero_image}
              alt={result.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl">{config.emoji}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate text-sm">
            {result.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{result.area}</span>
            {renderRating(result, resultType)}
          </div>
          {renderMetadata(result, resultType)}
        </div>
      </Link>
    );
  };

  // Render rating based on type
  const renderRating = (result: SearchResult, resultType: keyof typeof categoryConfig) => {
    switch (resultType) {
      case 'restaurants':
        const restaurant = result as RestaurantSearchResult;
        if (restaurant.overall_rating) {
          return (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-blue-600">
                {restaurant.overall_rating.toFixed(1)}/10
              </span>
            </>
          );
        }
        break;
      case 'hotels':
        const hotel = result as HotelSearchResult;
        return (
          <>
            {hotel.google_rating && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-blue-600">
                  {hotel.google_rating.toFixed(1)}/5
                </span>
              </>
            )}
            {hotel.star_rating && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-yellow-600">
                  {'★'.repeat(hotel.star_rating)}
                </span>
              </>
            )}
          </>
        );
      case 'fitness':
        const fitness = result as FitnessSearchResult;
        if (fitness.bok_score || fitness.google_rating) {
          return (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-green-600">
                {fitness.bok_score ? `${fitness.bok_score.toFixed(1)}/10` : `${fitness.google_rating?.toFixed(1)}/5`}
              </span>
            </>
          );
        }
        break;
      case 'attractions':
      case 'malls':
      case 'schools':
        const withRating = result as AttractionSearchResult | MallSearchResult | SchoolSearchResult;
        if (withRating.google_rating) {
          return (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-purple-600">
                {withRating.google_rating.toFixed(1)}/5
              </span>
            </>
          );
        }
        break;
    }
    return null;
  };

  // Render metadata badges based on type
  const renderMetadata = (result: SearchResult, resultType: keyof typeof categoryConfig) => {
    switch (resultType) {
      case 'restaurants':
        const restaurant = result as RestaurantSearchResult;
        if (restaurant.cuisines && restaurant.cuisines.length > 0) {
          return (
            <div className="flex gap-1 mt-1">
              {restaurant.cuisines.slice(0, 2).map((cuisine, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {cuisine.name}
                </span>
              ))}
            </div>
          );
        }
        break;
      case 'fitness':
        const fitness = result as FitnessSearchResult;
        return (
          <div className="flex gap-1 mt-1">
            {fitness.fitness_types?.slice(0, 2).map((ft, i) => (
              <span key={i} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded capitalize">
                {ft}
              </span>
            ))}
            {fitness.gender_policy && fitness.gender_policy !== 'co-ed' && (
              <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded capitalize">
                {fitness.gender_policy.replace('-', ' ')}
              </span>
            )}
          </div>
        );
      case 'schools':
        const school = result as SchoolSearchResult;
        if (school.curriculum && school.curriculum.length > 0) {
          return (
            <div className="flex gap-1 mt-1">
              {school.curriculum.slice(0, 2).map((curr, i) => (
                <span key={i} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded capitalize">
                  {curr}
                </span>
              ))}
            </div>
          );
        }
        break;
      case 'hotels':
      case 'attractions':
      case 'malls':
        const withCategories = result as HotelSearchResult | AttractionSearchResult | MallSearchResult;
        if (withCategories.categories && withCategories.categories.length > 0) {
          return (
            <div className="flex gap-1 mt-1">
              {withCategories.categories.slice(0, 2).map((cat, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {cat.name}
                </span>
              ))}
            </div>
          );
        }
        break;
    }
    return null;
  };

  // Render universal search results grouped by category
  const renderUniversalResults = () => {
    if (!universalResults) return null;

    const categories = [
      { key: 'restaurants' as const, data: universalResults.restaurants },
      { key: 'hotels' as const, data: universalResults.hotels },
      { key: 'attractions' as const, data: universalResults.attractions },
      { key: 'malls' as const, data: universalResults.malls },
      { key: 'schools' as const, data: universalResults.schools },
      { key: 'fitness' as const, data: universalResults.fitness },
    ].filter(cat => cat.data.results.length > 0);

    if (categories.length === 0) return null;

    return (
      <div className="p-2">
        {categories.map(({ key, data }) => {
          const config = categoryConfig[key];
          return (
            <div key={key} className="mb-3 last:mb-0">
              {/* Section Header */}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.emoji}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-400">({data.total})</span>
                </div>
                {data.total > data.results.length && (
                  <Link
                    href={`${config.basePath}?q=${encodeURIComponent(query)}`}
                    onClick={() => setShowResults(false)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Results */}
              <div className="space-y-0.5">
                {data.results.map((result) => renderResultItem(result as SearchResult, key))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render single-type results
  const renderSingleTypeResults = () => {
    return (
      <div className="p-2">
        {results.map((result) => renderResultItem(result, type as keyof typeof categoryConfig))}
      </div>
    );
  };

  // Get "no results" message
  const getNoResultsLabel = () => {
    if (type === 'universal') return 'places';
    return type;
  };

  // Render dropdown content
  const renderDropdown = () => {
    if (!showResults) return null;

    const dropdownContent = hasResults ? (
      <div
        data-search-dropdown="true"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[28rem] overflow-y-auto"
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 9999,
        }}
      >
        {type === 'universal' ? renderUniversalResults() : renderSingleTypeResults()}
      </div>
    ) : query.length >= 2 && !isLoading ? (
      <div
        data-search-dropdown="true"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 text-center"
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 9999,
        }}
      >
        <p className="text-slate-500">No {getNoResultsLabel()} found for "{query}"</p>
        <p className="text-sm text-slate-400 mt-2">Try a different search term</p>
      </div>
    ) : null;

    if (!dropdownContent) return null;

    return dropdownContent;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-12 pr-12 py-6 text-lg rounded-2xl shadow-xl border-slate-200 focus-visible:ring-blue-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Rendered via Portal */}
      {isMounted && createPortal(renderDropdown(), document.body)}
    </div>
  );
}
