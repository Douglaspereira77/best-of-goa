/**
 * Map Tabler icon names to Lucide React icons
 * 
 * Database stores Tabler icon names (e.g., 'icon-barbell')
 * This maps them to actual Lucide React icon components
 */

import {
  Dumbbell,
  Heart,
  Zap,
  Move,
  Shield,
  Waves,
  UserCheck,
  Music,
  Bike,
  Trophy,
  type LucideIcon
} from 'lucide-react'

/**
 * Icon mapping from Tabler icon names to Lucide React icons
 * 
 * Maps database icon names (Tabler format) to Lucide React icon components
 */
const iconMap: Record<string, LucideIcon> = {
  'icon-barbell': Dumbbell, // Gym - perfect match
  'icon-yoga': Heart, // Yoga - Heart represents wellness/mindfulness
  'icon-run': Zap, // CrossFit - Energy and intensity
  'icon-stretching': Move, // Pilates - Movement and flexibility
  'icon-karate': Shield, // Martial Arts - Protection and discipline
  'icon-swimming': Waves, // Swimming - perfect match
  'icon-user-check': UserCheck, // Personal Training - perfect match
  'icon-ballroom': Music, // Dance - Music and rhythm
  'icon-bike': Bike, // Cycling - perfect match
  'icon-ball-basketball': Trophy, // Sports Club - represents competition
  'icon-boxing': Shield, // Boxing - Protection and combat
}

/**
 * Get Lucide React icon component from Tabler icon name
 * @param tablerIconName - Icon name from database (e.g., 'icon-barbell')
 * @returns Lucide React icon component, defaults to Dumbbell if not found
 */
export function getFitnessIcon(tablerIconName: string | null | undefined): LucideIcon {
  if (!tablerIconName) {
    return Dumbbell
  }

  return iconMap[tablerIconName] || Dumbbell
}

