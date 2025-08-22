'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, GitBranch, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface StoryCardProps {
  story: {
    id: string
    title: string
    content: string
    created_at: string
    continuation_count?: number
    like_count?: number
    dislike_count?: number
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
  }
}

export function StoryCard({ story }: StoryCardProps) {
  const previewContent = story.content.length > 150 
    ? `${story.content.substring(0, 150)}...` 
    : story.content

  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true })
  
  const displayName = story.profiles.display_name || story.profiles.username
  const avatarInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <Link href={`/story/${story.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={story.profiles.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{displayName}</span>
                  <span>•</span>
                  <Calendar className="h-3 w-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {previewContent}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{story.like_count || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitBranch className="h-4 w-4" />
                <span>{story.continuation_count || 0} continuations</span>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              Read Story
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
