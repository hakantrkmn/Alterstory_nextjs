'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  // Memoize Supabase client so it isn't recreated on every render
  const supabase = createClient()


  const fetchProfile = useCallback(async (userId: string) => {
    try {

      console.log('fetching profile for user:', userId)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ AuthProvider: Supabase error:', error)
        console.error('❌ AuthProvider: Error code:', error.code)
        console.error('❌ AuthProvider: Error message:', error.message)
        console.error('❌ AuthProvider: Error details:', error.details)
        return
      }

      if (!data) {
        console.warn('⚠️ AuthProvider: No profile data returned')
        return
      }

      console.log('✅ AuthProvider: Profile fetched successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('💥 AuthProvider: Exception caught:', error)
      console.error('💥 AuthProvider: Error stack:', error instanceof Error ? error.stack : 'No stack')
    }
  }, [supabase])

  // Get initial session
  const getInitialSession = useCallback(async () => {
    try {
      console.log('🔄 AuthProvider: Getting initial session...')
      const { data: { user } } = await supabase.auth.getUser()

      setUser(user ?? null)

      if (user) {
        console.log('👤 AuthProvider: User found, fetching profile...')
        await fetchProfile(user.id)
      }

      console.log('✅ AuthProvider: Setting loading to false')
      setLoading(false)
    } catch (error) {
      console.error('💥 AuthProvider: Error getting initial session:', error)
    }
  }, [supabase, fetchProfile])

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthProvider: Auth state changed:', event)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setUser(null)
        setLoading(false)
      }
      if (event === 'SIGNED_IN') {
        getInitialSession()
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
    // Manuel olarak oluşturmaya gerek yok
    console.log('�� AuthProvider: User created, profile will be created by trigger')
  
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

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
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