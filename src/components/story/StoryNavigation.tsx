'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ChevronRight, 
  Home, 
  Map, 
  Clock,
  ArrowLeft,
  ArrowRight,
  Layers
} from 'lucide-react'
import { useReadingHistory } from '@/lib/hooks/useReadingHistory'
import type { Story } from '@/types/database'

interface StoryNavigationProps {
  currentStory: Story & {
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
  }
  breadcrumbs: (Story & {
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
  })[]
  onStorySelect: (storyId: string) => void
  onShowTreeView: () => void
  onShowHistory: () => void
}

export function StoryNavigation({ 
  currentStory, 
  breadcrumbs, 
  onStorySelect,
  onShowTreeView,
  onShowHistory
}: StoryNavigationProps) {
  const { getStoriesByRoot, addToHistory } = useReadingHistory()

  // Add current story to reading history
  useEffect(() => {
    addToHistory(currentStory.id, currentStory.title, currentStory.story_root_id)
  }, [currentStory.id, currentStory.title, currentStory.story_root_id, addToHistory])

  // Get stories from the same root for navigation
  const sameRootStories = getStoriesByRoot(currentStory.story_root_id)

  const canGoBack = breadcrumbs.length > 1
  const canGoForward = currentStory.continuation_count > 0

  const handleBack = () => {
    if (canGoBack) {
      const parentStory = breadcrumbs[breadcrumbs.length - 2]
      onStorySelect(parentStory.id)
    }
  }

  const handleForward = () => {
    if (canGoForward) {
      // Navigate to the first continuation - this would need to be implemented
      // For now, we'll just show a message or disable the button
      console.log('Forward navigation not implemented yet')
    }
  }

  const handleGoToRoot = () => {
    const rootStory = breadcrumbs[0]
    onStorySelect(rootStory.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Main Navigation Bar */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left Navigation */}
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToRoot}
                disabled={currentStory.level === 0}
                className="flex items-center space-x-1 text-xs"
              >
                <Home className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Root</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={!canGoBack}
                className="flex items-center space-x-1 text-xs"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleForward}
                disabled={!canGoForward}
                className="flex items-center space-x-1 text-xs"
              >
                <span className="hidden sm:inline">Forward</span>
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Center - Story Info */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-medium line-clamp-1">{currentStory.title}</div>
                <div className="text-xs text-gray-500">
                  Level {currentStory.level} • {formatDate(currentStory.created_at)}
                </div>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center justify-center gap-2 md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onShowTreeView}
                className="flex items-center space-x-1 text-xs"
              >
                <Map className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Tree View</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHistory}
                className="flex items-center space-x-1 text-xs"
              >
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Layers className="h-4 w-4" />
              <span>Story Path</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center space-x-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <button
                    onClick={() => onStorySelect(crumb.id)}
                    className={`
                      flex items-center space-x-2 px-2 py-1 rounded-md transition-colors text-xs
                      ${index === breadcrumbs.length - 1
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <Avatar className="h-4 w-4 md:h-5 md:w-5">
                      <AvatarImage src={crumb.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {crumb.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-20 md:max-w-32">{crumb.title}</span>
                    {index === breadcrumbs.length - 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </button>
                </div>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-xs md:text-sm">Level:</span>
                <Badge variant="outline" className="text-xs">{currentStory.level}</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-xs md:text-sm">Continuations:</span>
                <Badge variant="outline" className="text-xs">
                  {currentStory.continuation_count}/{currentStory.max_continuations}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-xs md:text-sm">Likes:</span>
                <Badge variant="outline" className="text-xs">👍 {currentStory.like_count}</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-xs md:text-sm">Dislikes:</span>
                <Badge variant="outline" className="text-xs">👎 {currentStory.dislike_count}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs md:text-sm">Author:</span>
              <div className="flex items-center space-x-1">
                <Avatar className="h-4 w-4 md:h-5 md:w-5">
                  <AvatarImage src={currentStory.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {currentStory.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs md:text-sm font-medium">
                  {currentStory.profiles?.display_name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
