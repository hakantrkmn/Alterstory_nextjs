'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  comprehensiveSearch, 
  getSearchSuggestions, 
  getPopularSearches,
  type SearchFilters,
  type SearchResults
} from '@/lib/api/search'

// Search history management
const SEARCH_HISTORY_KEY = 'alterstory_search_history'
const MAX_SEARCH_HISTORY = 10

const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

const saveSearchHistory = (query: string) => {
  if (typeof window === 'undefined') return
  try {
    const history = getSearchHistory()
    const filteredHistory = history.filter(item => item !== query)
    const newHistory = [query, ...filteredHistory].slice(0, MAX_SEARCH_HISTORY)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // Ignore localStorage errors
  }
}

const clearSearchHistory = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // Ignore localStorage errors
  }
}

export function useSearch() {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Load popular searches on mount
  useEffect(() => {
    const loadPopularSearches = async () => {
      const result = await getPopularSearches()
      if (result.data) {
        setPopularSearches(result.data)
      }
    }
    loadPopularSearches()
  }, [])

  // Perform search
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters = {},
    pageNum: number = 0,
    append: boolean = false
  ) => {
    if (!query.trim()) {
      setSearchResults(null)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await comprehensiveSearch(query, filters, pageNum, 20)

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (result.data) {
        if (append && searchResults) {
          setSearchResults({
            stories: [...searchResults.stories, ...result.data.stories],
            users: [...searchResults.users, ...result.data.users],
            totalStories: result.data.totalStories,
            totalUsers: result.data.totalUsers
          })
        } else {
          setSearchResults(result.data)
        }

        setHasMore(
          result.data.stories.length === 20 || 
          result.data.users.length === 20
        )
        setPage(pageNum)

        // Save to search history
        saveSearchHistory(query)
        setSearchHistory(getSearchHistory())
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchResults])

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    try {
      const result = await getSearchSuggestions(query, 5)
      if (result.data) {
        setSuggestions(result.data)
      }
    } catch {
      setSuggestions([])
    }
  }, [])

  // Load more results
  const loadMore = useCallback(() => {
    if (!loading && hasMore && currentQuery) {
      performSearch(currentQuery, currentFilters, page + 1, true)
    }
  }, [loading, hasMore, currentQuery, currentFilters, page, performSearch])

  // Search with query and filters
  const search = useCallback((query: string, filters: SearchFilters = {}) => {
    setCurrentQuery(query)
    setCurrentFilters(filters)
    setPage(0)
    setHasMore(true)
    performSearch(query, filters, 0, false)
  }, [performSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchResults(null)
    setCurrentQuery('')
    setCurrentFilters({})
    setPage(0)
    setHasMore(true)
    setError(null)
    setSuggestions([])
  }, [])

  // Clear search history
  const clearHistory = useCallback(() => {
    clearSearchHistory()
    setSearchHistory([])
  }, [])

  // Remove item from search history
  const removeFromHistory = useCallback((query: string) => {
    const newHistory = searchHistory.filter(item => item !== query)
    setSearchHistory(newHistory)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  }, [searchHistory])

  return {
    // State
    searchResults,
    loading,
    error,
    searchHistory,
    suggestions,
    popularSearches,
    currentQuery,
    currentFilters,
    hasMore,

    // Actions
    search,
    performSearch,
    getSuggestions,
    loadMore,
    clearSearch,
    clearHistory,
    removeFromHistory,

    // Computed
    totalResults: searchResults 
      ? searchResults.totalStories + searchResults.totalUsers 
      : 0,
    hasStories: searchResults?.stories.length > 0,
    hasUsers: searchResults?.users.length > 0
  }
}
