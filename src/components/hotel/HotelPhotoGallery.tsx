'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Photo {
  url: string;
  alt_text?: string;
  alt?: string;
  filename?: string;
}

interface HotelPhotoGalleryProps {
  photos: Photo[];
  hotelName: string;
}

export function HotelPhotoGallery({ photos, hotelName }: HotelPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <>
      {/* Photo Grid - Display first 6 images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.slice(0, 6).map((photo, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`View photo ${index + 1} of ${photos.length}`}
          >
            <Image
              src={photo.url}
              alt={photo.alt_text || photo.alt || `${hotelName} photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Overlay hint on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                View
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* "View All" Button - Shows when more than 6 photos exist */}
      {photos.length > 6 && (
        <button
          onClick={() => openLightbox(0)}
          className="mt-4 text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          View all {photos.length} photos
        </button>
      )}

      {/* Lightbox Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent
          className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-0"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            {currentPhoto?.alt_text || currentPhoto?.alt || `Photo ${(selectedIndex || 0) + 1} of ${photos.length}`}
          </DialogTitle>

          {currentPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                aria-label="Close lightbox"
              >
                <X size={24} />
              </Button>

              {/* Photo Counter */}
              <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                {selectedIndex + 1} / {photos.length}
              </div>

              {/* Previous Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={32} />
                </Button>
              )}

              {/* Next Button */}
              {photos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
                  aria-label="Next photo"
                >
                  <ChevronRight size={32} />
                </Button>
              )}

              {/* Main Image */}
              <div className="relative w-full h-full p-16">
                <Image
                  src={currentPhoto.url}
                  alt={currentPhoto.alt_text || currentPhoto.alt || `${hotelName} photo ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={95}
                  priority
                />
              </div>

              {/* Photo Caption/Alt Text */}
              {(currentPhoto.alt_text || currentPhoto.alt) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-6 py-3 rounded-full max-w-2xl text-center">
                  <p className="text-sm">{currentPhoto.alt_text || currentPhoto.alt}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
