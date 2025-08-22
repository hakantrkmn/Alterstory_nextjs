'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReadingHistoryItem {
  storyId: string
  title: string
  timestamp: number
  storyRootId: string
}

interface UseReadingHistoryReturn {
  history: ReadingHistoryItem[]
  addToHistory: (storyId: string, title: string, storyRootId: string) => void
  removeFromHistory: (storyId: string) => void
  clearHistory: () => void
  getRecentStories: (limit?: number) => ReadingHistoryItem[]
  getStoriesByRoot: (storyRootId: string) => ReadingHistoryItem[]
  isInHistory: (storyId: string) => boolean
}

const HISTORY_STORAGE_KEY = 'alterstory_reading_history'
const MAX_HISTORY_SIZE = 50

export function useReadingHistory(): UseReadingHistoryReturn {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load reading history:', error)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save reading history:', error)
    }
  }, [history])

  const addToHistory = useCallback((storyId: string, title: string, storyRootId: string) => {
    setHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(item => item.storyId !== storyId)
      
      // Add new entry at the beginning
      const newItem: ReadingHistoryItem = {
        storyId,
        title,
        storyRootId,
        timestamp: Date.now()
      }
      
      // Keep only the most recent entries
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_SIZE)
      
      return updated
    })
  }, [])

  const removeFromHistory = useCallback((storyId: string) => {
    setHistory(prev => prev.filter(item => item.storyId !== storyId))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const getRecentStories = useCallback((limit: number = 10) => {
    return history.slice(0, limit)
  }, [history])

  const getStoriesByRoot = useCallback((storyRootId: string) => {
    return history.filter(item => item.storyRootId === storyRootId)
  }, [history])

  const isInHistory = useCallback((storyId: string) => {
    return history.some(item => item.storyId === storyId)
  }, [history])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentStories,
    getStoriesByRoot,
    isInHistory
  }
}
