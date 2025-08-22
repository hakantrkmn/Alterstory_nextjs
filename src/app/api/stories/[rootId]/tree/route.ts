import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rootId: string }> }
) {
  try {
    const { rootId } = await params
    const supabase = await createClient()

    // Get all stories in the tree
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:author_id (username, display_name, avatar_url)
      `)
      .eq('story_root_id', rootId)
      .order('level', { ascending: true })
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching story tree:', error)
      return NextResponse.json(
        { error: { message: 'Failed to fetch story tree' } },
        { status: 500 }
      )
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json(
        { error: { message: 'Story tree not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Error in story tree API:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
