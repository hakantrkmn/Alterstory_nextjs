import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface RealtimeCallbacks {
  onVoteUpdate?: (payload: {
    story_id: string
    like_count: number
    dislike_count: number
  }) => void
  onCommentUpdate?: (payload: {
    story_id: string
    comment_count: number
  }) => void
  onNewComment?: (payload: {
    story_id: string
    comment: any
  }) => void
  onVoteChange?: (payload: {
    story_id: string
    user_id: string
    vote_type: 'like' | 'dislike' | null
  }) => void
}

export const useRealtimeUpdates = (callbacks: RealtimeCallbacks) => {
  const subscriptionsRef = useRef<any[]>([])

  useEffect(() => {
    const subscriptions: any[] = []

    // Subscribe to story vote count updates
    if (callbacks.onVoteUpdate) {
      const voteSubscription = supabase
        .channel('story-vote-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stories',
            filter: 'like_count=is.not.null'
          },
          (payload) => {
            callbacks.onVoteUpdate?.({
              story_id: payload.new.id,
              like_count: payload.new.like_count,
              dislike_count: payload.new.dislike_count
            })
          }
        )
        .subscribe()

      subscriptions.push(voteSubscription)
    }

    // Subscribe to story comment count updates
    if (callbacks.onCommentUpdate) {
      const commentCountSubscription = supabase
        .channel('story-comment-count-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stories',
            filter: 'comment_count=is.not.null'
          },
          (payload) => {
            callbacks.onCommentUpdate?.({
              story_id: payload.new.id,
              comment_count: payload.new.comment_count
            })
          }
        )
        .subscribe()

      subscriptions.push(commentCountSubscription)
    }

    // Subscribe to new comments
    if (callbacks.onNewComment) {
      const newCommentSubscription = supabase
        .channel('new-comments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments'
          },
          async (payload) => {
            // Fetch the full comment with profile data
            const { data: comment } = await supabase
              .from('comments')
              .select(`
                *,
                profiles:user_id (username, display_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()

            if (comment) {
              callbacks.onNewComment?.({
                story_id: payload.new.story_id,
                comment
              })
            }
          }
        )
        .subscribe()

      subscriptions.push(newCommentSubscription)
    }

    // Subscribe to comment updates
    if (callbacks.onNewComment) {
      const commentUpdateSubscription = supabase
        .channel('comment-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'comments'
          },
          async (payload) => {
            // Fetch the updated comment with profile data
            const { data: comment } = await supabase
              .from('comments')
              .select(`
                *,
                profiles:user_id (username, display_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()

            if (comment) {
              callbacks.onNewComment?.({
                story_id: payload.new.story_id,
                comment
              })
            }
          }
        )
        .subscribe()

      subscriptions.push(commentUpdateSubscription)
    }

    // Subscribe to comment deletions
    if (callbacks.onNewComment) {
      const commentDeleteSubscription = supabase
        .channel('comment-deletions')
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments'
          },
          (payload) => {
            callbacks.onNewComment?.({
              story_id: payload.old.story_id,
              comment: { id: payload.old.id, deleted: true }
            })
          }
        )
        .subscribe()

      subscriptions.push(commentDeleteSubscription)
    }

    // Subscribe to individual vote changes
    if (callbacks.onVoteChange) {
      const voteChangeSubscription = supabase
        .channel('vote-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'story_votes'
          },
          (payload) => {
            callbacks.onVoteChange?.({
              story_id: payload.new?.story_id || payload.old?.story_id,
              user_id: payload.new?.user_id || payload.old?.user_id,
              vote_type: payload.new?.vote_type || null
            })
          }
        )
        .subscribe()

      subscriptions.push(voteChangeSubscription)
    }

    subscriptionsRef.current = subscriptions

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription)
      })
    }
  }, [callbacks])

  return {
    unsubscribe: () => {
      subscriptionsRef.current.forEach(subscription => {
        supabase.removeChannel(subscription)
      })
      subscriptionsRef.current = []
    }
  }
}
