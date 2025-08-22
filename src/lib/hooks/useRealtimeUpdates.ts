  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { useEffect, useRef } from 'react'
  import { createClient } from '@/lib/supabase/client'
  import { eventBus } from './eventbus'
  const supabase = createClient()
  
  
  
  export const useRealtimeUpdates = () => {
  const hasSubscribedRef = useRef(false)
  const channelsRef = useRef<any[]>([])
    useEffect(() => {
      if (hasSubscribedRef.current === true) {
        return
      }
      hasSubscribedRef.current = true
  
      
      // Ana channel - önce system event ile bağlan
      const mainChannel = supabase
        .channel('main-realtime')
        .on('system', {}, (payload) => {
          console.log('✅ System event received:', payload)
        })
        .subscribe((status) => {
          console.log('📡 Main channel status:', status)
          channelsRef.current.push(mainChannel)
          if (status === 'SUBSCRIBED') {
            console.log('🎉 System connected! Adding table subscriptions...')
            
            // Vote count updates (stories tablosundan)
            const storiesChannel = supabase
              .channel('stories-channel')
              .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'stories'
              }, (payload) => {
                console.log('🎯 Vote count update received:', payload)
                eventBus.emit('voteUpdate', {
                  story_id: payload.new.id,
                  like_count: payload.new.like_count,
                  dislike_count: payload.new.dislike_count,
                })
              })
              .subscribe((status) => {
                console.log('📡 Stories channel status:', status)
                channelsRef.current.push(storiesChannel)
              })
              
  
  
  
            // Individual vote changes (story_votes tablosundan)
            const storyVotesChannel = supabase
              .channel('story-votes-channel')
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'story_votes'
              }, (payload) => {
                console.log('🎯 Individual vote change:', payload)
                eventBus.emit('voteChange', {
                  story_id: payload.new?.story_id || payload.old?.story_id,
                  user_id: payload.new?.user_id || payload.old?.user_id,
                  vote_type: payload.new?.vote_type || null
                })
              })
              .subscribe((status) => {
                console.log('📡 Story votes channel status:', status)
                channelsRef.current.push(storyVotesChannel)
              })
  
  
            // Comment count updates (stories tablosundan)
            const commentsChannel = supabase
              .channel('comments-count-channel')
              .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'stories'
              }, (payload) => {
                console.log('💬 Comment count update:', payload)
                eventBus.emit('commentCountUpdate', {
                  story_id: payload.new.id,
                  comment_count: payload.new.comment_count
                })
              })
              .subscribe((status) => {
                console.log('📡 Comments count channel status:', status)
                channelsRef.current.push(commentsChannel)
              })
  
  
  
            // New comments (comments tablosundan)
            const newCommentsChannel = supabase
              .channel('new-comments-channel')
              .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments'
              }, async (payload) => {
                
                // Fetch full comment with profile data
                const { data: comment } = await supabase
                  .from('comments')
                  .select(`
                    *,
                    profiles:user_id (username, display_name, avatar_url)
                  `)
                  .eq('id', payload.new.id)
                  .single()
  
                console.log('🔍 Fetched comment:', comment)
  
                if (comment) {
                  eventBus.emit('newComment', {
                    story_id: payload.new.story_id,
                    commentId: payload.new.id
                  })
                } else {
                  console.log('❌ Callback not found or comment not fetched')
                }
              })
              .subscribe((status) => {
                console.log('📡 New comments channel status:', status)
                channelsRef.current.push(newCommentsChannel)
              })
  
  
  
  
            // Comment updates (comments tablosundan)
            const commentUpdatesChannel = supabase
              .channel('comment-updates-channel')
              .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'comments'
              }, async (payload) => {
                console.log('💬 Comment update received:', payload)
                // Fetch updated comment with profile data
                const { data: comment } = await supabase
                  .from('comments')
                  .select(`
                    *,
                    profiles:user_id (username, display_name, avatar_url)
                  `)
                  .eq('id', payload.new.id)
                  .single()
  
                if (comment) {
                  eventBus.emit('commentUpdate', {
                    story_id: payload.new.story_id,
                    commentId: payload.new.id,
                    type: 'edit'
                  })
                }
              })
              .subscribe((status) => {
                console.log('📡 Comment updates channel status:', status)
                channelsRef.current.push(commentUpdatesChannel)
              })
  
  
  
            // Comment deletions (comments tablosundan)
            const commentDeletionsChannel = supabase
              .channel('comment-deletions-channel')
              .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'comments'
              }, (payload) => {
                console.log('💬 Comment deletion received:', payload)
                eventBus.emit('commentDelete', {
                  story_id: payload.old.story_id,
                  comment_id: payload.old.id
                })
              })
              .subscribe((status) => {
                console.log('📡 Comment deletions channel status:', status)
                channelsRef.current.push(commentDeletionsChannel)
              })
  
  
  
  
            // Story continuations (stories tablosundan)
            const storyContinuationsChannel = supabase
              .channel('story-continuations-channel')
              .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'stories'
              }, (payload) => {
                console.log('📖 New story continuation received:', payload)
                // This will trigger continuation count updates in parent stories
              })
              .subscribe((status) => {
                console.log('📡 Story continuations channel status:', status)
                channelsRef.current.push(storyContinuationsChannel)
              })
  
  
  
          }
        })
  
  
  
      // Cleanup function
      return () => {
        console.log('🧹 useRealtimeUpdates: Cleaning up all subscriptions')
        channelsRef.current.forEach(channel => {
          supabase.removeChannel(channel)
        })
        channelsRef.current = []
      }
    }, []) // Boş dependency array - her component'te ayrı ayrı çalışsın
  
  }
  
  