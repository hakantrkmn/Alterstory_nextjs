'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = <div>Please log in to access this page.</div>,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && redirectTo) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // 3 saniye sonra zorla loading'i false kabul et
  // NOTE: Previously we forced a redirect after 3s if loading stayed true.
  // That caused valid authenticated sessions to be redirected back to login
  // if the auth client took longer to initialize. Remove the forced timeout
  // and rely on the auth state from AuthProvider instead.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-muted-foreground">Yükleniyor...</p>
      </div>
    )
  }

  if (!user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}