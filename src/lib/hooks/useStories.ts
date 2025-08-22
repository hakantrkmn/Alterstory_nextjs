import { useState, useCallback } from 'react'
import { 
  getStoriesForFeed, 
  getStoryWithContinuations, 
  createStory, 
  getStoryTree,
  searchStories,
  type AppError
} from '@/lib/api'
import type { CreateStoryInput, AddContinuationInput } from '@/types/database'

export const useStories = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const fetchStories = useCallback(async (page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoriesForFeed(page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to fetch stories' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStory = useCallback(async (storyId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoryWithContinuations(storyId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to fetch story' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const createNewStory = useCallback(async (storyInput: CreateStoryInput) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await createStory(storyInput)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to create story' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const addStoryContinuation = useCallback(async (continuationInput: AddContinuationInput) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/stories/${continuationInput.storyRootId}/add-continuation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: continuationInput.title,
          content: continuationInput.content,
          parentId: continuationInput.parentId,
          level: continuationInput.level
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const error = { code: 'NETWORK_ERROR', message: result.error?.message || 'Failed to add continuation' }
        setError(error)
        return { data: null, error }
      }

      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to add continuation' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const checkUserContribution = useCallback(async (userId: string, storyRootId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/stories/${storyRootId}/contribution-status`)
      if (!response.ok) {
        throw new Error('Failed to check contribution status')
      }
      
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error.message)
      }

      return { 
        hasContributed: result.hasContributed, 
        contributionType: result.contributionType,
        error: null 
      }
    } catch (err) {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to check contribution status' }
      setError(error)
      return { hasContributed: false, contributionType: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStoryTree = useCallback(async (storyRootId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoryTree(storyRootId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to fetch story tree' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const searchStoriesByQuery = useCallback(async (query: string, page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await searchStories(query, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to search stories' }
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
    fetchStories,
    fetchStory,
    createNewStory,
    addStoryContinuation,
    checkUserContribution,
    fetchStoryTree,
    searchStoriesByQuery,
    clearError
  }
}
