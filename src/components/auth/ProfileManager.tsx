'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserCreatedStories, getUserContributions, getUserStatistics } from '@/lib/api/users'
import { getUserVotingHistory } from '@/lib/api/votes'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useInvalidateProfile } from '@/lib/hooks/useProfile'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserStats {
  storiesCreated: number
  contributionsAdded: number
  likesReceived: number
  likesGiven: number
  dislikesGiven: number
  totalEngagement: number
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

export function ProfileManager() {
  const { user, profile, updateProfile } = useAuth()
  const { invalidateProfile } = useInvalidateProfile()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [createdStories, setCreatedStories] = useState<Story[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [likedStories, setLikedStories] = useState<Vote[]>([])
  const [dislikedStories, setDislikedStories] = useState<Vote[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [contributionsLoading, setContributionsLoading] = useState(false)
  const [votesLoading, setVotesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      displayName: profile?.display_name || '',
      bio: profile?.bio || '',
    },
  })

  // Reset form when profile changes
  React.useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio || '',
      })
    }
  }, [profile, reset])

  const loadUserStats = useCallback(async () => {
    if (!user) return

    setStatsLoading(true)
    try {
      const { data: statsData } = await getUserStatistics(user.id)
      
      if (statsData) {
        setStats({
          storiesCreated: statsData.createdStories,
          contributionsAdded: statsData.contributions,
          likesReceived: statsData.totalLikesReceived,
          likesGiven: 0, // Will be calculated from votes
          dislikesGiven: 0, // Will be calculated from votes
          totalEngagement: statsData.votes + statsData.comments + statsData.totalLikesReceived,
        })
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [user])

  const loadCreatedStories = useCallback(async () => {
    if (!user) return

    setStoriesLoading(true)
    try {
      const { data } = await getUserCreatedStories(user.id)
      if (data) {
        setCreatedStories(data)
      }
    } catch (error) {
      console.error('Error loading created stories:', error)
    } finally {
      setStoriesLoading(false)
    }
  }, [user])

  const loadContributions = useCallback(async () => {
    if (!user) return

    setContributionsLoading(true)
    try {
      const { data } = await getUserContributions(user.id)
      if (data) {
        setContributions(data)
      }
    } catch (error) {
      console.error('Error loading contributions:', error)
    } finally {
      setContributionsLoading(false)
    }
  }, [user])

  const loadVotingHistory = useCallback(async () => {
    if (!user) return

    setVotesLoading(true)
    try {
      const { data } = await getUserVotingHistory(user.id)
      if (data) {
        const liked = data.filter(vote => vote.vote_type === 'like')
        const disliked = data.filter(vote => vote.vote_type === 'dislike')
        setLikedStories(liked)
        setDislikedStories(disliked)
        
        // Update stats with vote counts
        setStats(prev => prev ? {
          ...prev,
          likesGiven: liked.length,
          dislikesGiven: disliked.length,
        } : null)
      }
    } catch (error) {
      console.error('Error loading voting history:', error)
    } finally {
      setVotesLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadUserStats()
  }, [user, loadUserStats])

  // Load data when tab changes
  React.useEffect(() => {
    if (activeTab === 'created') {
      loadCreatedStories()
    } else if (activeTab === 'contributions') {
      loadContributions()
    } else if (activeTab === 'liked' || activeTab === 'disliked') {
      loadVotingHistory()
    }
  }, [activeTab, loadCreatedStories, loadContributions, loadVotingHistory])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await updateProfile({
        username: data.username,
        display_name: data.displayName,
        bio: data.bio || null,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
        // Cache'i invalidate et
        if (user) {
          invalidateProfile(user.id)
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    console.log('🔍 Debug - User:', user)
    console.log('🔍 Debug - Session:', await supabase.auth.getSession())
  
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setAvatarUploading(true)
    setError(null)

    try {
      // Delete existing avatar if present
      if (profile?.avatar_url && profile.has_uploaded_avatar) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      console.log('🔍 Debug - Upload Error:', uploadError)
      if (uploadError) {
        setError(uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
        has_uploaded_avatar: true,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Avatar updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
        // Cache'i invalidate et
        if (user) {
          invalidateProfile(user.id)
        }
      }
    } catch {
      setError('Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please log in to manage your profile.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="created">Created Stories</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="liked">Liked Stories</TabsTrigger>
          <TabsTrigger value="disliked">Disliked Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
              <CardDescription>
                Update your profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading...' : 'Change Avatar'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    Max 2MB. JPG, PNG, GIF supported.
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...register('username')}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...register('displayName')}
                    disabled={isLoading}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-600">{errors.displayName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    {...register('bio')}
                    disabled={isLoading}
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600">{errors.bio.message}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                    {success}
                  </div>
                )}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Your Statistics</CardTitle>
              <CardDescription>
                Overview of your activity on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.storiesCreated}
                    </div>
                    <Badge variant="secondary">Stories Created</Badge>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.contributionsAdded}
                    </div>
                    <Badge variant="secondary">Contributions</Badge>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.likesReceived}
                    </div>
                    <Badge variant="secondary">Likes Received</Badge>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.likesGiven}
                    </div>
                    <Badge variant="secondary">Likes Given</Badge>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.dislikesGiven}
                    </div>
                    <Badge variant="secondary">Dislikes Given</Badge>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.totalEngagement}
                    </div>
                    <Badge variant="default">Total Engagement</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  Unable to load statistics
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="created">
          <Card>
            <CardHeader>
              <CardTitle>Created Stories</CardTitle>
              <CardDescription>
                Stories you have started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : createdStories.length > 0 ? (
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
                    You haven&apos;t created any stories yet.
                    <br />
                    <Link href="/create" className="text-blue-600 hover:underline">
                      Start your first story
                    </Link>
                  </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions">
          <Card>
            <CardHeader>
              <CardTitle>Your Contributions</CardTitle>
              <CardDescription>
                Stories you have continued
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contributionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : contributions.length > 0 ? (
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
                    You haven&apos;t contributed to any stories yet.
                    <br />
                    <Link href="/explore" className="text-blue-600 hover:underline">
                      Explore stories to contribute
                    </Link>
                  </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liked">
          <Card>
            <CardHeader>
              <CardTitle>Liked Stories</CardTitle>
              <CardDescription>
                Stories you have liked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {votesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : likedStories.length > 0 ? (
                <div className="space-y-4">
                  {likedStories.map((vote) => (
                    <Card key={vote.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link href={`/story/${vote.stories.id}`} className="hover:underline">
                            <h3 className="font-semibold text-lg">{vote.stories.title}</h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {vote.stories.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Liked {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}</span>
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
                    You haven&apos;t liked any stories yet.
                    <br />
                    <Link href="/explore" className="text-blue-600 hover:underline">
                      Explore stories to like
                    </Link>
                  </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disliked">
          <Card>
            <CardHeader>
              <CardTitle>Disliked Stories</CardTitle>
              <CardDescription>
                Stories you have disliked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {votesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : dislikedStories.length > 0 ? (
                <div className="space-y-4">
                  {dislikedStories.map((vote) => (
                    <Card key={vote.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link href={`/story/${vote.stories.id}`} className="hover:underline">
                            <h3 className="font-semibold text-lg">{vote.stories.title}</h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {vote.stories.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Disliked {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}</span>
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
                    You haven&apos;t disliked any stories yet.
                  </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}