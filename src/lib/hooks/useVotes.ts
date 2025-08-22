import { useState, useCallback } from 'react'
import { 
  voteOnStory, 
  removeVote, 
  getUserVote, 
  getStoryVoteStats,
  getUserVotingHistory,
  getStoriesByVotes,
  type AppError
} from '@/lib/api'

export const useVotes = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const voteStory = useCallback(async (storyId: string, userId: string, voteType: "like" | "dislike") => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await voteOnStory(storyId, userId, voteType)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to vote on story' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const removeUserVote = useCallback(async (storyId: string, userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await removeVote(storyId, userId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to remove vote' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserVote = useCallback(async (storyId: string, userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getUserVote(storyId, userId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get user vote' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchVoteStats = useCallback(async (storyId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoryVoteStats(storyId)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get vote statistics' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchVotingHistory = useCallback(async (userId: string, page: number = 0, limit: number = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getUserVotingHistory(userId, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get voting history' }
      setError(error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStoriesByVotes = useCallback(async (
    voteType: "like" | "dislike" = "like",
    timeFrame: "all" | "today" | "week" | "month" = "all",
    page: number = 0,
    limit: number = 20
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getStoriesByVotes(voteType, timeFrame, page, limit)
      if (result.error) {
        setError(result.error)
        return { data: null, error: result.error }
      }
      return { data: result.data, error: null }
    } catch {
      const error = { code: 'NETWORK_ERROR', message: 'Failed to get stories by votes' }
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
    voteStory,
    removeUserVote,
    fetchUserVote,
    fetchVoteStats,
    fetchVotingHistory,
    fetchStoriesByVotes,
    clearError
  }
}
