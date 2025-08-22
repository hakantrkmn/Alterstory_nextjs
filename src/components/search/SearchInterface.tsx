'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X, Clock, TrendingUp, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useSearch, type SearchFilters } from '@/lib/hooks/useSearch'

interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void
  initialQuery?: string
  showFilters?: boolean
  className?: string
}

export function SearchInterface({ 
  onSearch, 
  initialQuery = '', 
  showFilters = true,
  className = '' 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: 'all',
    dateRange: 'all',
    popularity: 'all',
    sortBy: 'relevance'
  })

  const { 
    suggestions, 
    searchHistory, 
    popularSearches,
    getSuggestions,
    removeFromHistory 
  } = useSearch()

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle input changes
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      getSuggestions(value)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), filters)
      setShowSuggestions(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion, filters)
    setShowSuggestions(false)
  }

  // Handle history item click
  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem)
    onSearch(historyItem, filters)
    setShowSuggestions(false)
  }

  // Handle popular search click
  const handlePopularClick = (popularItem: string) => {
    setQuery(popularItem)
    onSearch(popularItem, filters)
    setShowSuggestions(false)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (query.trim()) {
      onSearch(query.trim(), newFilters)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search stories, users, or content..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            if (query.trim() || searchHistory.length > 0 || popularSearches.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setShowSuggestions(false)
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvancedFilters && (
            <Card className="mt-2">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Content Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Type</label>
                    <Select value={filters.contentType} onValueChange={(value) => handleFilterChange('contentType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Content</SelectItem>
                        <SelectItem value="stories">Stories Only</SelectItem>
                        <SelectItem value="users">Users Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Popularity Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Popularity</label>
                    <Select value={filters.popularity} onValueChange={(value) => handleFilterChange('popularity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="most_liked">Most Liked</SelectItem>
                        <SelectItem value="most_active">Most Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-2 py-2 hover:bg-muted rounded text-sm flex items-center gap-2"
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </span>
              </div>
              {searchHistory.map((historyItem, index) => (
                <div key={index} className="flex items-center justify-between px-2 py-2 hover:bg-muted rounded">
                  <button
                    onClick={() => handleHistoryClick(historyItem)}
                    className="flex-1 text-left text-sm flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {historyItem}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromHistory(historyItem)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-1 px-2">
                {popularSearches.map((popularItem, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handlePopularClick(popularItem)}
                  >
                    {popularItem}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
