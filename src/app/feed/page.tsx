import { Feed } from '@/components/story/Feed'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function FeedPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Story Feed</h1>
            <p className="text-muted-foreground mt-2">
              Discover and explore amazing collaborative stories
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/explore">
                <BookOpen className="h-4 w-4 mr-2" />
                Explore
              </Link>
            </Button>
            <Button asChild>
              <Link href="/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Story
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Component */}
      <Feed />
    </div>
  )
}
