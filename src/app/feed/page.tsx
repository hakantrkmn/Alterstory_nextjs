import { Feed } from '@/components/story/Feed'
import { Button } from '@/components/ui/button'
import { PageLayout, PageHeader, PageContent } from '@/components/layout'
import { Plus, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function FeedPage() {
  return (
    <PageLayout maxWidth="full" className="max-w-6xl">
      <PageHeader
        title="Story Feed"
        description="Discover and explore amazing collaborative stories"
      >
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/explore">
            <BookOpen className="h-4 w-4 mr-2" />
            Explore
          </Link>
        </Button>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Story
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <Feed />
      </PageContent>
    </PageLayout>
  )
}
