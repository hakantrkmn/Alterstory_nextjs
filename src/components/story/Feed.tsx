'use client'

import { useState, useEffect } from 'react'
import { StoryCard } from './StoryCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoriesForFeed, searchStories, type SortOption } from '@/lib/api/stories'
import { RefreshCw, Search, Loader2 } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState(false)

  const loadStories = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true)
      
      let result
      if (searchQuery.trim() && searchMode) {
        result = await searchStories(searchQuery, pageNum, 20)
      } else {
        result = await getStoriesForFeed(pageNum, 20, sortBy)
      }

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
    loadStories(0, true)
  }, [sortBy, searchMode])

  const handleRefresh = () => {
    setRefreshing(true)
    setPage(0)
    setHasMore(true)
    loadStories(0, true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadStories(page + 1, false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchMode(true)
      setPage(0)
      setHasMore(true)
      loadStories(0, true)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    setPage(0)
    setHasMore(true)
    loadStories(0, true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
          <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
            Search
          </Button>
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
      {searchMode && searchQuery && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            Showing results for "{searchQuery}"
          </span>
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Stories Grid */}
      {loading && page === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchMode && searchQuery 
              ? `No stories found for "${searchQuery}"`
              : 'No stories available yet.'
            }
          </p>
          {searchMode && searchQuery && (
            <Button variant="outline" onClick={handleClearSearch} className="mt-2">
              Clear Search
            </Button>
          )}
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
    </div>
  )
}
