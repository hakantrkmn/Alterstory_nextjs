'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { addContinuation, hasUserContributedToStory } from '@/lib/api/stories'
import { useAuth } from '@/lib/auth/context'
import type { Story } from '@/types/database'

const MAX_TITLE_LENGTH = 200
const MAX_CONTENT_LENGTH = 800

interface StoryContinuationFormProps {
  parentStory: Story
  onSuccess?: (storyId: string) => void
  onCancel?: () => void
}

export function StoryContinuationForm({ parentStory, onSuccess, onCancel }: StoryContinuationFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingContribution, setIsCheckingContribution] = useState(true)
  const [hasContributed, setHasContributed] = useState(false)
  const [contributionType, setContributionType] = useState<'create' | 'continue' | null>(null)
  
  const titleLength = title.length
  const contentLength = content.length
  const isTitleValid = titleLength > 0 && titleLength <= MAX_TITLE_LENGTH
  const isContentValid = contentLength > 0 && contentLength <= MAX_CONTENT_LENGTH
  const canSubmit = isTitleValid && isContentValid && !isSubmitting && user && !hasContributed

  // Check if user has already contributed to this story tree
  useEffect(() => {
    const checkContribution = async () => {
      if (!user) {
        setIsCheckingContribution(false)
        return
      }

      try {
        const result = await hasUserContributedToStory(user.id, parentStory.story_root_id)
        
        if (result.error) {
          console.error('Error checking contribution:', result.error)
          return
        }

        setHasContributed(result.hasContributed)
        setContributionType(result.contributionType || null)
      } catch (err) {
        console.error('Failed to check contribution status:', err)
      } finally {
        setIsCheckingContribution(false)
      }
    }

    checkContribution()
  }, [user, parentStory.story_root_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to continue a story')
      return
    }

    if (hasContributed) {
      setError('You have already contributed to this story')
      return
    }

    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addContinuation({
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        parentId: parentStory.id,
        storyRootId: parentStory.story_root_id,
        level: parentStory.level + 1
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (result.data) {
        // Clear form
        setTitle('')
        setContent('')
        
        // Call success callback or redirect
        if (onSuccess) {
          onSuccess(result.data.id)
        } else {
          router.push(`/story/${result.data.id}`)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitleColor = () => {
    if (titleLength === 0) return 'text-muted-foreground'
    if (titleLength > MAX_TITLE_LENGTH) return 'text-red-500'
    if (titleLength > MAX_TITLE_LENGTH * 0.9) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getContentColor = () => {
    if (contentLength === 0) return 'text-muted-foreground'
    if (contentLength > MAX_CONTENT_LENGTH) return 'text-red-500'
    if (contentLength > MAX_CONTENT_LENGTH * 0.9) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Loading state while checking contribution
  if (isCheckingContribution) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking contribution status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Continue Story</CardTitle>
          <CardDescription>
            You must be logged in to continue this story.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/auth/login')}>
            Sign In to Continue
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Already contributed
  if (hasContributed) {
    const message = contributionType === 'create' 
      ? "You created this story. You cannot add continuations to your own story."
      : "You have already contributed to this story. Each user can only contribute once per story tree."
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Continue Story</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">
              {contributionType === 'create' 
                ? "You can read and explore the continuations others have added to your story."
                : "You can read and explore other branches of this story tree."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Max continuations reached
  if (parentStory.continuation_count >= parentStory.max_continuations) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Continue Story</CardTitle>
          <CardDescription>
            This story has reached the maximum number of continuations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-600">
              This story segment already has {parentStory.continuation_count} continuations (maximum: {parentStory.max_continuations}).
              You can explore the existing branches or continue from a different segment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Continue Story</CardTitle>
        <CardDescription>
          Add your continuation to &quot;{parentStory.title}&quot;. Keep it engaging and build upon the existing narrative.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Continuation Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your continuation..."
              maxLength={MAX_TITLE_LENGTH}
              disabled={isSubmitting}
              className={!isTitleValid && titleLength > 0 ? 'border-red-500' : ''}
            />
            <div className={`text-sm ${getTitleColor()}`}>
              {titleLength} / {MAX_TITLE_LENGTH} characters
            </div>
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <Label htmlFor="content">Continuation Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your continuation of the story..."
              maxLength={MAX_CONTENT_LENGTH}
              rows={8}
              disabled={isSubmitting}
              className={!isContentValid && contentLength > 0 ? 'border-red-500' : ''}
            />
            <div className={`text-sm ${getContentColor()}`}>
              {contentLength} / {MAX_CONTENT_LENGTH} characters
            </div>
          </div>

          {/* Continuation Info */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Current continuations:</strong> {parentStory.continuation_count} / {parentStory.max_continuations}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Adding...' : 'Add Continuation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
