import { createClient } from '@/lib/supabase/client'
import type { 
  CreateStoryInput, 
  AddContinuationInput
} from '@/types/database'

const supabase = createClient()

// Error types
export interface AppError {
  code: string
  message: string
  details?: unknown
}

export enum ErrorCodes {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN", 
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  ALREADY_CONTRIBUTED = "ALREADY_CONTRIBUTED",
  MAX_CONTINUATIONS_REACHED = "MAX_CONTINUATIONS_REACHED",
  NETWORK_ERROR = "NETWORK_ERROR",
}

// Validation functions
const validateStoryInput = (input: CreateStoryInput): AppError | null => {
  if (!input.title?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story title is required"
    }
  }
  
  if (!input.content?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story content is required"
    }
  }
  
  if (input.content.length > 800) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story content cannot exceed 800 characters"
    }
  }
  
  if (input.title.length > 200) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story title cannot exceed 200 characters"
    }
  }
  
  return null
}

const validateContinuationInput = (input: AddContinuationInput): AppError | null => {
  if (!input.title?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Continuation title is required"
    }
  }
  
  if (!input.content?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Continuation content is required"
    }
  }
  
  if (input.content.length > 800) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Continuation content cannot exceed 800 characters"
    }
  }
  
  if (input.title.length > 200) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Continuation title cannot exceed 200 characters"
    }
  }
  
  return null
}

// Get stories for feed (with pagination)
export const getStoriesForFeed = async (page: number = 0, limit: number = 20) => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url),
        story_votes (vote_type)
      `)
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
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to fetch stories" } 
    }
  }
}

// Get story with continuations
export const getStoryWithContinuations = async (storyId: string) => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url),
        continuations:stories!parent_id (
          *,
          profiles:author_id (username, display_name, avatar_url)
        ),
        comments (
          *,
          profiles:user_id (username, display_name, avatar_url)
        )
      `)
      .eq("id", storyId)
      .single()

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
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to fetch story" } 
    }
  }
}

// Create new story
export const createStory = async (story: CreateStoryInput) => {
  try {
    // Get current session to ensure authentication context
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { 
        data: null, 
        error: { code: ErrorCodes.UNAUTHORIZED, message: "Not authenticated" }
      }
    }

    // Validate input
    const validationError = validateStoryInput(story)
    if (validationError) {
      return { data: null, error: validationError }
    }

    // For root stories, we need to handle story_root_id specially
    if (!story.storyRootId) {
      // Generate a UUID for the story
      const tempId = crypto.randomUUID()
      
      const { data, error } = await supabase
        .from("stories")
        .insert({
          id: tempId,
          title: story.title.trim(),
          content: story.content.trim(),
          author_id: story.authorId,
          story_root_id: tempId, // Self-reference for root stories
          level: 0,
          position: 0,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
      }

      // Add contribution record for root story
      if (data) {
        const { error: contributionError } = await supabase
          .from("story_contributions")
          .insert({
            user_id: story.authorId,
            story_root_id: data.story_root_id,
            story_id: data.id,
            contribution_type: "create"
          })

        if (contributionError) {
          console.error("Failed to create contribution record:", contributionError)
        }
      }

      return { data, error: null }
    } else {
      // For continuation stories
      const { data, error } = await supabase
        .from("stories")
        .insert({
          title: story.title.trim(),
          content: story.content.trim(),
          author_id: story.authorId,
          parent_id: story.parentId,
          story_root_id: story.storyRootId,
          level: story.level || 0,
          position: story.position || 0,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
      }

      // Add contribution record for continuation story
      if (data) {
        const { error: contributionError } = await supabase
          .from("story_contributions")
          .insert({
            user_id: story.authorId,
            story_root_id: data.story_root_id,
            story_id: data.id,
            contribution_type: "create"
          })

        if (contributionError) {
          console.error("Failed to create contribution record:", contributionError)
        }
      }

      return { data, error: null }
    }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to create story" } 
    }
  }
}

// Add continuation
export const addContinuation = async (continuation: AddContinuationInput) => {
  try {
    // Get current session to ensure authentication context
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { 
        data: null, 
        error: { code: ErrorCodes.UNAUTHORIZED, message: "Not authenticated" }
      }
    }

    // Validate input
    const validationError = validateContinuationInput(continuation)
    if (validationError) {
      return { data: null, error: validationError }
    }

    // Check if user already contributed to this story tree
    const { data: existingContribution } = await supabase
      .from("story_contributions")
      .select("id")
      .eq("user_id", continuation.authorId)
      .eq("story_root_id", continuation.storyRootId)
      .single()

    if (existingContribution) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.ALREADY_CONTRIBUTED, 
          message: "You have already contributed to this story" 
        } 
      }
    }

    // Check if parent has reached max continuations
    const { data: parent } = await supabase
      .from("stories")
      .select("continuation_count, max_continuations")
      .eq("id", continuation.parentId)
      .single()

    if (parent && parent.continuation_count >= parent.max_continuations) {
      return { 
        data: null, 
        error: { 
          code: ErrorCodes.MAX_CONTINUATIONS_REACHED, 
          message: "Maximum continuations reached for this story" 
        } 
      }
    }

    const { data, error } = await supabase
      .from("stories")
      .insert({
        title: continuation.title.trim(),
        content: continuation.content.trim(),
        author_id: continuation.authorId,
        parent_id: continuation.parentId,
        story_root_id: continuation.storyRootId,
        level: continuation.level,
        position: parent?.continuation_count || 0,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    // Add contribution record
    if (data) {
      const { error: contributionError } = await supabase
        .from("story_contributions")
        .insert({
          user_id: continuation.authorId,
          story_root_id: continuation.storyRootId,
          story_id: data.id,
          contribution_type: "continue"
        })

      if (contributionError) {
        console.error("Failed to create contribution record:", contributionError)
      }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to add continuation" } 
    }
  }
}

// Check if user has contributed to a story tree
export const hasUserContributedToStory = async (userId: string, storyRootId: string) => {
  try {
    // Get current session to ensure authentication context
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { 
        hasContributed: false, 
        contributionType: null,
        error: { code: ErrorCodes.UNAUTHORIZED, message: "Not authenticated" }
      }
    }

    const { data, error } = await supabase
      .from("story_contributions")
      .select("id, contribution_type")
      .eq("user_id", userId)
      .eq("story_root_id", storyRootId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No contribution found
        return { 
          hasContributed: false, 
          contributionType: null,
          error: null 
        }
      }
      return { hasContributed: false, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { 
      hasContributed: !!data, 
      contributionType: data?.contribution_type,
      error: null 
    }
  } catch (err) {
    console.error('Error checking contribution status:', err)
    return { 
      hasContributed: false, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to check contribution status" } 
    }
  }
}

// Get story tree structure
export const getStoryTree = async (storyRootId: string) => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url),
        children:stories!parent_id (
          *,
          profiles:author_id (username, display_name, avatar_url)
        )
      `)
      .eq("story_root_id", storyRootId)
      .order("level, position")

    if (error) {
      return { data: null, error: { code: ErrorCodes.NETWORK_ERROR, message: error.message } }
    }

    return { data, error: null }
  } catch {
    return { 
      data: null, 
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to fetch story tree" } 
    }
  }
}

// Search stories
export const searchStories = async (query: string, page: number = 0, limit: number = 20) => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
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
      error: { code: ErrorCodes.NETWORK_ERROR, message: "Failed to search stories" } 
    }
  }
}
