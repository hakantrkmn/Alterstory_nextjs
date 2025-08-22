import { Metadata } from 'next'
import { StoryCreator } from '@/components/story/StoryCreator'

export const metadata: Metadata = {
  title: 'Create New Story - Alterstory',
  description: 'Start a new story that others can continue. Create engaging narratives and watch them grow.',
}

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Story</h1>
          <p className="text-gray-600">
            Start a new story that others can continue. Write an engaging beginning and watch your story grow through collaborative storytelling.
          </p>
        </div>
        
        <StoryCreator />
      </div>
    </div>
  )
}
