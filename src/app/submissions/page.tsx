'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  ExternalLink,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  Dumbbell,
  GraduationCap,
  Landmark,
} from 'lucide-react';

interface Submission {
  id: string;
  business_name: string;
  category: string;
  governorate: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
  website?: string;
  google_maps_url?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Awaiting review',
  },
  in_review: {
    label: 'In Review',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-800',
    description: 'Being reviewed by our team',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    description: 'Added to Best of Goa',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    description: 'Not approved',
  },
};

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  restaurant: {
    icon: UtensilsCrossed,
    label: 'Restaurant',
    color: 'text-orange-600',
  },
  hotel: {
    icon: Building2,
    label: 'Hotel',
    color: 'text-blue-600',
  },
  mall: {
    icon: ShoppingBag,
    label: 'Mall',
    color: 'text-pink-600',
  },
  attraction: {
    icon: Landmark,
    label: 'Attraction',
    color: 'text-green-600',
  },
  fitness: {
    icon: Dumbbell,
    label: 'Fitness',
    color: 'text-purple-600',
  },
  school: {
    icon: GraduationCap,
    label: 'School',
    color: 'text-cyan-600',
  },
};

export default function SubmissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/submissions');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/user/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">My Submissions</h1>
                <p className="text-white/80">Track businesses you've suggested</p>
              </div>
            </div>

            <Button asChild variant="secondary" size="sm" className="gap-1">
              <Link href="/application">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Business</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Submissions List */}
      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-cyan-100 rounded-full w-fit mb-4">
                <FileText className="w-8 h-8 text-cyan-600" />
              </div>
              <CardTitle>No submissions yet</CardTitle>
              <CardDescription>
                Know a great place in Goa? Submit it and we'll review it for inclusion.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/application">Submit a Business</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const statusConfig = STATUS_CONFIG[submission.status];
              const StatusIcon = statusConfig.icon;
              const categoryConfig = CATEGORY_CONFIG[submission.category];
              const CategoryIcon = categoryConfig?.icon || FileText;

              return (
                <Card key={submission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div
                        className={`flex-shrink-0 p-3 rounded-lg bg-gray-100 ${categoryConfig?.color || 'text-gray-600'}`}
                      >
                        <CategoryIcon className="w-6 h-6" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{submission.business_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <span className={categoryConfig?.color}>
                                {categoryConfig?.label || submission.category}
                              </span>
                              <span>â€¢</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {submission.governorate}
                              </span>
                            </div>
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">{statusConfig.description}</p>

                        {submission.admin_notes && submission.status === 'rejected' && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <strong>Reason:</strong> {submission.admin_notes}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400">
                            Submitted {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            {submission.website && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={submission.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
