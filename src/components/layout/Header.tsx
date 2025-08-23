'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, User, LogOut, Settings, Search, Menu, X, RefreshCw } from 'lucide-react'

export function Header() {
  const { user, profile, signOut, refreshUserProfile } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
    setIsMobileMenuOpen(false)
  }

  const handleRefreshProfile = async () => {
    if (!user) return
    
    setRefreshing(true)
    await refreshUserProfile()
    setRefreshing(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">HikayePlatform</span>
          <span className="sm:hidden">HP</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/feed" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Feed
          </Link>
          <Link 
            href="/search" 
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            Arama
          </Link>
          <Link 
            href="/explore" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Keşfet
          </Link>
          <Link 
            href="/create" 
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Oluştur
          </Link>
        </nav>

        {/* Desktop User Menu */}
        <div className="hidden md:block">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0).toUpperCase() || 
                       user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {profile?.display_name || user.email || 'User'}
                    </p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {profile ? `@${profile.username}` : user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefreshProfile} disabled={refreshing} className="cursor-pointer">
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Yenileniyor...' : 'Profili Yenile'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Ayarlar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-4 mb-6">
              <Link 
                href="/feed" 
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Feed
              </Link>
              <Link 
                href="/search" 
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 py-2"
                onClick={closeMobileMenu}
              >
                <Search className="h-4 w-4" />
                Arama
              </Link>
              <Link 
                href="/explore" 
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Keşfet
              </Link>
              <Link 
                href="/create" 
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Oluştur
              </Link>
            </nav>

            {/* Mobile User Section */}
            {user && profile ? (
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href={`/profile/${profile.username}`} onClick={closeMobileMenu}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/settings" onClick={closeMobileMenu}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Ayarlar</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <div className="flex flex-col space-y-2">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login" onClick={closeMobileMenu}>Giriş Yap</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/register" onClick={closeMobileMenu}>Kayıt Ol</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}