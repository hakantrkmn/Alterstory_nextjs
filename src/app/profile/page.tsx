'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // Sayfa açıldığında cache'i yenile
  useEffect(() => {
    if (user) {
      refreshUserProfile()
    }
  }, [user, refreshUserProfile])

  useEffect(() => {
    // Profile varsa username ile yönlendir
    if (profile?.username) {
      router.replace(`/profile/${profile.username}`)
    }
  }, [profile, router])

  const handleRefresh = async () => {
    if (!user) return

    setRefreshing(true)
    await refreshUserProfile()
    setRefreshing(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        
        {/* Refresh Button */}
        {user && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Profil yükleniyor...</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Yenileniyor...' : 'Profili Yenile'}
            </Button>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}