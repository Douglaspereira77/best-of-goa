'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { X, Download, Share, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

/**
 * PWA Install Prompt Component
 * Shows a sticky bottom banner prompting users to install Best of Goa as a PWA
 * - Android/Desktop: Triggers native install prompt
 * - iOS Safari: Shows Sheet with step-by-step installation instructions
 */
export function PWAInstallPrompt() {
  const { showPrompt, promptInstall, dismissPrompt, deferredPrompt } = usePWAInstall();
  const isMobile = useIsMobile();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!showPrompt) return null;

  // Detect iOS Safari
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const hasNativePrompt = !!deferredPrompt;

  const handleInstallClick = () => {
    if (hasNativePrompt) {
      // Android/Desktop: Show native prompt
      promptInstall();
    } else if (isIOS) {
      // iOS: Show instructions in Sheet
      setShowIOSInstructions(true);
    }
  };

  return (
    <>
      {/* Bottom Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#1e40af] text-white shadow-2xl animate-slide-up"
        role="dialog"
        aria-label="Install Best of Goa app"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Icon + Text */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg p-2">
                <img
                  src="/icon-192.png"
                  alt="Best of Goa"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base">
                  Install Best of Goa
                </p>
                <p className="text-xs sm:text-sm text-blue-100 line-clamp-1">
                  Quick access, offline support, faster experience
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstallClick}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium text-sm px-4 py-2 h-auto"
                aria-label="Install app"
              >
                <Download className="w-4 h-4 mr-2" />
                {isMobile ? 'Install' : 'Add to Home'}
              </Button>
              <Button
                onClick={dismissPrompt}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-700 h-8 w-8"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Sheet */}
      <Sheet open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="text-[#1e40af]">
              Install Best of Goa on iOS
            </SheetTitle>
            <SheetDescription>
              Follow these simple steps to add Best of Goa to your home screen
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Tap the Share button</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Share className="w-5 h-5 text-blue-600" />
                  <span>Look for this icon at the bottom of Safari</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Select "Add to Home Screen"</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span>Scroll down and tap this option</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Tap "Add" to confirm</p>
                <p className="text-sm text-gray-600">
                  The app will appear on your home screen
                </p>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => {
                setShowIOSInstructions(false);
                dismissPrompt();
              }}
              className="w-full mt-4 bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Got it!
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
