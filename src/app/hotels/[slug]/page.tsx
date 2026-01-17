/**
 * Legacy Hotel Route - Redirects to New Structure
 *
 * This file maintains backward compatibility by redirecting
 * /hotels/[slug] → /places-to-stay/hotels/[slug]
 *
 * 301 Permanent Redirect for SEO
 */

import { redirect } from 'next/navigation'

interface HotelPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function OldHotelRoute({ params }: HotelPageProps) {
  const { slug } = await params

  // 301 permanent redirect to new structure
  redirect(`/places-to-stay/hotels/${slug}`)
}
