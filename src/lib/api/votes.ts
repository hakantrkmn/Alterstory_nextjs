import { createClient } from '@/lib/supabase/client'
import { ErrorCodes } from './stories'

const supabase = createClient()

// Vote on story
export const voteOnStory = async (
  storyId: string,
  userId: string,
  voteType: "like" | "dislike"
) => {
  try {
    // Validate inputs
    if (!storyId || !userId || !voteType) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Story ID, user ID, and vote type are required" 
        } 
      }
    }

    if (!["like", "dislike"].includes(voteType)) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Vote type must be 'like' or 'dislike'" 
        } 
      }
    }

    // Check if story exists
    const { data: storyExists } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .single()

    if (!storyExists) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.NOT_FOUND, 
          message: "Story not found" 
        } 
      }
    }

    // Check if user has already voted on this story
    const { data: existingVote } = await supabase
      .from("story_votes")
      .select("*")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .single()

    let data, error

    if (existingVote) {
      // Update existing vote
      const result = await supabase
        .from("story_votes")
        .update({ vote_type: voteType })
        .eq("story_id", storyId)
        .eq("user_id", userId)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new vote
      const result = await supabase
        .from("story_votes")
        .insert({
          story_id: storyId,
          user_id: userId,
          vote_type: voteType,
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to vote on story" } 
    }
  }
}

// Remove vote from story
export const removeVote = async (storyId: string, userId: string) => {
  try {
    // Validate inputs
    if (!storyId || !userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Story ID and user ID are required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("story_votes")
      .delete()
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .select()
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to remove vote" } 
    }
  }
}

// Get user's vote on a story
export const getUserVote = async (storyId: string, userId: string) => {
  try {
    // Validate inputs
    if (!storyId || !userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Story ID and user ID are required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("story_votes")
      .select("vote_type")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data: data?.vote_type || null, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user vote" } 
    }
  }
}

// Get story vote statistics
export const getStoryVoteStats = async (storyId: string) => {
  try {
    // Validate inputs
    if (!storyId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Story ID is required" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("stories")
      .select("like_count, dislike_count")
      .eq("id", storyId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: { code: ErrorCodes.NOT_FOUND, message: "Story not found" } }
      }
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get vote statistics" } 
    }
  }
}

// Get user's voting history
export const getUserVotingHistory = async (userId: string, page: number = 0, limit: number = 20) => {
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
      .from("story_votes")
      .select(`
        *,
        stories (
          id,
          title,
          content,
          profiles:author_id (username, display_name)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get voting history" } 
    }
  }
}

// Get stories sorted by votes
export const getStoriesByVotes = async (
  voteType: "like" | "dislike" = "like",
  timeFrame: "all" | "today" | "week" | "month" = "all",
  page: number = 0,
  limit: number = 20
) => {
  try {
    let query = supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url)
      `)
      .is("parent_id", null) // Only root stories

    // Apply time filter
    if (timeFrame !== "all") {
      const now = new Date()
      let startDate: Date

      switch (timeFrame) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      query = query.gte("created_at", startDate.toISOString())
    }

    // Order by vote count
    const orderColumn = voteType === "like" ? "like_count" : "dislike_count"
    query = query.order(orderColumn, { ascending: false })

    const { data, error } = await query.range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get stories by votes" } 
    }
  }
}
