'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createStory } from '@/lib/api/stories'
import { useAuth } from '@/lib/auth/context'

const MAX_TITLE_LENGTH = 200
const MAX_CONTENT_LENGTH = 800

interface StoryCreatorProps {
  onSuccess?: (storyId: string) => void
  onCancel?: () => void
}

export function StoryCreator({ onSuccess, onCancel }: StoryCreatorProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const titleLength = title.length
  const contentLength = content.length
  const isTitleValid = titleLength > 0 && titleLength <= MAX_TITLE_LENGTH
  const isContentValid = contentLength > 0 && contentLength <= MAX_CONTENT_LENGTH
  const canSubmit = isTitleValid && isContentValid && !isSubmitting && user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a story')
      return
    }

    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createStory({
        title: title.trim(),
        content: content.trim(),
        authorId: user.id
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

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Story</CardTitle>
          <CardDescription>
            You must be logged in to create a story.
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Story</CardTitle>
        <CardDescription>
          Start a new story that others can continue. Keep it engaging and leave room for others to build upon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Story Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your story title..."
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
            <Label htmlFor="content">Story Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the beginning of your story..."
              maxLength={MAX_CONTENT_LENGTH}
              rows={8}
              disabled={isSubmitting}
              className={!isContentValid && contentLength > 0 ? 'border-red-500' : ''}
            />
            <div className={`text-sm ${getContentColor()}`}>
              {contentLength} / {MAX_CONTENT_LENGTH} characters
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
