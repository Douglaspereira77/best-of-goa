'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

/**
 * Component that detects password recovery tokens in the URL
 * and redirects to the reset-password page.
 *
 * Handles both:
 * - PKCE flow: ?code=xxx (query parameter)
 * - Implicit flow: #access_token=xxx&type=recovery (hash fragment)
 */
export function RecoveryRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only run on client side and not already on reset-password page
    if (typeof window === 'undefined' || pathname === '/reset-password') {
      return
    }

    // Check for PKCE flow (code in query params)
    const code = searchParams.get('code')
    if (code) {
      // Redirect to reset-password with code
      router.push(`/reset-password?code=${code}`)
      return
    }

    // Check for implicit flow (tokens in hash)
    const hash = window.location.hash
    if (!hash) return

    const hashParams = new URLSearchParams(hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')

    // If this is a recovery flow, redirect to reset-password page
    if (type === 'recovery' && accessToken) {
      // Preserve the hash when redirecting
      router.push(`/reset-password${hash}`)
    }
  }, [router, pathname, searchParams])

  return null
}
