"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  //log user and loading if change
  useEffect(() => {
    console.log('user', user)
    console.log('loading', loading)
  }, [user, loading])

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/explore')
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
      <p className="ml-4 text-muted-foreground">Yükleniyor...</p>
    </div>
  )
}