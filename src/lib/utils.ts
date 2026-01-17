import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a social media URL or handle to a full URL
 * Handles cases where only a handle (e.g., @username) is stored instead of full URL
 */
export function normalizeSocialUrl(
  value: string | null | undefined,
  platform: 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'youtube'
): string | null {
  if (!value) return null

  // Already a full URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  // Remove @ prefix if present
  const handle = value.startsWith('@') ? value.slice(1) : value

  // Build full URL based on platform
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'twitter':
      return `https://twitter.com/${handle}`
    case 'youtube':
      return `https://youtube.com/${handle}`
    default:
      return null
  }
}

/**
 * Check if a social media value is a valid URL (not just a handle)
 */
export function isValidSocialUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return value.startsWith('http://') || value.startsWith('https://')
}
