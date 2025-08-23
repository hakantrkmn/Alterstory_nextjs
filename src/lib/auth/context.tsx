'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { useProfile, useUpdateProfile, useRefreshProfile } from '@/lib/hooks/useProfile'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Memoize Supabase client so it isn't recreated on every render
  const supabase = useMemo(() => createClient(), [])

  // React Query hooks
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(user?.id || null)
  const updateProfileMutation = useUpdateProfile()
  const { refreshProfile } = useRefreshProfile()

  // Get initial session - sadece user bilgisini al
  const getInitialSession = useCallback(async () => {
    try {
      console.log('🔄 AuthProvider: Getting initial session...')
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        console.log('👤 AuthProvider: User found, profile will be fetched by React Query')
      } else {
        setUser(null)
      }

      console.log('✅ AuthProvider: Setting loading to false')
      setLoading(false)
    } catch (error) {
      console.error('💥 AuthProvider: Error getting initial session:', error)
      setLoading(false)
    }
  }, [supabase])

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthProvider: Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setLoading(false)
      }
    })

    // Initial session check
    getInitialSession()

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [getInitialSession])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: displayName,
        }
      }
    })
  
    if (error) {
      return { error }
    }
  
    // Profile otomatik olarak trigger tarafından oluşturulacak
    console.log('✅ AuthProvider: User created, profile will be created by trigger')
  
    return { error: null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      await updateProfileMutation.mutateAsync({ userId: user.id, updates })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const refreshUserProfile = async () => {
    if (!user) return
    
    try {
      await refreshProfile(user.id)
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  // Loading state - hem auth loading hem profile loading
  const isLoading = Boolean(loading || (user && profileLoading))

  const value = {
    user,
    profile: profile || null,
    loading: isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}