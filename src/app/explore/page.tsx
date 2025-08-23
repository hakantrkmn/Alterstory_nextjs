'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { PageLayout, PageHeader, PageContent } from '@/components/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { BookOpen, Users, TrendingUp, Clock, Plus, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStats, useCommunityStats, usePopularStories } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'

export default function ExplorePage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const router = useRouter()
  const userStats = useUserStats()
  const communityStats = useCommunityStats()
  const popularStories = usePopularStories(5)

  // Sayfa açıldığında profile cache'ini yenile
  useEffect(() => {
    if (user) {
      refreshUserProfile()
    }
  }, [user, refreshUserProfile])

  return (
    <AuthGuard>
      <PageLayout maxWidth="xl" className="max-w-6xl">
        <PageHeader
          title={`Hoş geldin, ${profile?.display_name || 'Yazar'}! 👋`}
          description="Hikayeler keşfet, yeni maceralar başlat veya devam ettir"
        />

        <PageContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    {userStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{userStats.createdStories}</p>
                        <p className="text-sm text-muted-foreground">Oluşturduğun Hikayeler</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    {userStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{userStats.contributions}</p>
                        <p className="text-sm text-muted-foreground">Katkıların</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    {userStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{userStats.receivedLikes}</p>
                        <p className="text-sm text-muted-foreground">Aldığın Beğeniler</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    {userStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{userStats.readStories}</p>
                        <p className="text-sm text-muted-foreground">Okuduğun Hikayeler</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Popular Stories */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Popüler Hikayeler
                  </CardTitle>
                  <CardDescription>
                    Topluluk tarafından en çok beğenilen hikayeler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {popularStories.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loading size="lg" text="Hikayeler yükleniyor..." />
                    </div>
                  ) : popularStories.error ? (
                    <div className="text-center py-8 text-red-600">
                      <p>Hikayeler yüklenirken hata oluştu</p>
                      <p className="text-sm">{popularStories.error}</p>
                    </div>
                  ) : popularStories.stories.length > 0 ? (
                    <div className="space-y-4">
                      {popularStories.stories.map((story) => (
                        <Card key={story.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/story/${story.id}`)}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{story.title}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{story.content}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={story.profiles?.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {story.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{story.profiles?.display_name || story.profiles?.username}</span>
                                </div>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{story.like_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{story.continuation_count}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Henüz hikaye bulunmuyor</p>
                      <p className="text-sm">İlk hikayeyi sen oluştur!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Son Aktiviteler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Henüz aktivite yok</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Hikaye Başlat
                    </Link>
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/feed')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Rastgele Hikaye Oku
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/search')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Yazarları Keşfet
                  </Button>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Topluluk İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Toplam Hikaye</span>
                    {communityStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <Badge variant="secondary">{communityStats.totalStories}</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktif Yazar</span>
                    {communityStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <Badge variant="secondary">{communityStats.activeWriters}</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bu Hafta Eklenen</span>
                    {communityStats.isLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <Badge variant="secondary">{communityStats.weeklyAdded}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContent>
      </PageLayout>
    </AuthGuard>
  )
}