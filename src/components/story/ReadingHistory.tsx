'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Clock, Trash2, ExternalLink } from 'lucide-react'
import { useReadingHistory } from '@/lib/hooks/useReadingHistory'

interface ReadingHistoryProps {
  currentStoryId?: string
  onStorySelect?: (storyId: string) => void
}

export function ReadingHistory({ currentStoryId, onStorySelect }: ReadingHistoryProps) {
  const router = useRouter()
  const { 
    history, 
    getRecentStories, 
    removeFromHistory, 
    clearHistory,
    isInHistory 
  } = useReadingHistory()
  
  const [showAll, setShowAll] = useState(false)
  const recentStories = getRecentStories(showAll ? undefined : 5)

  const handleStoryClick = (storyId: string) => {
    if (onStorySelect) {
      onStorySelect(storyId)
    } else {
      router.push(`/story/${storyId}`)
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Reading History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No reading history yet</p>
            <p className="text-sm text-gray-500">
              Start reading stories to build your history
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Reading History</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentStories.map((item) => (
            <div
              key={item.storyId}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer
                ${currentStoryId === item.storyId 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'hover:bg-gray-50 border-gray-200'
                }
              `}
              onClick={() => handleStoryClick(item.storyId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm truncate">
                    {item.title}
                  </h4>
                  {currentStoryId === item.storyId && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                  {isInHistory(item.storyId) && (
                    <Badge variant="outline" className="text-xs">
                      Visited
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatTimeAgo(item.timestamp)}</span>
                  <span>•</span>
                  <span>Story ID: {item.storyId.slice(0, 8)}...</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStoryClick(item.storyId)
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromHistory(item.storyId)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {!showAll && history.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
            >
              Show {history.length - 5} More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
