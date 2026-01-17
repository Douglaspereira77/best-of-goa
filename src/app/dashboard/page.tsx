'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Heart,
  Map,
  FileText,
  Plus,
  ArrowRight,
  Utensils,
  Hotel,
  ShoppingBag,
  Landmark,
  Dumbbell,
  GraduationCap,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = profile?.preferred_name || profile?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
          <p className="text-gray-600 mt-1">
            Manage your favorites, itineraries, and submissions
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Favorites Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Favorites</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">saved places</p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <Link href="/favorites">
                  View all favorites <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Itineraries Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Itineraries</CardTitle>
              <Map className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">trip plans created</p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <Link href="/itineraries">
                  View all itineraries <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Submissions Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">business suggestions</p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
                <Link href="/submissions">
                  View all submissions <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Create Itinerary CTA */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create an Itinerary
              </CardTitle>
              <CardDescription className="text-blue-100">
                Plan your perfect day in Goa with a custom itinerary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/itineraries/new">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Submit Business CTA */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Suggest a Business
              </CardTitle>
              <CardDescription className="text-green-100">
                Know a great place? Submit it to be featured on Best of Goa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/application">Submit Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Explore Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Explore Goa</CardTitle>
            <CardDescription>
              Discover the best places and start building your favorites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link
                href="/places-to-eat"
                className="flex flex-col items-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <Utensils className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Restaurants</span>
              </Link>
              <Link
                href="/places-to-stay"
                className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Hotel className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Hotels</span>
              </Link>
              <Link
                href="/places-to-shop"
                className="flex flex-col items-center p-4 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
              >
                <ShoppingBag className="h-8 w-8 text-pink-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Malls</span>
              </Link>
              <Link
                href="/places-to-visit"
                className="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Landmark className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Attractions</span>
              </Link>
              <Link
                href="/things-to-do/fitness"
                className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <Dumbbell className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Fitness</span>
              </Link>
              <Link
                href="/places-to-learn"
                className="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <GraduationCap className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Schools</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
