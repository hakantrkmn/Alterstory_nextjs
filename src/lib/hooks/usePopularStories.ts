import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface Story {
  id: string
  title: string
  content: string
  created_at: string
  like_count: number
  dislike_count: number
  continuation_count: number
  profiles: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface PopularStories {
  stories: Story[]
  isLoading: boolean
  error: string | null
}

export function usePopularStories(limit: number = 10) {
  const [data, setData] = useState<PopularStories>({
    stories: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchPopularStories = async () => {
      try {
        console.log('🔧 usePopularStories: Fetching popular stories')
        setData(prev => ({ ...prev, isLoading: true, error: null }))
        
        const { data: stories, error } = await supabase
          .from('stories')
          .select(`
            id,
            title,
            content,
            created_at,
            like_count,
            dislike_count,
            continuation_count,
            profiles (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('level', 0) // Only root stories
          .order('like_count', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Error fetching popular stories:', error)
          throw error
        }

        console.log('🔧 usePopularStories: Success result:', stories)
        
        setData({
          stories: stories || [],
          isLoading: false,
          error: null
        })
        
      } catch (error) {
        console.error('Error fetching popular stories:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load popular stories'
        }))
      }
    }

    fetchPopularStories()
  }, [limit])

  return data
}
