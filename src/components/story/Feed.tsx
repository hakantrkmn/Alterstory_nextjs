'use client'

import { useState, useEffect } from 'react'
import { StoryCard } from './StoryCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoriesForFeed, type SortOption } from '@/lib/api/stories'
import { RefreshCw, Loader2, Search } from 'lucide-react'
import { SearchInterface } from '@/components/search'
import { useSearch } from '@/lib/hooks/useSearch'
import { type SearchFilters } from '@/lib/api/search'
import { SearchResults } from '@/components/search'

interface Story {
  id: string
  title: string
  content: string
  created_at: string
  continuation_count?: number
  like_count?: number
  dislike_count?: number
  profiles: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export function Feed() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchMode, setSearchMode] = useState(false)
  
  const { 
    searchResults, 
    loading: searchLoading,
    error: searchError,
    hasMore: searchHasMore,
    search: performSearch,
    loadMore: searchLoadMore
  } = useSearch()

  const loadStories = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true)
      
      const result = await getStoriesForFeed(pageNum, 20, sortBy)

      if (result.error) {
        console.error('Failed to load stories:', result.error)
        return
      }

      const newStories = result.data || []
      
      if (reset) {
        setStories(newStories)
      } else {
        setStories(prev => [...prev, ...newStories])
      }
      
      setHasMore(newStories.length === 20)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!searchMode) {
      loadStories(0, true)
    }
  }, [sortBy, searchMode])

  const handleRefresh = () => {
    setRefreshing(true)
    setPage(0)
    setHasMore(true)
    if (!searchMode) {
      loadStories(0, true)
    }
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      if (searchMode) {
        searchLoadMore()
      } else {
        loadStories(page + 1, false)
      }
    }
  }

  const handleSearch = (query: string, filters: SearchFilters) => {
    if (query.trim()) {
      setSearchMode(true)
      performSearch(query, filters)
    }
  }

  const handleClearSearch = () => {
    setSearchMode(false)
    setPage(0)
    setHasMore(true)
    loadStories(0, true)
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInterface 
            onSearch={handleSearch}
            showFilters={false}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
              <SelectItem value="most_active">Most Active</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Mode Indicator */}
      {searchMode && searchResults && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            Showing search results
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Content */}
      {searchMode ? (
        // Show search results
        <SearchResults
          results={searchResults}
          loading={searchLoading}
          error={searchError}
          onLoadMore={searchLoadMore}
          hasMore={searchHasMore}
          query=""
        />
      ) : (
        // Show regular feed
        <>
          {loading && page === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No stories available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More Stories'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
