// Test Supabase Realtime Connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Environment variables'ları kontrol et
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables missing!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔌 Testing Supabase Realtime connection...')

// Test basic connection
supabase
  .channel('test-connection')
  .on('system', {}, (payload) => {
    console.log('✅ System event received:', payload)
  })
  .subscribe((status) => {
    console.log('📡 Connection status:', status)
    
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime connection successful!')
      
      // Test stories table subscription
      supabase
        .channel('test-stories')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories'
        }, (payload) => {
          console.log('✅ Stories table update received:', payload)
        })
        .subscribe((storiesStatus) => {
          console.log('📊 Stories subscription status:', storiesStatus)
        })
        
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      console.error('❌ Realtime connection failed!')
      console.log('💡 Check your Supabase project settings:')
      console.log('   1. Go to Dashboard → Database → Publications')
      console.log('   2. Make sure "supabase_realtime" is enabled')
      console.log('   3. Add "stories" table to the publication')
    }
  })

// Keep the script running for 10 seconds
setTimeout(() => {
  console.log('⏰ Test completed')
  process.exit(0)
}, 10000)
