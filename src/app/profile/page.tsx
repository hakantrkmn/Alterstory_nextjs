'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { ProfileManager } from '@/components/auth/ProfileManager'
import { Header } from '@/components/layout/Header'

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account information and view your statistics
            </p>
          </div>
          
          <ProfileManager />
        </div>
        </div>
      </div>
    </AuthGuard>
  )
}