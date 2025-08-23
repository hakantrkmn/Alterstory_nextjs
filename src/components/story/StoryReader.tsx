'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StoryContinuationForm } from './StoryContinuationForm'
import { StoryNavigation } from './StoryNavigation'
import { StoryTreeVisualization } from './StoryTreeVisualization'
import { ReadingHistory } from './ReadingHistory'
import { VotingButtons } from './VotingButtons'
import { CommentsSection } from './CommentsSection'
import { useAuth } from '@/lib/auth/context'
import type { Story } from '@/types/database'
import { eventBus } from '@/lib/hooks/eventbus'
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates'

interface StoryReaderProps {
  story: Story & {
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
    continuations?: (Story & {
      profiles: {
        username: string
        display_name: string
        avatar_url?: string
      }
    })[]
  }
  breadcrumbs?: (Story & {
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
  })[]
}

export function StoryReader({ story, breadcrumbs = [] }: StoryReaderProps) {
  useRealtimeUpdates()
  const { user } = useAuth()
  const router = useRouter()
  const [showContinuationForm, setShowContinuationForm] = useState(false)
  const [activeTab, setActiveTab] = useState('story')
  const [showTreeView, setShowTreeView] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [currentStory, setCurrentStory] = useState(story)
  const [userContributionStatus, setUserContributionStatus] = useState<{
    hasContributed: boolean
    contributionType: 'create' | 'continue' | null
    isLoading: boolean
  }>({
    hasContributed: false,
    contributionType: null,
    isLoading: true
  })

  // Check user contribution status
  useEffect(() => {
    const checkContribution = async () => {
      if (!user) {
        setUserContributionStatus({ hasContributed: false, contributionType: null, isLoading: false })
        return
      }

      try {
        const response = await fetch(`/api/stories/${currentStory.story_root_id}/contribution-status`)
        if (!response.ok) {
          throw new Error('Failed to check contribution status')
        }
        
        const result = await response.json()
        if (result.error) {
          throw new Error(result.error.message)
        }

        setUserContributionStatus({
          hasContributed: result.hasContributed,
          contributionType: result.contributionType || null,
          isLoading: false
        })
      } catch (err) {
        console.error('Failed to check contribution status:', err)
        setUserContributionStatus({ hasContributed: false, contributionType: null, isLoading: false })
      }
    }

    checkContribution()
  }, [user, currentStory.id])

  useEffect(() => {
    const handleVoteUpdate = (payload: { story_id: string; like_count: number; dislike_count: number }) => {
      if (payload.story_id === currentStory.id) {
        setCurrentStory(prev => ({
          ...prev,
          like_count: payload.like_count,
          dislike_count: payload.dislike_count
        }))
      }
    }
    const handleCommentCountUpdate = (payload: { story_id: string; comment_count: number }) => {
      if (payload.story_id === currentStory.id) {
        setCurrentStory(prev => ({
          ...prev,
          comment_count: payload.comment_count
        }))
      }
    }
    eventBus.on('voteUpdate', handleVoteUpdate)
    eventBus.on('commentCountUpdate', handleCommentCountUpdate)
    return () => {
      eventBus.off('voteUpdate', handleVoteUpdate)
      eventBus.off('commentCountUpdate', handleCommentCountUpdate)
    }
  }, [currentStory.id])



  const canContinue = !userContributionStatus.hasContributed && 
                     currentStory.continuation_count < currentStory.max_continuations &&
                     !userContributionStatus.isLoading

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleContinuationSuccess = (storyId: string) => {
    setShowContinuationForm(false)
    router.push(`/story/${storyId}`)
  }

  const handleStorySelect = (storyId: string) => {
    router.push(`/story/${storyId}`)
  }

  const handleShowTreeView = () => {
    setShowTreeView(true)
    setShowHistory(false)
    setActiveTab('tree')
  }

  const handleShowHistory = () => {
    setShowHistory(true)
    setShowTreeView(false)
    setActiveTab('history')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Enhanced Navigation */}
      <StoryNavigation
        currentStory={currentStory}
        breadcrumbs={breadcrumbs}
        onStorySelect={handleStorySelect}
        onShowTreeView={handleShowTreeView}
        onShowHistory={handleShowHistory}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="story" className="text-xs sm:text-sm py-2">Story</TabsTrigger>
          <TabsTrigger value="tree" className="text-xs sm:text-sm py-2">Tree View</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm py-2">History</TabsTrigger>
        </TabsList>

        {/* Story Tab */}
        <TabsContent value="story" className="space-y-4 md:space-y-6">
          {/* Main Story Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl md:text-2xl mb-2">{currentStory.title}</CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={currentStory.profiles.avatar_url} />
                        <AvatarFallback>
                          {currentStory.profiles.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{currentStory.profiles.display_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(currentStory.created_at)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Level {currentStory.level}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {currentStory.like_count} likes
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentStory.dislike_count} dislikes
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                  {currentStory.content}
                </p>
              </div>

              {/* Voting Buttons */}
              <div className="mb-6">
                <VotingButtons
                  storyId={currentStory.id}
                  initialLikeCount={currentStory.like_count}
                  initialDislikeCount={currentStory.dislike_count}
                />
              </div>

              {/* Story Stats */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-4">
                  <span>{currentStory.comment_count} comments</span>
                  <span>{currentStory.continuation_count} continuations</span>
                </div>
                <div className="flex items-center space-x-2">
                  {userContributionStatus.hasContributed && (
                    <Badge variant="secondary" className="text-xs">
                      {userContributionStatus.contributionType === 'create' 
                        ? 'You created this story' 
                        : 'You contributed to this story'
                      }
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Continuations Section */}
          {currentStory.continuations && currentStory.continuations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Continuations</CardTitle>
                <CardDescription>
                  Explore different paths this story can take
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {currentStory.continuations!.map((continuation) => (
                    <Card 
                      key={continuation.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/story/${continuation.id}`)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-base md:text-lg mb-2 line-clamp-2">
                          {continuation.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {continuation.content}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={continuation.profiles.avatar_url} />
                              <AvatarFallback>
                                {continuation.profiles.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{continuation.profiles.display_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>👍 {continuation.like_count}</span>
                            <span>👎 {continuation.dislike_count}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue Story Section */}
          <Card>
            <CardHeader>
              <CardTitle>Continue This Story</CardTitle>
              <CardDescription>
                {canContinue 
                  ? "Add your own continuation to this story"
                  : "This story cannot be continued at this time"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userContributionStatus.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : showContinuationForm ? (
                <StoryContinuationForm
                  parentStory={currentStory}
                  onSuccess={handleContinuationSuccess}
                  onCancel={() => setShowContinuationForm(false)}
                />
              ) : (
                <div className="text-center py-6 md:py-8">
                  {!user ? (
                    <div>
                      <p className="text-gray-600 mb-4">You must be logged in to continue this story.</p>
                      <Button onClick={() => router.push('/auth/login')} className="w-full sm:w-auto">
                        Sign In to Continue
                      </Button>
                    </div>
                  ) : userContributionStatus.hasContributed ? (
                    <div>
                      <p className="text-gray-600 mb-4">
                        {userContributionStatus.contributionType === 'create'
                          ? "You created this story. You cannot add continuations to your own story."
                          : "You have already contributed to this story. Each user can only contribute once per story tree."
                        }
                      </p>
                      <Button variant="outline" onClick={() => router.push('/feed')} className="w-full sm:w-auto">
                        Explore Other Stories
                      </Button>
                    </div>
                  ) : currentStory.continuation_count >= currentStory.max_continuations ? (
                    <div>
                      <p className="text-gray-600 mb-4">
                        This story has reached the maximum number of continuations ({currentStory.max_continuations}).
                      </p>
                      <Button variant="outline" onClick={() => router.push('/feed')} className="w-full sm:w-auto">
                        Explore Other Stories
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Add your own continuation to this story. Keep it engaging and build upon the existing narrative.
                      </p>
                      <Button onClick={() => setShowContinuationForm(true)} className="w-full sm:w-auto">
                        Continue Story
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
                    {/* Comments Section */}
                    <CommentsSection storyId={currentStory.id} />

        </TabsContent>

        {/* Tree View Tab */}
        <TabsContent value="tree" className="space-y-4 md:space-y-6">
          <StoryTreeVisualization
            storyRootId={currentStory.story_root_id}
            currentStoryId={currentStory.id}
            onStorySelect={handleStorySelect}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 md:space-y-6">
          <ReadingHistory
            currentStoryId={currentStory.id}
            onStorySelect={handleStorySelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
