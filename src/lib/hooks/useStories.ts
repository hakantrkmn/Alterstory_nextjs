import { useState, useCallback } from 'react'
import { 
  getStoriesForFeed, 
  getStoryWithContinuations, 
  createStory, 
  addContinuation,
  hasUserContributedToStory,
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
      const result = await addContinuation(continuationInput)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
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
      const result = await hasUserContributedToStory(userId, storyRootId)
      if (result.error) {
        setError(result.error)
        return { hasContributed: false, contributionType: null, error: result.error }
      }
      return { 
        hasContributed: result.hasContributed, 
        contributionType: result.contributionType,
        error: null 
      }
    } catch {
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
