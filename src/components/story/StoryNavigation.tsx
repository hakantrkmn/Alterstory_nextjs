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
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToRoot}
                disabled={currentStory.level === 0}
                className="flex items-center space-x-1"
              >
                <Home className="h-4 w-4" />
                <span>Root</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={!canGoBack}
                className="flex items-center space-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleForward}
                disabled={!canGoForward}
                className="flex items-center space-x-1"
              >
                <span>Forward</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Center - Story Info */}
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-sm font-medium">{currentStory.title}</div>
                <div className="text-xs text-gray-500">
                  Level {currentStory.level} • {formatDate(currentStory.created_at)}
                </div>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onShowTreeView}
                className="flex items-center space-x-1"
              >
                <Map className="h-4 w-4" />
                <span>Tree View</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHistory}
                className="flex items-center space-x-1"
              >
                <Clock className="h-4 w-4" />
                <span>History</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Layers className="h-4 w-4" />
              <span>Story Path</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center space-x-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <button
                    onClick={() => onStorySelect(crumb.id)}
                    className={`
                      flex items-center space-x-2 px-3 py-1 rounded-md transition-colors
                      ${index === breadcrumbs.length - 1
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={crumb.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {crumb.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-32">{crumb.title}</span>
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Level:</span>
                <Badge variant="outline">{currentStory.level}</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Continuations:</span>
                <Badge variant="outline">
                  {currentStory.continuation_count}/{currentStory.max_continuations}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Likes:</span>
                <Badge variant="outline">👍 {currentStory.like_count}</Badge>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Dislikes:</span>
                <Badge variant="outline">👎 {currentStory.dislike_count}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Author:</span>
              <div className="flex items-center space-x-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={currentStory.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {currentStory.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
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
