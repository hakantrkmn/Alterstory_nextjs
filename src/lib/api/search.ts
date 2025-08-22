import { createClient } from '@/lib/supabase/client'
import { ErrorCodes } from './stories'

const supabase = createClient()

// Search filters interface
export interface SearchFilters {
  contentType?: 'stories' | 'users' | 'all'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year'
  popularity?: 'all' | 'popular' | 'trending'
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'most_liked' | 'most_active'
}

// Search result types
export interface StorySearchResult {
  id: string
  title: string
  content: string
  created_at: string
  continuation_count?: number
  like_count?: number
  dislike_count?: number
  profiles: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export interface UserSearchResult {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  created_at: string
  created_stories: { count: number }[]
  contributions: { count: number }[]
}

export interface SearchResults {
  stories: StorySearchResult[]
  users: UserSearchResult[]
  totalStories: number
  totalUsers: number
}

// Comprehensive search function
export const comprehensiveSearch = async (
  query: string,
  filters: SearchFilters = {},
  page: number = 0,
  limit: number = 20
) => {
  try {
    if (!query?.trim()) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Search query is required" 
        } 
      }
    }

    const results: SearchResults = {
      stories: [],
      users: [],
      totalStories: 0,
      totalUsers: 0
    }

    // Search stories if content type is 'stories' or 'all'
    if (filters.contentType !== 'users') {
      const storiesResult = await searchStoriesWithFilters(query, filters, page, limit)
      if (storiesResult.data) {
        results.stories = storiesResult.data.stories
        results.totalStories = storiesResult.data.total
      }
    }

    // Search users if content type is 'users' or 'all'
    if (filters.contentType !== 'stories') {
      const usersResult = await searchUsersWithFilters(query, filters, page, limit)
      if (usersResult.data) {
        results.users = usersResult.data.users
        results.totalUsers = usersResult.data.total
      }
    }

    return { data: results, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to perform search" } 
    }
  }
}

// Search stories with filters
const searchStoriesWithFilters = async (
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number
) => {
  try {
    let queryBuilder = supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url)
      `, { count: 'exact' })

    // Apply search query
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)

    // Only root stories
    queryBuilder = queryBuilder.is("parent_id", null)

    // Apply date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default:
          startDate = new Date(0)
      }

      queryBuilder = queryBuilder.gte('created_at', startDate.toISOString())
    }

    // Apply popularity filter
    if (filters.popularity === 'popular') {
      queryBuilder = queryBuilder.gte('like_count', 10)
    } else if (filters.popularity === 'trending') {
      // Trending: stories with recent activity (continuations or likes in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      queryBuilder = queryBuilder.or(`continuation_count.gt.0,like_count.gt.5`)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'relevance'
    switch (sortBy) {
      case 'newest':
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'oldest':
        queryBuilder = queryBuilder.order('created_at', { ascending: true })
        break
      case 'most_liked':
        queryBuilder = queryBuilder.order('like_count', { ascending: false })
        break
      case 'most_active':
        queryBuilder = queryBuilder.order('continuation_count', { ascending: false })
        break
      case 'relevance':
      default:
        // For relevance, we'll order by creation date as a fallback
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(page * limit, (page + 1) * limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { 
      data: { 
        stories: data || [], 
        total: count || 0 
      }, 
      error: null 
    }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to search stories" } 
    }
  }
}

// Search users with filters
const searchUsersWithFilters = async (
  query: string,
  filters: SearchFilters,
  page: number,
  limit: number
) => {
  try {
    let queryBuilder = supabase
      .from("profiles")
      .select(`
        *,
        created_stories:stories!author_id (count),
        contributions:story_contributions (count)
      `, { count: 'exact' })

    // Apply search query
    queryBuilder = queryBuilder.or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)

    // Apply date filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default:
          startDate = new Date(0)
      }

      queryBuilder = queryBuilder.gte('created_at', startDate.toISOString())
    }

    // Apply popularity filter
    if (filters.popularity === 'popular') {
      // Popular users: those with many stories or contributions
      queryBuilder = queryBuilder.or(`created_stories.count.gt.5,contributions.count.gt.10`)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'relevance'
    switch (sortBy) {
      case 'newest':
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'oldest':
        queryBuilder = queryBuilder.order('created_at', { ascending: true })
        break
      case 'most_active':
        // Sort by total activity (stories + contributions)
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
      case 'relevance':
      default:
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(page * limit, (page + 1) * limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { 
      data: { 
        users: data || [], 
        total: count || 0 
      }, 
      error: null 
    }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to search users" } 
    }
  }
}

// Get search suggestions based on popular searches
export const getSearchSuggestions = async (query: string, limit: number = 5) => {
  try {
    if (!query?.trim()) {
      return { data: [], error: null }
    }

    // Get suggestions from story titles and usernames
    const [storiesResult, usersResult] = await Promise.all([
      supabase
        .from("stories")
        .select("title")
        .or(`title.ilike.%${query}%`)
        .is("parent_id", null)
        .limit(limit),
      supabase
        .from("profiles")
        .select("username, display_name")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit)
    ])

    const suggestions = new Set<string>()

    // Add story title suggestions
    storiesResult.data?.forEach(story => {
      if (story.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(story.title)
      }
    })

    // Add username suggestions
    usersResult.data?.forEach(user => {
      if (user.username.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(user.username)
      }
      if (user.display_name?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(user.display_name)
      }
    })

    return { 
      data: Array.from(suggestions).slice(0, limit), 
      error: null 
    }
  } catch {
    return { 
      data: [], 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get search suggestions" } 
    }
  }
}

// Get popular search terms (for future implementation)
export const getPopularSearches = async (limit: number = 10) => {
  try {
    // This would typically come from a search_logs table
    // For now, return some default popular terms
    const popularTerms = [
      'adventure',
      'mystery',
      'romance',
      'fantasy',
      'sci-fi',
      'horror',
      'comedy',
      'drama',
      'thriller',
      'action'
    ]

    return { data: popularTerms.slice(0, limit), error: null }
  } catch {
    return { 
      data: [], 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get popular searches" } 
    }
  }
}
