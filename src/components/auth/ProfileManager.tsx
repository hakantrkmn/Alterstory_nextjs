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

export function ProfileManager() {
  const { user, profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
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
      // Get stories created count
      const { count: storiesCount } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .is('parent_id', null)

      // Get contributions count
      const { count: contributionsCount } = await supabase
        .from('story_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('contribution_type', 'continue')

      // Get likes received on user's stories
      const { data: userStories } = await supabase
        .from('stories')
        .select('like_count')
        .eq('author_id', user.id)

      const likesReceived = userStories?.reduce((sum, story) => sum + story.like_count, 0) || 0

      // Get votes given by user
      const { count: likesGivenCount } = await supabase
        .from('story_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('vote_type', 'like')

      const { count: dislikesGivenCount } = await supabase
        .from('story_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('vote_type', 'dislike')

      setStats({
        storiesCreated: storiesCount || 0,
        contributionsAdded: contributionsCount || 0,
        likesReceived,
        likesGiven: likesGivenCount || 0,
        dislikesGiven: dislikesGivenCount || 0,
        totalEngagement: (likesGivenCount || 0) + (dislikesGivenCount || 0) + likesReceived,
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [user, supabase])

  React.useEffect(() => {
    loadUserStats()
  }, [user, loadUserStats])

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
    console.log('�� Debug - Session:', await supabase.auth.getSession())
  
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
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
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
      </Tabs>
    </div>
  )
}