import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom event interface for beforeinstallprompt
 * Android/Desktop Chrome/Edge specific
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Return type for usePWAInstall hook
 */
interface PWAInstallState {
  canInstall: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  showPrompt: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

// Constants
const DISMISSAL_KEY = 'bok-pwa-install-dismissed';
const DISMISSAL_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const ENGAGEMENT_DELAY = 3000; // 3 seconds after page load

/**
 * Hook to manage PWA install prompt
 * Handles both Android/Desktop (native prompt) and iOS (manual instructions)
 *
 * @returns PWAInstallState with install prompt controls
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissalData, setDismissalData] = useLocalStorage<{
    timestamp: number;
  } | null>(DISMISSAL_KEY, null);

  useEffect(() => {
    // Check if user dismissed recently
    if (dismissalData) {
      const timeSinceDismissal = Date.now() - dismissalData.timestamp;
      if (timeSinceDismissal < DISMISSAL_DURATION) {
        return; // Don't show if dismissed within 30 days
      }
    }

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed, don't show prompt
    }

    // Listen for beforeinstallprompt (Android/Desktop Chrome/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);

      // Show prompt after engagement delay
      setTimeout(() => {
        setShowPrompt(true);
      }, ENGAGEMENT_DELAY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detect iOS Safari (no beforeinstallprompt support)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;

    if (isIOS && !isInStandaloneMode) {
      setCanInstall(true);
      // Show prompt after engagement delay for iOS too
      setTimeout(() => {
        setShowPrompt(true);
      }, ENGAGEMENT_DELAY);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [dismissalData]);

  /**
   * Trigger the native install prompt (Android/Desktop)
   */
  const promptInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  /**
   * Dismiss the prompt and store timestamp in localStorage
   */
  const dismissPrompt = () => {
    setShowPrompt(false);
    setDismissalData({ timestamp: Date.now() });
  };

  return {
    canInstall,
    deferredPrompt,
    showPrompt,
    promptInstall,
    dismissPrompt,
  };
}
