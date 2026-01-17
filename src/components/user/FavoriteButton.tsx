'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  itemType: 'restaurant' | 'hotel' | 'mall' | 'attraction' | 'fitness' | 'school';
  itemId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ itemType, itemId, className, size = 'md' }: FavoriteButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  // Check if item is favorited on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/user/favorites/check?itemType=${itemType}&itemId=${itemId}`
        );
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFavoriteStatus();
  }, [user, itemType, itemId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not logged in, redirect to login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsLoading(true);

    // Optimistic update
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      if (previousState) {
        // Remove favorite
        const response = await fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }
      } else {
        // Add favorite
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId }),
        });

        if (!response.ok) {
          throw new Error('Failed to add favorite');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setIsFavorited(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <button
        className={cn(
          'flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all',
          sizeClasses[size],
          className
        )}
        disabled
      >
        <Heart className={cn(iconSizes[size], 'text-gray-300')} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:shadow-lg',
        sizeClasses[size],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-colors',
          isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
        )}
      />
    </button>
  );
}
