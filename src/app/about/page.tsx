import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  MapPin,
  GraduationCap,
  Dumbbell,
  Map,
  Users,
  Star,
  TrendingUp,
  Mail,
  ExternalLink,
  Heart,
  Globe,
  Calendar,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "About Us - Your Trusted Guide to Goa's Best Places",
  description:
    "Best of Goa curates top restaurants, hotels, malls, attractions, schools & fitness centers across all 6 governorates with local expertise.",
  openGraph: {
    title: "About Best of Goa",
    description:
      "Your trusted guide to discovering the best places in Goa - curated with local expertise.",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Best of Goa",
    description: "Your trusted guide to Goa's best places - restaurants, hotels, malls & more.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/about",
  },
};

const categories = [
  {
    icon: UtensilsCrossed,
    label: "Restaurants",
    href: "/places-to-eat",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    icon: Building2,
    label: "Hotels",
    href: "/places-to-stay",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: ShoppingBag,
    label: "Malls",
    href: "/places-to-shop",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: MapPin,
    label: "Attractions",
    href: "/places-to-visit",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: GraduationCap,
    label: "Schools",
    href: "/places-to-learn",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    icon: Dumbbell,
    label: "Fitness",
    href: "/things-to-do/fitness",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
];

async function getStats() {
  const supabase = await createClient();

  const [restaurants, hotels, malls, attractions, schools, fitness] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("hotels")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("malls")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("attractions")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("schools")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("fitness_places")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
    ]);

  return {
    restaurants: restaurants.count || 0,
    hotels: hotels.count || 0,
    malls: malls.count || 0,
    attractions: attractions.count || 0,
    schools: schools.count || 0,
    fitness: fitness.count || 0,
    total:
      (restaurants.count || 0) +
      (hotels.count || 0) +
      (malls.count || 0) +
      (attractions.count || 0) +
      (schools.count || 0) +
      (fitness.count || 0),
  };
}

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/20 text-white border-white/30"
          >
            <Globe className="w-3 h-3 mr-1" />
            Your Guide to Goa
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Discover the Best of Goa
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            We are your trusted companion for exploring Goa&apos;s finest
            destinations - from world-class restaurants to hidden gems, all
            curated with local expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/">Start Exploring</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/application">Submit a Place</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.restaurants}+
              </div>
              <div className="text-sm text-slate-600">Restaurants</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.hotels}+
              </div>
              <div className="text-sm text-slate-600">Hotels</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.malls}+
              </div>
              <div className="text-sm text-slate-600">Malls</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.attractions}+
              </div>
              <div className="text-sm text-slate-600">Attractions</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.schools}+
              </div>
              <div className="text-sm text-slate-600">Schools</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                {stats.fitness}+
              </div>
              <div className="text-sm text-slate-600">Fitness</div>
            </div>
            <div className="p-4 bg-blue-600 rounded-xl text-white">
              <div className="text-3xl md:text-4xl font-bold">6</div>
              <div className="text-sm text-blue-100">Governorates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Heart className="w-3 h-3 mr-1" />
                Our Story
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why We Built Best of Goa
              </h2>
            </div>

            <div className="prose prose-lg max-w-none text-slate-600">
              <p className="text-xl leading-relaxed mb-6">
                Goa is rapidly emerging as one of the most exciting
                destinations in the Gulf region. With its blend of rich cultural
                heritage, modern architecture, world-class dining, and vibrant
                entertainment scene, Goa offers something for everyone.
              </p>
              <p className="leading-relaxed mb-6">
                We created Best of Goa to be the definitive guide for both
                residents and visitors looking to discover the best this
                beautiful country has to offer. Whether you&apos;re searching for the
                perfect restaurant for a special occasion, the ideal hotel for
                your stay, or hidden gems off the beaten path - we&apos;ve got you
                covered.
              </p>
              <p className="leading-relaxed">
                Our team combines deep local knowledge with industry best
                practices to curate a comprehensive directory that you can
                trust. We don&apos;t just list places - we verify, review, and
                continuously update our information based on real customer
                feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Our Approach
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Makes Us Different
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We&apos;re not just another directory. Here&apos;s how we ensure quality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Map className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Expertise</h3>
                <p className="text-slate-600">
                  Our curation is powered by deep local knowledge of Goa&apos;s
                  neighborhoods, culture, and hidden gems that only locals know.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Customer Feedback
                </h3>
                <p className="text-slate-600">
                  We actively listen to our community. Your feedback helps us
                  maintain accuracy and discover new places worth featuring.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Always Updated</h3>
                <p className="text-slate-600">
                  Goa&apos;s scene is always evolving. We continuously update our
                  listings to ensure you have the latest information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BarChart3 className="w-3 h-3 mr-1" />
              Explore
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover the best of Goa across six comprehensive categories.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.label}
                  href={category.href}
                  className="group"
                >
                  <Card className="border hover:border-blue-300 hover:shadow-lg transition-all">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <div className="font-medium text-slate-700">
                        {category.label}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-4 bg-white/20 text-white border-white/30"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What&apos;s Next for Best of Goa
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              We&apos;re constantly working to make your experience better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-2">Live Events</h3>
              <p className="text-slate-300">
                Discover what&apos;s happening in Goa - concerts, exhibitions,
                festivals, and more. Never miss an event again.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-2">Property Comparisons</h3>
              <p className="text-slate-300">
                Compare hotels, restaurants, and more side-by-side to make the
                perfect choice for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-slate-600 mb-8">
              Have a suggestion? Found an error? We&apos;d love to hear from you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" asChild>
                <a href="mailto:info@bestofgoa.com">
                  <Mail className="w-4 h-4 mr-2" />
                  info@bestofgoa.com
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/application">Submit a Business</Link>
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <a
                href="https://instagram.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://facebook.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Credit */}
      <section className="py-8 bg-slate-100 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Developed by{" "}
            <a
              href="https://gomiragetech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              Mirage Tech
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
