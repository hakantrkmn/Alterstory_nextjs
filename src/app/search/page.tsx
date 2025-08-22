'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { SearchInterface, SearchResults } from '@/components/search'
import { useSearch } from '@/lib/hooks/useSearch'
import { type SearchFilters } from '@/lib/api/search'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const {
    searchResults,
    loading,
    error,
    hasMore,
    search,
    loadMore
  } = useSearch()

  // Handle initial search from URL params
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery, {})
    }
  }, [initialQuery, search])

  const handleSearch = (query: string, filters: SearchFilters) => {
    search(query, filters)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find stories, users, and content across the platform
        </p>
      </div>

      {/* Search Interface */}
      <div className="mb-8">
        <SearchInterface 
          onSearch={handleSearch}
          initialQuery={initialQuery}
          showFilters={true}
        />
      </div>

      {/* Search Results */}
      <SearchResults
        results={searchResults}
        loading={loading}
        error={error}
        onLoadMore={loadMore}
        hasMore={hasMore}
        query={initialQuery}
      />
    </div>
  )
}
