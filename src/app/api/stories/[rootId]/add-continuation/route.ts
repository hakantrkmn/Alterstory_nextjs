import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rootId: string }> }
) {
  try {
    const { rootId } = await params
    const supabase = await createClient()
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, parentId, level } = body

    // Validate input
    if (!title?.trim()) {
      return NextResponse.json(
        { error: { message: 'Continuation title is required' } },
        { status: 400 }
      )
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { error: { message: 'Continuation content is required' } },
        { status: 400 }
      )
    }

    if (!parentId) {
      return NextResponse.json(
        { error: { message: 'Parent story ID is required' } },
        { status: 400 }
      )
    }

    // Check if user has already contributed to this story tree
    const { data: existingContribution } = await supabase
      .from('story_contributions')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('story_root_id', rootId)
      .single()

    if (existingContribution) {
      return NextResponse.json(
        { error: { message: 'You have already contributed to this story tree' } },
        { status: 400 }
      )
    }

    // Get parent story to check max continuations
    const { data: parentStory } = await supabase
      .from('stories')
      .select('continuation_count, max_continuations')
      .eq('id', parentId)
      .single()

    if (!parentStory) {
      return NextResponse.json(
        { error: { message: 'Parent story not found' } },
        { status: 404 }
      )
    }

    if (parentStory.continuation_count >= parentStory.max_continuations) {
      return NextResponse.json(
        { error: { message: 'Maximum continuations reached for this story' } },
        { status: 400 }
      )
    }

    // Insert the new continuation
    console.log('Inserting new continuation with parent_id:', parentId)
    const { data: newStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: session.user.id,
        parent_id: parentId,
        story_root_id: rootId,
        level: level || 1,
        position: parentStory.continuation_count || 0,
      })
      .select()
      .single()

    if (storyError) {
      console.error('Error creating story:', storyError)
      return NextResponse.json(
        { error: { message: 'Failed to create continuation' } },
        { status: 500 }
      )
    }

    console.log('Successfully created story:', newStory.id)
    
    // Manually trigger the continuation count update since server-side triggers might not work
    const { data: actualCount, error: countError } = await supabase
      .from('stories')
      .select('id')
      .eq('parent_id', parentId)

    if (!countError && actualCount) {
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          continuation_count: actualCount.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentId)

      if (updateError) {
        console.error('Error updating continuation count:', updateError)
      } else {
        console.log('Manually updated continuation count for parent:', parentId, 'to:', actualCount.length)
      }
    }

    // Also update the position to match the new count
    if (newStory) {
      const { error: positionError } = await supabase
        .from('stories')
        .update({
          position: actualCount ? actualCount.length - 1 : 0
        })
        .eq('id', newStory.id)

      if (positionError) {
        console.error('Error updating position:', positionError)
      }
    }

    // Add contribution record
    const { error: contributionError } = await supabase
      .from('story_contributions')
      .insert({
        user_id: session.user.id,
        story_root_id: rootId,
        story_id: newStory.id,
        contribution_type: 'continue'
      })

    if (contributionError) {
      console.error('Failed to create contribution record:', contributionError)
      // Don't fail the request if contribution record fails
    }

    return NextResponse.json({ 
      data: newStory,
      error: null 
    })
  } catch (error) {
    console.error('Error in add continuation API:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
