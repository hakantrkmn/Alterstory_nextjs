import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryReader } from '@/components/story/StoryReader'
import { StoryBreadcrumb } from '@/components/navigation'
import { PageLayout, PageContent } from '@/components/layout'
import { getStoryWithContinuations, getStoryTree } from '@/lib/api/stories'
import type { Story } from '@/types/database'
import { AuthGuard } from '@/components/auth'

interface StoryPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format:', id)
      notFound()
    }
    const result = await getStoryWithContinuations(id)
    
    if (result.error || !result.data) {
      return {
        title: 'Story Not Found - Alterstory',
        description: 'The requested story could not be found.',
      }
    }

    return {
      title: `${result.data.title} - Alterstory`,
      description: result.data.content.substring(0, 160) + '...',
    }
  } catch {
    return {
      title: 'Story - Alterstory',
      description: 'Read and continue interactive stories.',
    }
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  try {
    const { id } = await params
    const result = await getStoryWithContinuations(id)
    
    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        notFound()
      }
      throw new Error(result.error.message)
    }

    if (!result.data) {
      notFound()
    }

    // Get breadcrumbs for navigation
    let breadcrumbs: (Story & {
      profiles: {
        username: string
        display_name: string
        avatar_url?: string
      }
    })[] = []
    if (result.data.level > 0) {
      const treeResult = await getStoryTree(result.data.story_root_id)
      if (treeResult.data) {
        // Build breadcrumbs by traversing up the tree
        const buildBreadcrumbs = (storyId: string, stories: (Story & {
          profiles: {
            username: string
            display_name: string
            avatar_url?: string
          }
        })[]): (Story & {
          profiles: {
            username: string
            display_name: string
            avatar_url?: string
          }
        })[] => {
          const story = stories.find(s => s.id === storyId)
          if (!story || story.level === 0) {
            return story ? [story] : []
          }
          
          const parent = stories.find(s => s.id === story.parent_id)
          if (!parent) return [story]
          
          return [...buildBreadcrumbs(parent.id, stories), story]
        }
        
        breadcrumbs = buildBreadcrumbs(id, treeResult.data)
      }
    }

    return (
      <AuthGuard>
      <PageLayout maxWidth="full" className="max-w-5xl" padding="sm">
        <div className="mb-4 md:mb-6">
          <StoryBreadcrumb
            storyTitle={result.data.title}
            storyId={result.data.story_root_id}
            currentNodeTitle={result.data.level > 0 ? result.data.title : undefined}
            currentNodeId={result.data.level > 0 ? result.data.id : undefined}
          />
        </div>
        
        <PageContent className="space-y-4 md:space-y-6">
            <StoryReader story={result.data} breadcrumbs={breadcrumbs} />
          </PageContent>
        </PageLayout>
      </AuthGuard>
    )
  } catch (error) {
    console.error('Error loading story:', error)
    throw error
  }
}
