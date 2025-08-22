import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Check if user is admin (you can modify this check as needed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.username !== 'hakantrkmn') {
      return NextResponse.json(
        { error: { message: 'Not authorized' } },
        { status: 403 }
      )
    }

    // Fix continuation counts for all parent stories
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.stories 
        SET continuation_count = (
          SELECT COUNT(*) 
          FROM public.stories AS continuations 
          WHERE continuations.parent_id = public.stories.id
        ),
        updated_at = NOW()
        WHERE id IN (
          SELECT DISTINCT parent_id 
          FROM public.stories 
          WHERE parent_id IS NOT NULL
        );
      `
    })

    if (error1) {
      console.error('Error updating parent continuation counts:', error1)
    }

    // Fix continuation counts for root stories
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.stories 
        SET continuation_count = (
          SELECT COUNT(*) 
          FROM public.stories AS continuations 
          WHERE continuations.story_root_id = public.stories.id 
          AND continuations.level > 0
        ),
        updated_at = NOW()
        WHERE level = 0 
        AND story_root_id = id;
      `
    })

    if (error2) {
      console.error('Error updating root continuation counts:', error2)
    }

    if (error1 || error2) {
      return NextResponse.json(
        { error: { message: 'Failed to update continuation counts' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Continuation counts updated successfully'
    })
  } catch (error) {
    console.error('Error in fix continuation counts API:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
