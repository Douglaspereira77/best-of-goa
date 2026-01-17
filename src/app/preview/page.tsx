'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Building2,
  Landmark,
  GraduationCap,
  ShoppingBag,
  Dumbbell,
  Star,
  Users,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Menu,
} from 'lucide-react';

// Royal Blue + Gold Color Palette
// Primary: #1e40af (royal blue)
// Accent: #f59e0b (gold/amber)
// Dark: #1e3a8a (deep blue)

// Hero slides data with real images
const heroSlides = [
  {
    id: 1,
    title: 'Discover the Best of Goa',
    subtitle: "Your trusted guide to Goa's finest experiences",
    image: '/images/hero/goa-city-dusk-skyline.jpg',
    cta: 'Start Exploring',
    href: '/places-to-eat',
  },
  {
    id: 2,
    title: 'Experience Goa',
    subtitle: 'Adventure awaits on the Arabian Gulf',
    image: '/images/hero/BOK.mp4',
    isVideo: true,
    cta: 'Discover More',
    href: '/places-to-visit',
  },
  {
    id: 3,
    title: 'Urban Escapes',
    subtitle: 'Parks, gardens and outdoor adventures',
    image: '/images/hero/city-park-sunset-view.jpg',
    cta: 'Explore Outdoors',
    href: '/places-to-visit',
  },
  {
    id: 4,
    title: 'Luxury Awaits',
    subtitle: 'World-class hotels and resorts',
    image: '/images/hero/luxury-infinity-pool-sunset.jpg',
    cta: 'Find Hotels',
    href: '/places-to-stay',
  },
  {
    id: 5,
    title: 'Golden Sunsets',
    subtitle: 'Marina views and waterfront dining',
    image: '/images/hero/sunset-marina-cityscape.jpg',
    cta: 'Explore Dining',
    href: '/places-to-eat',
  },
];

// Categories data with real images
const categories = [
  {
    name: 'Places to Eat',
    slug: 'places-to-eat',
    icon: UtensilsCrossed,
    count: '450+',
    description: 'Restaurants, cafes & fine dining',
    image: '/images/categories/restaurants.jpg',
  },
  {
    name: 'Places to Stay',
    slug: 'places-to-stay',
    icon: Building2,
    count: '68+',
    description: 'Hotels, resorts & apartments',
    image: '/images/categories/hotels.jpg',
  },
  {
    name: 'Places to Shop',
    slug: 'places-to-shop',
    icon: ShoppingBag,
    count: '42+',
    description: 'Malls & shopping destinations',
    image: '/images/categories/malls.jpg',
  },
  {
    name: 'Places to Visit',
    slug: 'places-to-visit',
    icon: Landmark,
    count: '85+',
    description: 'Attractions & landmarks',
    image: '/images/categories/attractions.jpg',
  },
  {
    name: 'Places to Learn',
    slug: 'places-to-learn',
    icon: GraduationCap,
    count: '120+',
    description: 'Schools & education',
    image: '/images/categories/schools.jpg',
  },
  {
    name: 'Things to Do',
    slug: 'things-to-do/fitness',
    icon: Dumbbell,
    count: '95+',
    description: 'Fitness & wellness',
    image: '/images/categories/fitness.jpg',
  },
];

// Governorates data with real images
const governorates = [
  { name: 'Goa City', slug: 'goa-city', image: '/images/destinations/goa-city.jpg' },
  { name: 'Hawalli', slug: 'hawalli', image: '/images/destinations/hawalli.jpg' },
  { name: 'Salmiya', slug: 'salmiya', image: '/images/destinations/salmiya.jpg' },
  { name: 'Al Farwaniyah', slug: 'farwaniya', image: '/images/destinations/farwaniya.jpg' },
  { name: 'Al Ahmadi', slug: 'ahmadi', image: '/images/destinations/ahmadi.jpg' },
  { name: 'Al Jahra', slug: 'jahra', image: '/images/destinations/jahra.jpg' },
];

// Stats data
const stats = [
  { icon: UtensilsCrossed, label: 'Restaurants', value: '450+', color: 'bg-amber-100 text-amber-600' },
  { icon: Building2, label: 'Hotels', value: '68+', color: 'bg-blue-100 text-blue-600' },
  { icon: Landmark, label: 'Attractions', value: '85+', color: 'bg-purple-100 text-purple-600' },
  { icon: ShoppingBag, label: 'Malls', value: '42+', color: 'bg-pink-100 text-pink-600' },
  { icon: GraduationCap, label: 'Schools', value: '120+', color: 'bg-green-100 text-green-600' },
  { icon: Users, label: 'Monthly Visitors', value: '150K+', color: 'bg-cyan-100 text-cyan-600' },
];

// Custom hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated section wrapper
function AnimatedSection({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function PreviewPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Google Font - Inter */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* More dramatic Ken Burns animation */
        @keyframes ken-burns {
          0% {
            transform: scale(1) translateX(0);
          }
          100% {
            transform: scale(1.15) translateX(-2%);
          }
        }

        @keyframes ken-burns-alt {
          0% {
            transform: scale(1.1) translateX(-2%);
          }
          100% {
            transform: scale(1) translateX(0);
          }
        }

        .animate-ken-burns {
          animation: ken-burns 10s ease-out forwards;
        }

        .animate-ken-burns-alt {
          animation: ken-burns-alt 10s ease-out forwards;
        }

        /* Fade in animation for text */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>

      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#1e3a8a] shadow-lg'
          : 'bg-gradient-to-b from-black/50 to-transparent'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/preview" className="flex items-center gap-2">
              <img
                src="/BrandAssets/logo-dark.png"
                alt="Best of Goa"
                className="h-20 w-auto"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Home', href: '/preview' },
                { label: 'Places to Eat', href: '/places-to-eat' },
                { label: 'Places to Stay', href: '/places-to-stay' },
                { label: 'Places to Shop', href: '/places-to-shop' },
                { label: 'Places to Visit', href: '/places-to-visit' },
                { label: 'Places to Learn', href: '/places-to-learn' },
                { label: 'Things to Do', href: '/things-to-do/fitness' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hidden md:flex"
              >
                <Globe className="w-5 h-5" />
              </Button>
              <Button
                className="hidden sm:flex bg-amber-500 hover:bg-amber-600 text-white border-0"
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            {/* Background Image/Video with Ken Burns effect */}
            <div className="absolute inset-0 overflow-hidden">
              {'isVideo' in slide && slide.isVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={slide.image} type="video/mp4" />
                </video>
              ) : slide.image.endsWith('.gif') ? (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className={`object-cover ${index === currentSlide
                    ? index % 2 === 0 ? 'animate-ken-burns' : 'animate-ken-burns-alt'
                    : ''
                    }`}
                  sizes="100vw"
                />
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
            </div>
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
          {/* Large animated text */}
          <div className="absolute top-1/4 left-0 right-0 overflow-hidden pointer-events-none select-none">
            <h2 className="text-[12vw] font-bold text-white/[0.03] whitespace-nowrap tracking-tight">
              Best of Goa
            </h2>
          </div>

          {/* Content Card */}
          <div className="relative max-w-3xl mx-auto text-center">
            <h1
              key={`title-${currentSlide}`}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg leading-tight animate-fade-in-up"
            >
              {heroSlides[currentSlide].title}
            </h1>
            <p
              key={`subtitle-${currentSlide}`}
              className="text-lg md:text-xl text-white/90 mb-8 drop-shadow animate-fade-in-up animation-delay-200"
            >
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mb-6 animate-fade-in-up animation-delay-400">
              <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Search restaurants, hotels, attractions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 text-base py-6"
                  />
                </div>
                <Button className="m-2 px-6 py-6 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-xl">
                  Search
                </Button>
              </div>
            </div>

            {/* CTA Button */}
            <Link href={heroSlides[currentSlide].href}>
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg animate-fade-in-up animation-delay-400"
              >
                {heroSlides[currentSlide].cta}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Carousel Navigation */}
        <div className="absolute bottom-8 left-0 right-0 z-30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              {/* Dots */}
              <div className="flex gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 rounded-full transition-all duration-300 ${index === currentSlide
                      ? 'bg-amber-500 w-8'
                      : 'bg-white/50 hover:bg-white/70 w-3'
                      }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
                  Explore Goa
                </h2>
                <p className="text-gray-600">
                  Discover the best places across all categories
                </p>
              </div>
              <Link href="/places-to-eat" className="hidden md:block">
                <Button variant="ghost" className="text-[#1e40af] hover:text-[#1e3a8a]">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <AnimatedSection key={category.slug} delay={index * 100}>
                  <Link href={`/${category.slug}`}>
                    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-colors" />

                        {/* Content overlay on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <Badge className="bg-amber-500 text-white border-0 shadow-lg text-sm px-3">
                              {category.count}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {category.name}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {category.description}
                          </p>
                        </div>

                        {/* Arrow indicator */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
                  Discover Destinations
                </h2>
                <p className="text-gray-600">
                  Explore Goa's most popular areas
                </p>
              </div>
              <Link href="/places-to-eat" className="hidden md:block">
                <Button variant="ghost" className="text-[#1e40af] hover:text-[#1e3a8a]">
                  View More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {governorates.map((area, index) => (
              <AnimatedSection key={area.slug} delay={index * 100}>
                <Link href={`/places-to-eat/in/${area.slug}`}>
                  <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={area.image}
                        alt={area.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Title overlay on image */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                          {area.name}
                        </h3>
                        <div className="flex items-center text-white/80 text-sm mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          Goa
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* About Goa Stats Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] mb-2">
                  About Best of Goa
                </h2>
                <p className="text-gray-600">
                  Your comprehensive guide to Goa
                </p>
              </div>
              <Link href="/about" className="hidden md:block">
                <Button variant="ghost" className="text-[#1e40af] hover:text-[#1e3a8a]">
                  View More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <AnimatedSection key={stat.label} delay={index * 50}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <p className="text-3xl md:text-4xl font-bold text-[#1e3a8a]">{stat.value}</p>
                      <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-[#1e3a8a]">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Welcome To
                </h2>
                <h2 className="text-4xl md:text-5xl font-bold text-amber-400 mb-6">
                  Best of Goa
                </h2>
                <p className="text-amber-400 font-semibold uppercase tracking-wide mb-4">
                  Subscribe
                </p>
                <p className="text-white/80 text-lg mb-8">
                  Get the latest updates on new restaurants, hotels, and attractions
                  in Goa delivered straight to your inbox.
                </p>

                {/* Email Signup */}
                <div className="flex gap-3 max-w-md">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 py-6"
                  />
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6">
                    Subscribe
                  </Button>
                </div>
              </div>

              {/* Phone Mockup */}
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-64 h-[500px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-4 border-white/20 flex items-center justify-center">
                    <div className="text-center text-white/50">
                      <Star className="w-16 h-16 mx-auto mb-4" />
                      <p className="font-semibold">App Coming Soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer - Using existing BOK design */}
      <footer className="border-t bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <img
                src="/BrandAssets/logo-dark.png"
                alt="Best of Goa"
                className="h-16 w-auto"
              />
              <p className="text-slate-400 text-sm">
                Your trusted guide to Goa's finest places. Discover top-rated restaurants,
                attractions, and experiences.
              </p>
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <a
                  href="https://instagram.com/bestofgoa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/bestofgoa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/bestofgoa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/company/bestofgoa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/application" className="hover:text-white transition-colors">
                    Submit Business
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/places-to-eat" className="hover:text-white transition-colors">
                    Places to Eat
                  </Link>
                </li>
                <li>
                  <Link href="/places-to-stay" className="hover:text-white transition-colors">
                    Places to Stay
                  </Link>
                </li>
                <li>
                  <Link href="/places-to-shop" className="hover:text-white transition-colors">
                    Places to Shop
                  </Link>
                </li>
                <li>
                  <Link href="/places-to-visit" className="hover:text-white transition-colors">
                    Places to Visit
                  </Link>
                </li>
                <li>
                  <Link href="/places-to-learn" className="hover:text-white transition-colors">
                    Places to Learn
                  </Link>
                </li>
                <li>
                  <Link href="/things-to-do" className="hover:text-white transition-colors">
                    Things to Do
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter & Legal */}
            <div>
              <h3 className="font-semibold mb-4">Stay Updated</h3>
              <p className="text-sm text-slate-400 mb-4">
                Subscribe to our newsletter for the latest updates and recommendations.
              </p>
              <form className="flex flex-col space-y-2 mb-6">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button type="submit" size="sm" className="w-full">
                  Subscribe
                </Button>
              </form>

              <h3 className="font-semibold mb-4 mt-6">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-slate-800" />

          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; 2025 Best of Goa. All rights reserved.</p>
            <p className="mt-4 md:mt-0">
              Built with Next.js, TypeScript, and shadcn/ui
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
