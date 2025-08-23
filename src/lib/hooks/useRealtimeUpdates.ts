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
  
  