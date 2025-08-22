import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rootId: string }> }
) {
  try {
    const { rootId } = await params
    const supabase = await createClient()

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        hasContributed: false,
        contributionType: null,
        error: null
      })
    }

    // Check if user has contributed to this story tree
    const { data: contribution, error: contributionError } = await supabase
      .from('story_contributions')
      .select('id, contribution_type')
      .eq('user_id', session.user.id)
      .eq('story_root_id', rootId)
      .single()

    if (contributionError) {
      if (contributionError.code === 'PGRST116') {
        // No contribution found
        return NextResponse.json({
          hasContributed: false,
          contributionType: null,
          error: null
        })
      }
      return NextResponse.json(
        { error: { message: contributionError.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasContributed: !!contribution,
      contributionType: contribution?.contribution_type || null,
      error: null
    })
  } catch (error) {
    console.error('Error in contribution status API:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
