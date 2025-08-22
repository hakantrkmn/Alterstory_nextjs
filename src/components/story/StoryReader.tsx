'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StoryContinuationForm } from './StoryContinuationForm'
import { hasUserContributedToStory } from '@/lib/api/stories'
import { useAuth } from '@/lib/auth/context'
import type { Story } from '@/types/database'

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
  breadcrumbs?: Story[]
}

export function StoryReader({ story, breadcrumbs = [] }: StoryReaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showContinuationForm, setShowContinuationForm] = useState(false)
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
        const result = await hasUserContributedToStory(user.id, story.story_root_id)
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
  }, [user, story.story_root_id])

  const canContinue = !userContributionStatus.hasContributed && 
                     story.continuation_count < story.max_continuations &&
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Story:</span>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center space-x-2">
              {index > 0 && <span>/</span>}
              <button
                onClick={() => router.push(`/story/${crumb.id}`)}
                className="hover:text-gray-700 hover:underline"
              >
                {crumb.title}
              </button>
            </div>
          ))}
        </nav>
      )}

      {/* Main Story Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{story.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={story.profiles.avatar_url} />
                    <AvatarFallback>
                      {story.profiles.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{story.profiles.display_name}</span>
                </div>
                <span>•</span>
                <span>{formatDate(story.created_at)}</span>
                <span>•</span>
                <span>Level {story.level}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {story.like_count} likes
              </Badge>
              <Badge variant="outline">
                {story.dislike_count} dislikes
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          {/* Story Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center space-x-4">
              <span>{story.comment_count} comments</span>
              <span>{story.continuation_count} continuations</span>
            </div>
            <div className="flex items-center space-x-2">
              {userContributionStatus.hasContributed && (
                <Badge variant="secondary">
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
      {story.continuations && story.continuations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continuations</CardTitle>
            <CardDescription>
              Explore different paths this story can take
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {story.continuations.map((continuation) => (
                <Card 
                  key={continuation.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/story/${continuation.id}`)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {continuation.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {continuation.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
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
              parentStory={story}
              onSuccess={handleContinuationSuccess}
              onCancel={() => setShowContinuationForm(false)}
            />
          ) : (
            <div className="text-center py-8">
              {!user ? (
                <div>
                  <p className="text-gray-600 mb-4">You must be logged in to continue this story.</p>
                  <Button onClick={() => router.push('/auth/login')}>
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
                  <Button variant="outline" onClick={() => router.push('/feed')}>
                    Explore Other Stories
                  </Button>
                </div>
              ) : story.continuation_count >= story.max_continuations ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    This story has reached the maximum number of continuations ({story.max_continuations}).
                  </p>
                  <Button variant="outline" onClick={() => router.push('/feed')}>
                    Explore Other Stories
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Add your own continuation to this story. Keep it engaging and build upon the existing narrative.
                  </p>
                  <Button onClick={() => setShowContinuationForm(true)}>
                    Continue Story
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
