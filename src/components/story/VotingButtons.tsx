'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useVotes } from '@/lib/hooks/useVotes'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'
import { eventBus } from '@/lib/hooks/eventbus'

interface VotingButtonsProps {
  storyId: string
  initialLikeCount: number
  initialDislikeCount: number
  className?: string
}

export function VotingButtons({ 
  storyId, 
  initialLikeCount, 
  initialDislikeCount, 
  className 
}: VotingButtonsProps) {
  const { user } = useAuth()
  const { voteStory, removeUserVote, fetchUserVote, loading } = useVotes()
  
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Real-time vote count updates
  useEffect(() => {
    const handleVoteUpdate = (payload: { story_id: string; like_count: number; dislike_count: number }) => {
      if (payload.story_id === storyId) {
        setLikeCount(payload.like_count)
        setDislikeCount(payload.dislike_count)
      }
    }
    eventBus.on('voteUpdate', handleVoteUpdate)
    return () => {
      eventBus.off('voteUpdate', handleVoteUpdate)
    }
  }, [storyId])


  // Fetch user's current vote on component mount
  useEffect(() => {
    if (user) {
      fetchUserVote(storyId, user.id).then(result => {
        if (result.data) {
          setUserVote(result.data)
        }
      })
    }
  }, [user, storyId, fetchUserVote])

  const handleVote = async (voteType: 'like' | 'dislike') => {
    console.log('handleVote called:', { voteType, user: user?.id, storyId, userVote, isLoading })
    
    if (!user || isLoading) {
      console.log('Early return - no user or loading')
      return
    }

    setIsLoading(true)
    
    try {
      // If user already voted the same way, remove the vote
      if (userVote === voteType) {
        console.log('Removing existing vote')
        const result = await removeUserVote(storyId, user.id)
        console.log('Remove vote result:', result)
        if (result.data) {
          setUserVote(null)
          // Real-time update will handle count changes automatically
        }
      } else {
        // If user voted differently or hasn't voted, update the vote
        console.log('Adding/updating vote')
        const result = await voteStory(storyId, user.id, voteType)
        console.log('Vote result:', result)
        if (result.data) {
          const previousVote = userVote
          setUserVote(voteType)
          // Real-time update will handle count changes automatically
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        <div className="flex items-center space-x-2">
          <ThumbsUp className="h-5 w-5 text-gray-400" />
          <Badge variant="outline">{likeCount}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <ThumbsDown className="h-5 w-5 text-gray-400" />
          <Badge variant="outline">{dislikeCount}</Badge>
        </div>
        <span className="text-sm text-gray-500">Sign in to vote</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('like')}
        disabled={isLoading}
        className={cn(
          "flex items-center space-x-2 transition-colors",
          userVote === 'like' && "text-green-600 bg-green-50 hover:bg-green-100",
          userVote === 'dislike' && "text-gray-400"
        )}
      >
        <ThumbsUp className={cn(
          "h-5 w-5",
          userVote === 'like' && "fill-current"
        )} />
        <Badge variant={userVote === 'like' ? 'default' : 'outline'}>
          {likeCount}
        </Badge>
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('dislike')}
        disabled={isLoading}
        className={cn(
          "flex items-center space-x-2 transition-colors",
          userVote === 'dislike' && "text-red-600 bg-red-50 hover:bg-red-100",
          userVote === 'like' && "text-gray-400"
        )}
      >
        <ThumbsDown className={cn(
          "h-5 w-5",
          userVote === 'dislike' && "fill-current"
        )} />
        <Badge 
  variant={userVote === 'dislike' ? 'outline' : 'outline'}
  className={cn(
    userVote === 'dislike' && "border-red-600 text-red-600 bg-red-50"
  )}
>
  {dislikeCount}
</Badge>
      </Button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      )}
    </div>
  )
}
