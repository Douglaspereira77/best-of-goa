'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Map,
  ArrowLeft,
  Pencil,
  Share2,
  Download,
  Trash2,
  Globe,
  Lock,
  Loader2,
  MapPin,
  Star,
  Copy,
  Check,
  ExternalLink,
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

interface Itinerary {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  items: ItineraryItem[];
  is_owner: boolean;
  created_at: string;
  updated_at: string;
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

export default function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete item state
  const [deleteItem, setDeleteItem] = useState<ItineraryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(`/api/user/itineraries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItinerary(data.itinerary);
        setEditTitle(data.itinerary.title);
        setEditDescription(data.itinerary.description || '');
        setIsPublic(data.itinerary.is_public);
      } else if (response.status === 404) {
        setError('Itinerary not found');
      } else if (response.status === 403) {
        setError('You do not have access to this itinerary');
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setError('Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user/itineraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (response.ok) {
        const { itinerary: updated } = await response.json();
        setItinerary((prev) =>
          prev ? { ...prev, title: updated.title, description: updated.description } : null
        );
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error('Error updating itinerary:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublic = async (newValue: boolean) => {
    setIsPublic(newValue);

    try {
      const response = await fetch(`/api/user/itineraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: newValue }),
      });

      if (response.ok) {
        const { itinerary: updated } = await response.json();
        setItinerary((prev) =>
          prev
            ? { ...prev, is_public: updated.is_public, share_token: updated.share_token }
            : null
        );
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      setIsPublic(!newValue); // Revert on error
    }
  };

  const handleCopyLink = () => {
    if (!itinerary?.share_token) return;

    const shareUrl = `${window.location.origin}/itineraries/shared/${itinerary.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/itineraries/${id}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: deleteItem.item_type,
          itemId: deleteItem.item_id,
        }),
      });

      if (response.ok) {
        setItinerary((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((item) => item.id !== deleteItem.id),
              }
            : null
        );
        setDeleteItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = () => {
    // Simple print-based PDF export
    window.print();
  };

  if (isLoading || authLoading) {
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
            <CardTitle>Oops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/itineraries">Back to Itineraries</Link>
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
          <div className="flex items-center gap-2 mb-4 print:hidden">
            <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
              <Link href="/itineraries">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full print:hidden">
                <Map className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{itinerary.title}</h1>
                  {itinerary.is_public ? (
                    <Globe className="w-5 h-5 text-white/80 print:hidden" />
                  ) : (
                    <Lock className="w-5 h-5 text-white/80 print:hidden" />
                  )}
                </div>
                {itinerary.description && (
                  <p className="text-white/80 mt-1 print:text-gray-600">{itinerary.description}</p>
                )}
                <p className="text-white/60 text-sm mt-2 print:text-gray-500">
                  {itinerary.items.length} {itinerary.items.length === 1 ? 'place' : 'places'}
                </p>
              </div>
            </div>

            {itinerary.is_owner && (
              <div className="flex gap-2 print:hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                  className="gap-1"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsShareOpen(true)}
                  className="gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportPDF} className="gap-1">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Items List */}
      <section className="container mx-auto px-4 py-8">
        {itinerary.items.length === 0 ? (
          <Card className="max-w-lg mx-auto print:hidden">
            <CardHeader className="text-center">
              <CardTitle>No places yet</CardTitle>
              <CardDescription>
                Start adding places to your itinerary by clicking the map icon on any place card.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <Link href="/">Explore Places</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {itinerary.items.map((item, index) => {
              const config = CATEGORY_CONFIG[item.item_type];
              const Icon = config?.icon || MapPin;
              const href = item.details
                ? `${config?.href}/${item.details.slug}`
                : '#';

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

                      {/* Actions */}
                      <div className="flex items-center gap-2 print:hidden">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={href} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        {itinerary.is_owner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteItem(item)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Itinerary</DialogTitle>
            <DialogDescription>Update your itinerary details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Itinerary</DialogTitle>
            <DialogDescription>
              Make your itinerary public to share it with friends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Itinerary</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view this itinerary
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
            </div>

            {isPublic && itinerary.share_token && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/itineraries/shared/${itinerary.share_token}`}
                    className="text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Itinerary?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{deleteItem?.details?.name || 'this place'}" from your itinerary?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
