'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map, Plus, Check, Loader2 } from 'lucide-react';

interface Itinerary {
  id: string;
  title: string;
  item_count: number;
}

interface AddToItineraryButtonProps {
  itemType: 'restaurant' | 'hotel' | 'mall' | 'attraction' | 'fitness' | 'school';
  itemId: string;
  itemName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AddToItineraryButton({
  itemType,
  itemId,
  itemName,
  className,
  size = 'md',
}: AddToItineraryButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Fetch user's itineraries when popover opens
  useEffect(() => {
    if (isOpen && user) {
      fetchItineraries();
    }
  }, [isOpen, user]);

  const fetchItineraries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/itineraries');
      if (response.ok) {
        const data = await response.json();
        setItineraries(data.itineraries || []);
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsOpen(true);
  };

  const handleAddToItinerary = async (itineraryId: string) => {
    setIsAdding(itineraryId);

    try {
      const response = await fetch(`/api/user/itineraries/${itineraryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      });

      if (response.ok) {
        setAddedTo((prev) => new Set([...prev, itineraryId]));
        // Update item count locally
        setItineraries((prev) =>
          prev.map((it) =>
            it.id === itineraryId ? { ...it, item_count: it.item_count + 1 } : it
          )
        );
      } else if (response.status === 409) {
        // Already in itinerary
        setAddedTo((prev) => new Set([...prev, itineraryId]));
      }
    } catch (error) {
      console.error('Error adding to itinerary:', error);
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;

    setIsCreating(true);

    try {
      // Create the itinerary
      const createResponse = await fetch('/api/user/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (createResponse.ok) {
        const { itinerary } = await createResponse.json();

        // Add current item to new itinerary
        const addResponse = await fetch(`/api/user/itineraries/${itinerary.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId }),
        });

        if (addResponse.ok) {
          setItineraries((prev) => [
            { id: itinerary.id, title: itinerary.title, item_count: 1 },
            ...prev,
          ]);
          setAddedTo((prev) => new Set([...prev, itinerary.id]));
          setNewTitle('');
          setShowNewForm(false);
        }
      }
    } catch (error) {
      console.error('Error creating itinerary:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            'flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:shadow-lg',
            sizeClasses[size],
            className
          )}
          aria-label="Add to itinerary"
        >
          <Map className={cn(iconSizes[size], 'text-gray-600 hover:text-blue-500')} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Add to Itinerary</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{itemName}</p>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-48">
              {itineraries.length === 0 && !showNewForm ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No itineraries yet. Create one!
                </div>
              ) : (
                <div className="p-2">
                  {itineraries.map((itinerary) => (
                    <button
                      key={itinerary.id}
                      onClick={() => handleAddToItinerary(itinerary.id)}
                      disabled={isAdding === itinerary.id || addedTo.has(itinerary.id)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-md text-left text-sm transition-colors',
                        addedTo.has(itinerary.id)
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-100'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{itinerary.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {itinerary.item_count} {itinerary.item_count === 1 ? 'place' : 'places'}
                        </p>
                      </div>
                      {isAdding === itinerary.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : addedTo.has(itinerary.id) ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-2 border-t">
              {showNewForm ? (
                <div className="space-y-2">
                  <Input
                    placeholder="My Goa Trip..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateNew();
                      if (e.key === 'Escape') setShowNewForm(false);
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateNew}
                      disabled={!newTitle.trim() || isCreating}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create & Add'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewForm(false);
                        setNewTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowNewForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Itinerary
                </Button>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
