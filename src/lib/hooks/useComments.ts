import { useState, useCallback } from 'react'
import { 
  addComment, 
  getStoryComments, 
  updateComment, 
  deleteComment,
  getUserComments,
  getStoryCommentCount,
  searchComments,
  type AppError
} from '@/lib/api'
import type { AddCommentInput } from '@/types/database'

export const useComments = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const createComment = useCallback(async (commentInput: AddCommentInput) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await addComment(commentInput)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to add comment' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStoryComments = useCallback(async (storyId: string, page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoryComments(storyId, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get comments' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const editComment = useCallback(async (commentId: string, userId: string, content: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await updateComment(commentId, userId, content)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to update comment' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const removeComment = useCallback(async (commentId: string, userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await deleteComment(commentId, userId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to delete comment' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserComments = useCallback(async (userId: string, page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getUserComments(userId, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get user comments' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCommentCount = useCallback(async (storyId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoryCommentCount(storyId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get comment count' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const searchCommentsByQuery = useCallback(async (query: string, page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await searchComments(query, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to search comments' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    createComment,
    fetchStoryComments,
    editComment,
    removeComment,
    fetchUserComments,
    fetchCommentCount,
    searchCommentsByQuery,
    clearError
  }
}
