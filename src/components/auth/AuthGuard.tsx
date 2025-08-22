'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/loading'

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
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Loading bittikten sonra auth kontrolü yap
    if (!loading) {
      if (!user && redirectTo) {
        setShouldRedirect(true)
        router.push(redirectTo)
      }
    }
  }, [user, loading, router, redirectTo])

  // Loading sırasında children'ı göster (sayfa geçişini engelleme)
  if (loading) {
    return (
      <>
        {children}
        {/* Overlay loading */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loading size="lg" text="Kimlik doğrulanıyor..." />
        </div>
      </>
    )
  }

  // Loading bitti, user yoksa ve redirect ediliyorsa loading göster
  if (shouldRedirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Giriş yapılıyor...</p>
        </div>
      </div>
    )
  }

  // User varsa children'ı göster
  return <>{children}</>
}