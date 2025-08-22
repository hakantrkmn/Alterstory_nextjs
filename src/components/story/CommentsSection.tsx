'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Edit, Trash2, Send, X } from 'lucide-react'
import { useComments } from '@/lib/hooks/useComments'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types/database'
import { eventBus } from '@/lib/hooks/eventbus'

interface CommentsSectionProps {
  storyId: string
  className?: string
}

interface CommentWithProfile extends Comment {
  profiles: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

export function CommentsSection({ storyId, className }: CommentsSectionProps) {
  const { user } = useAuth()
  const { 
    createComment, 
    fetchStoryComments, 
    editComment, 
    removeComment, 
    loading 
  } = useComments()
  
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Load comments on component mount
  useEffect(() => {
    loadComments()
    const handleCommentUpdate = (payload: { story_id: string; commentId: string; type: 'add' | 'edit' | 'delete' }) => {
      if (payload.story_id === storyId) {
        loadComments(0)
      }
    }
    const handleNewComment = async (payload: { story_id: string; commentId: string }) => {
      await loadComments(0)
    }
    eventBus.on('commentUpdate', handleCommentUpdate)
    eventBus.on('newComment', handleNewComment)
    return () => {
      eventBus.off('commentUpdate', handleCommentUpdate)
      eventBus.off('newComment', handleNewComment)
    }
  }, [storyId])




  const loadComments = async (pageNum: number = 0) => {
    const result = await fetchStoryComments(storyId, pageNum, 20)
    if (result.data) {
      if (pageNum === 0) {
        setComments(result.data)
      } else {
        setComments(prev => [...prev, ...result.data])
      }
      setHasMore(result.data.length === 20)
      setPage(pageNum)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const result = await createComment({
        storyId,
        userId: user.id,
        content: newComment.trim()
      })
      
      if (result.data) {
        setNewComment('')
        // Reload comments to show the new one
        await loadComments(0)
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async () => {
    if (!editingCommentId || !editingContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const result = await editComment(editingCommentId, user!.id, editingContent.trim())
      
      if (result.data) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === editingCommentId 
              ? { ...comment, content: editingContent.trim(), updated_at: new Date().toISOString() }
              : comment
          )
        )
        setEditingCommentId(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Failed to edit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user || isSubmitting) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsSubmitting(true)
    
    try {
      const result = await removeComment(commentId, user.id)
      
      if (result.data) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (comment: CommentWithProfile) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Sign in to view and add comments</p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Comments ({comments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {newComment.length}/1000 characters
            </span>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                {editingCommentId === comment.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {editingContent.length}/1000 characters
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleEditComment}
                          disabled={!editingContent.trim() || isSubmitting}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {comment.profiles.display_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                            {comment.updated_at !== comment.created_at && (
                              <span className="ml-2 text-blue-500">(edited)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {user.id === comment.user_id && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(comment)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && comments.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => loadComments(page + 1)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Comments'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
