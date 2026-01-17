'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return
    hasProcessed.current = true

    const processRecovery = async () => {
      console.log('[ResetPassword] Starting recovery process...')

      if (typeof window === 'undefined') {
        setCheckingSession(false)
        return
      }

      const supabase = createClient()

      // Method 1: Check for PKCE code in query params
      const code = searchParams.get('code')
      if (code) {
        console.log('[ResetPassword] Found PKCE code, exchanging for session...')
        try {
          // Add timeout for code exchange
          const exchangePromise = supabase.auth.exchangeCodeForSession(code)
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Code exchange timed out')), 10000)
          })

          const { data, error: exchangeError } = await Promise.race([
            exchangePromise,
            timeoutPromise
          ]) as Awaited<typeof exchangePromise>

          if (exchangeError) {
            console.error('[ResetPassword] Code exchange error:', exchangeError)
            // Check for common errors
            if (exchangeError.message.includes('expired') || exchangeError.message.includes('invalid')) {
              setError('This recovery link has expired or already been used. Please request a new one.')
            } else {
              setError(`Recovery failed: ${exchangeError.message}`)
            }
            setCheckingSession(false)
            return
          }

          if (!data?.session) {
            setError('Could not establish session. The link may have expired.')
            setCheckingSession(false)
            return
          }

          // Clear the code from URL for security
          window.history.replaceState(null, '', window.location.pathname)

          console.log('[ResetPassword] Session established via PKCE!')
          setSessionReady(true)
          setCheckingSession(false)
          return
        } catch (err) {
          console.error('[ResetPassword] PKCE exchange error:', err)
          if (err instanceof Error && err.message.includes('timed out')) {
            setError('Connection timed out. Please check your internet and try again.')
          } else {
            setError('This recovery link may have expired or already been used. Please request a new one.')
          }
          setCheckingSession(false)
          return
        }
      }

      // Method 2: Check for tokens in hash (implicit flow)
      const hash = window.location.hash
      console.log('[ResetPassword] Hash present:', !!hash)

      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('[ResetPassword] Token type:', type)
        console.log('[ResetPassword] Has access token:', !!accessToken)

        if (accessToken && refreshToken && type === 'recovery') {
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.error('[ResetPassword] Session error:', sessionError)
              setError(`Recovery failed: ${sessionError.message}`)
              setCheckingSession(false)
              return
            }

            if (!data?.session) {
              setError('Could not establish session. The link may have expired.')
              setCheckingSession(false)
              return
            }

            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname)

            console.log('[ResetPassword] Session established via hash tokens!')
            setSessionReady(true)
            setCheckingSession(false)
            return
          } catch (err) {
            console.error('[ResetPassword] Hash token error:', err)
            setError('The recovery link may have expired. Please request a new password reset link.')
            setCheckingSession(false)
            return
          }
        }
      }

      // No valid recovery method found
      setError('No recovery tokens found. Please request a new password reset link.')
      setCheckingSession(false)
    }

    // Small delay to ensure DOM is ready
    setTimeout(processRecovery, 100)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Verifying recovery link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Password Updated</CardTitle>
            <CardDescription>
              Your password has been successfully changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sessionReady ? (
            <div className="text-center">
              {error ? (
                <>
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button asChild variant="outline">
                    <Link href="/forgot-password">Request New Link</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    The recovery link is invalid or has expired.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/forgot-password">Request New Link</Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
