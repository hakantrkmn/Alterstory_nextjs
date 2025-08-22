import { createClient } from '@/lib/supabase/client'
import type { AddCommentInput } from '@/types/database'
import { ErrorCodes, type AppError } from './stories'

const supabase = createClient()

// Validation function for comment input
const validateCommentInput = (input: AddCommentInput): AppError | null => {
  if (!input.content?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Comment content is required"
    }
  }
  
  if (input.content.length > 1000) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Comment content cannot exceed 1000 characters"
    }
  }
  
  return null
}

// Add comment
export const addComment = async (comment: AddCommentInput) => {
  try {
    // Validate input
    const validationError = validateCommentInput(comment)
    if (validationError) {
      return { data: null, error: validationError }
    }

    // Check if story exists
    const { data: storyExists } = await supabase
      .from("stories")
      .select("id")
      .eq("id", comment.storyId)
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

    const { data, error } = await supabase
      .from("comments")
      .insert({
        story_id: comment.storyId,
        user_id: comment.userId,
        content: comment.content.trim(),
      })
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to add comment" } 
    }
  }
}

// Get comments for a story
export const getStoryComments = async (storyId: string, page: number = 0, limit: number = 20) => {
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
      .from("comments")
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .eq("story_id", storyId)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get comments" } 
    }
  }
}

// Update comment
export const updateComment = async (commentId: string, userId: string, content: string) => {
  try {
    // Validate inputs
    if (!commentId || !userId || !content?.trim()) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Comment ID, user ID, and content are required" 
        } 
      }
    }

    if (content.length > 1000) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Comment content cannot exceed 1000 characters" 
        } 
      }
    }

    // Check if comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single()

    if (!existingComment) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.NOT_FOUND, 
          message: "Comment not found" 
        } 
      }
    }

    if (existingComment.user_id !== userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.FORBIDDEN, 
          message: "You can only edit your own comments" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", commentId)
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single()

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to update comment" } 
    }
  }
}

// Delete comment
export const deleteComment = async (commentId: string, userId: string) => {
  try {
    // Validate inputs
    if (!commentId || !userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.VALIDATION_ERROR, 
          message: "Comment ID and user ID are required" 
        } 
      }
    }

    // Check if comment exists and belongs to user
    const { data: existingComment } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single()

    if (!existingComment) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.NOT_FOUND, 
          message: "Comment not found" 
        } 
      }
    }

    if (existingComment.user_id !== userId) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.FORBIDDEN, 
          message: "You can only delete your own comments" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .select()
      .single()

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to delete comment" } 
    }
  }
}

// Get user's comments
export const getUserComments = async (userId: string, page: number = 0, limit: number = 20) => {
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
      .from("comments")
      .select(`
        *,
        stories (
          id,
          title,
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
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get user comments" } 
    }
  }
}

// Get comment count for a story
export const getStoryCommentCount = async (storyId: string) => {
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

    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data: count || 0, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to get comment count" } 
    }
  }
}

// Search comments
export const searchComments = async (query: string, page: number = 0, limit: number = 20) => {
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
      .from("comments")
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        stories (
          id,
          title,
          profiles:author_id (username, display_name)
        )
      `)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to search comments" } 
    }
  }
}
