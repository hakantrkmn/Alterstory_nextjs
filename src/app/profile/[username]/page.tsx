'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { getUserProfile, getUserCreatedStories, getUserContributions } from '@/lib/api/users'
import { getUserVotingHistory } from '@/lib/api/votes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/lib/auth/context'
import { ProfileManager } from '@/components/auth/ProfileManager'

interface UserProfile {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  created_at: string
  created_stories: number
  contributions: number
  received_likes: number
}

interface Story {
  id: string
  title: string
  content: string
  created_at: string
  like_count: number
  dislike_count: number
  profiles?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface Contribution {
  id: string
  created_at: string
  story: Story
}

interface Vote {
  id: string
  vote_type: 'like' | 'dislike'
  created_at: string
  stories: Story
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser, profile: currentProfile } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [createdStories, setCreatedStories] = useState<Story[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [likedStories, setLikedStories] = useState<Vote[]>([])
  const [dislikedStories, setDislikedStories] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return

      setLoading(true)
      setError(null)

      try {
        const { data, error } = await getUserProfile(username)
        
        if (error) {
          setError(error.message)
          return
        }

        if (data) {
          setProfile(data)
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [username])

  const loadCreatedStories = async () => {
    if (!profile) return

    try {
      const { data } = await getUserCreatedStories(profile.id)
      if (data) {
        setCreatedStories(data)
      }
    } catch (error) {
      console.error('Error loading created stories:', error)
    }
  }

  const loadContributions = async () => {
    if (!profile) return

    try {
      const { data } = await getUserContributions(profile.id)
      if (data) {
        setContributions(data)
      }
    } catch (error) {
      console.error('Error loading contributions:', error)
    }
  }

  const loadVotingHistory = async () => {
    if (!profile) return

    try {
      const { data } = await getUserVotingHistory(profile.id)
      if (data) {
        const liked = data.filter(vote => vote.vote_type === 'like')
        const disliked = data.filter(vote => vote.vote_type === 'dislike')
        setLikedStories(liked)
        setDislikedStories(disliked)
      }
    } catch (error) {
      console.error('Error loading voting history:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'created') {
      loadCreatedStories()
    } else if (activeTab === 'contributions') {
      loadContributions()
    } else if (activeTab === 'liked' || activeTab === 'disliked') {
      loadVotingHistory()
    }
  }, [activeTab, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-red-600">
                  {error || 'User not found'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If editing own profile, show ProfileManager
  if (isEditing && isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-600 mt-2">
                  Update your profile information and settings
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel Editing
              </Button>
            </div>
            
            <ProfileManager />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            {isOwnProfile && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{profile.display_name}</CardTitle>
                    <CardDescription>@{profile.username}</CardDescription>
                    {profile.bio && (
                      <p className="text-gray-600 mt-2">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {profile.created_stories}
                    </div>
                    <Badge variant="secondary">Stories Created</Badge>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {profile.contributions}
                    </div>
                    <Badge variant="secondary">Contributions</Badge>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {profile.received_likes}
                    </div>
                    <Badge variant="secondary">Likes Received</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="created">Created Stories</TabsTrigger>
                <TabsTrigger value="contributions">Contributions</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About {profile.display_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Member since</h3>
                        <p className="text-gray-600">
                          {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {profile.bio && (
                        <div>
                          <h3 className="font-semibold">Bio</h3>
                          <p className="text-gray-600">{profile.bio}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="created">
                <Card>
                  <CardHeader>
                    <CardTitle>Created Stories</CardTitle>
                    <CardDescription>
                      Stories started by {profile.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {createdStories.length > 0 ? (
                      <div className="space-y-4">
                        {createdStories.map((story) => (
                          <Card key={story.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Link href={`/story/${story.id}`} className="hover:underline">
                                  <h3 className="font-semibold text-lg">{story.title}</h3>
                                </Link>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {story.content}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Created {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                                  <span>👍 {story.like_count}</span>
                                  <span>👎 {story.dislike_count}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {profile.display_name} hasn&apos;t created any stories yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contributions">
                <Card>
                  <CardHeader>
                    <CardTitle>Contributions</CardTitle>
                    <CardDescription>
                      Stories continued by {profile.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributions.length > 0 ? (
                      <div className="space-y-4">
                        {contributions.map((contribution) => (
                          <Card key={contribution.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Link href={`/story/${contribution.story.id}`} className="hover:underline">
                                  <h3 className="font-semibold text-lg">{contribution.story.title}</h3>
                                </Link>
                                <p className="text-gray-600 text-sm mt-1">
                                  Original story by{' '}
                                  <span className="font-medium">
                                    {contribution.story.profiles?.display_name || contribution.story.profiles?.username}
                                  </span>
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Contributed {formatDistanceToNow(new Date(contribution.created_at), { addSuffix: true })}</span>
                                  <span>👍 {contribution.story.like_count}</span>
                                  <span>👎 {contribution.story.dislike_count}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {profile.display_name} hasn&apos;t contributed to any stories yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Recent likes and dislikes by {profile.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {likedStories.length > 0 || dislikedStories.length > 0 ? (
                      <div className="space-y-4">
                        {[...likedStories, ...dislikedStories]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 10)
                          .map((vote) => (
                            <Card key={vote.id} className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={vote.vote_type === 'like' ? 'default' : 'destructive'}>
                                      {vote.vote_type === 'like' ? '👍 Liked' : '👎 Disliked'}
                                    </Badge>
                                  </div>
                                  <Link href={`/story/${vote.stories.id}`} className="hover:underline">
                                    <h3 className="font-semibold text-lg">{vote.stories.title}</h3>
                                  </Link>
                                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                    {vote.stories.content}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>{vote.vote_type === 'like' ? 'Liked' : 'Disliked'} {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}</span>
                                    <span>👍 {vote.stories.like_count}</span>
                                    <span>👎 {vote.stories.dislike_count}</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {profile.display_name} hasn&apos;t rated any stories yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
