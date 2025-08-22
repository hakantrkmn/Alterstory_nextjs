'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Users, Loader2, MessageSquare, Heart, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { type SearchResults } from '@/lib/api/search'

interface SearchResultsProps {
  results: SearchResults | null
  loading: boolean
  error: string | null
  onLoadMore: () => void
  hasMore: boolean
  query: string
}

export function SearchResults({ 
  results, 
  loading, 
  error, 
  onLoadMore, 
  hasMore, 
  query 
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState('all')

  if (loading && !results) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const totalResults = results.totalStories + results.totalUsers
  const hasStories = results.stories.length > 0
  const hasUsers = results.users.length > 0

  if (totalResults === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No results found</h3>
        <p className="text-muted-foreground mb-4">
          No stories or users found for "{query}"
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search terms or filters
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasStories && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {results.totalStories} stories
            </span>
          )}
          {hasUsers && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {results.totalUsers} users
            </span>
          )}
        </div>
      </div>

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" disabled={!hasStories || !hasUsers}>
            All ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="stories" disabled={!hasStories}>
            Stories ({results.totalStories})
          </TabsTrigger>
          <TabsTrigger value="users" disabled={!hasUsers}>
            Users ({results.totalUsers})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Stories Section */}
          {hasStories && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Stories ({results.totalStories})
              </h3>
              <div className="grid gap-4">
                {results.stories.map((story) => (
                  <StoryResultCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {hasUsers && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({results.totalUsers})
              </h3>
              <div className="grid gap-4">
                {results.users.map((user) => (
                  <UserResultCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <div className="grid gap-4">
            {results.stories.map((story) => (
              <StoryResultCard key={story.id} story={story} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {results.users.map((user) => (
              <UserResultCard key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
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
              'Load More Results'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Story Result Card Component
function StoryResultCard({ story }: { story: SearchResults['stories'][0] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              <Link 
                href={`/story/${story.id}`}
                className="hover:text-primary transition-colors"
              >
                {story.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>By {story.profiles.display_name || story.profiles.username}</span>
              <span>{formatDate(story.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {story.continuation_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {story.continuation_count} branches
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {story.content}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {story.like_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="h-3 w-3" />
            {story.dislike_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {story.continuation_count || 0} continuations
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// User Result Card Component
function UserResultCard({ user }: { user: SearchResults['users'][0] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const createdStoriesCount = user.created_stories[0]?.count || 0
  const contributionsCount = user.contributions[0]?.count || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback>
              {user.display_name?.charAt(0) || user.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">
                <Link 
                  href={`/profile/${user.username}`}
                  className="hover:text-primary transition-colors"
                >
                  {user.display_name || user.username}
                </Link>
              </h3>
              <span className="text-sm text-muted-foreground">@{user.username}</span>
            </div>
            {user.bio && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Joined {formatDate(user.created_at)}</span>
              <span>{createdStoriesCount} stories</span>
              <span>{contributionsCount} contributions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
