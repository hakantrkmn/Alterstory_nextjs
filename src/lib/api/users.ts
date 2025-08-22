import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { ErrorCodes } from './stories'

const supabase = createClient()

// Get user profile with statistics
export const getUserProfile = async (username: string) => {
  try {
    // Validate inputs
    if (!username?.trim()) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Username is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        created_stories:stories!author_id (count),
        contributions:story_contributions (count),
        received_likes:stories!author_id (like_count)
      `)
      .eq("username", username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: { code: ErrorCodes.NOT_FOUND, message: "User not found" } }
      }
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user profile" } 
    }
  }
}

// Get user's created stories
export const getUserCreatedStories = async (userId: string, page: number = 0, limit: number = 20) => {
  try {
    // Validate inputs
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "User ID is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url)
      `)
      .eq("author_id", userId)
      .is("parent_id", null) // Only root stories
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user stories" } 
    }
  }
}

// Get user's contributions (continuations)
export const getUserContributions = async (userId: string, page: number = 0, limit: number = 20) => {
  try {
    // Validate inputs
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "User ID is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("story_contributions")
      .select(`
        *,
        story:story_id (
          *,
          profiles:author_id (username, display_name, avatar_url)
        )
      `)
      .eq("user_id", userId)
      .eq("contribution_type", "continue")
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user contributions" } 
    }
  }
}

// Get user statistics
export const getUserStatistics = async (userId: string) => {
  try {
    // Validate inputs
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "User ID is required" 
        } 
      }
    }

    // Get various statistics
    const [
      { count: createdStories },
      { count: contributions },
      { count: votes },
      { count: comments },
      { data: totalLikesReceived }
    ] = await Promise.all([
      supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .is("parent_id", null),
      supabase
        .from("story_contributions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("contribution_type", "continue"),
      supabase
        .from("story_votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("stories")
        .select("like_count")
        .eq("author_id", userId)
    ])

    const totalLikes = totalLikesReceived?.reduce((sum, story) => sum + (story.like_count || 0), 0) || 0

    const stats = {
      createdStories: createdStories || 0,
      contributions: contributions || 0,
      votes: votes || 0,
      comments: comments || 0,
      totalLikesReceived: totalLikes
    }

    return { data: stats, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user statistics" } 
    }
  }
}

// Search users
export const searchUsers = async (query: string, page: number = 0, limit: number = 20) => {
  try {
    // Validate inputs
    if (!query?.trim()) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Search query is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        created_stories:stories!author_id (count),
        contributions:story_contributions (count)
      `)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to search users" } 
    }
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    // Validate inputs
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "User ID is required" 
        } 
      }
    }

    // Validate update fields
    if (updates.username && updates.username.length > 50) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Username cannot exceed 50 characters" 
        } 
      }
    }

    if (updates.display_name && updates.display_name.length > 100) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Display name cannot exceed 100 characters" 
        } 
      }
    }

    if (updates.bio && updates.bio.length > 500) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Bio cannot exceed 500 characters" 
        } 
      }
    }

    // Check if username is already taken (if updating username)
    if (updates.username) {
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", updates.username)

      if (checkError) {
        console.warn("Username check failed:", checkError)
        // Continue with update even if check fails
      } else if (existingUsers && existingUsers.length > 0) {
        // Check if any of the existing users is not the current user
        const otherUser = existingUsers.find(user => user.id !== userId)
        if (otherUser) {
          return { 
            data: null, 
            error: { 
              code: ErrorCodes.VALIDATION_ERROR, 
              message: "Username is already taken" 
            } 
          }
        }
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to update user profile" } 
    }
  }
}

// Get user by ID
export const getUserById = async (userId: string) => {
  try {
    // Validate inputs
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "User ID is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: { code: ErrorCodes.NOT_FOUND, message: "User not found" } }
      }
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user" } 
    }
  }
}
