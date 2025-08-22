'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function ProfilePage() {
  const { profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (profile?.username) {
      router.replace(`/profile/${profile.username}`)
    }
  }, [profile, router])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    </AuthGuard>
  )
}