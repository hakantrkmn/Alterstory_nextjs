import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface UserStats {
  createdStories: number
  contributions: number
  receivedLikes: number
  readStories: number
  isLoading: boolean
  error: string | null
}

export function useUserStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    createdStories: 0,
    contributions: 0,
    receivedLikes: 0,
    readStories: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      console.log('🔧 useUserStats: No user, skipping API call')
      setStats(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchStats = async () => {
      try {
        console.log('🔧 useUserStats: Fetching stats for user:', user.id)
        setStats(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Get created stories count
        const { count: createdStories, error: createdError } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .eq('level', 0)

        if (createdError) {
          console.error('Error getting created stories count:', createdError)
        }

        // Get contributions count
        const { count: contributions, error: contributionsError } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .gt('level', 0)

        if (contributionsError) {
          console.error('Error getting contributions count:', contributionsError)
        }

        // Get received likes count (simplified - just count likes on user's stories)
        let receivedLikes = 0
        const { data: userStories, error: storiesError } = await supabase
          .from('stories')
          .select('id, like_count')
          .eq('author_id', user.id)

        if (!storiesError && userStories) {
          receivedLikes = userStories.reduce((total, story) => total + (story.like_count || 0), 0)
        }

        // Get read stories count (simplified - just return 0 for now)
        const readStories = 0 // reading_history table doesn't exist yet

        const result = {
          createdStories: createdStories || 0,
          contributions: contributions || 0,
          receivedLikes: receivedLikes || 0,
          readStories: readStories || 0
        }

        console.log('🔧 useUserStats: Success result:', result)
        
        setStats({
          ...result,
          isLoading: false,
          error: null
        })
        
      } catch (error) {
        console.error('Error fetching user stats:', error)
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats'
        }))
      }
    }

    fetchStats()
  }, [user])

  return stats
}

interface CommunityStats {
  totalStories: number
  activeWriters: number
  weeklyAdded: number
  isLoading: boolean
  error: string | null
}

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats>({
    totalStories: 0,
    activeWriters: 0,
    weeklyAdded: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔧 useCommunityStats: Fetching community stats')
        setStats(prev => ({ ...prev, isLoading: true, error: null }))
        
        // Get total stories count
        const { count: totalStories, error: storiesError } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })

        if (storiesError) {
          console.error('Error getting total stories count:', storiesError)
        }

        // Get active writers count (simplified - just count unique authors)
        const { data: allStories, error: writersError } = await supabase
          .from('stories')
          .select('author_id')

        let activeWriters = 0
        if (!writersError && allStories) {
          const uniqueWriters = new Set(allStories.map(story => story.author_id))
          activeWriters = uniqueWriters.size
        }

        // Get weekly added stories count (simplified - just return total for now)
        const weeklyAdded = totalStories || 0 // For now, just show total stories

        const result = {
          totalStories: totalStories || 0,
          activeWriters: activeWriters || 0,
          weeklyAdded: weeklyAdded || 0
        }

        console.log('🔧 useCommunityStats: Success result:', result)
        
        setStats({
          ...result,
          isLoading: false,
          error: null
        })
        
      } catch (error) {
        console.error('Error fetching community stats:', error)
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load community stats'
        }))
      }
    }

    fetchStats()
  }, [])

  return stats
}
