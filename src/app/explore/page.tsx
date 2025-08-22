'use client'

import { useAuth } from '@/lib/auth/context'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, TrendingUp, Clock, Plus } from 'lucide-react'

export default function ExplorePage() {
  const { user, profile } = useAuth()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Hoş geldin, {profile?.display_name || 'Yazar'}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Hikayeler keşfet, yeni maceralar başlat veya devam ettir
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Hikaye
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Oluşturduğun Hikayeler</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Katkıların</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Aldığın Beğeniler</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Okuduğun Hikayeler</p>
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
                  <div className="space-y-4">
                    {/* Placeholder for stories */}
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Henüz hikaye bulunmuyor</p>
                      <p className="text-sm">İlk hikayeyi sen oluştur!</p>
                    </div>
                  </div>
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
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Hikaye Başlat
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Rastgele Hikaye Oku
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
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
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktif Yazar</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bu Hafta Eklenen</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}