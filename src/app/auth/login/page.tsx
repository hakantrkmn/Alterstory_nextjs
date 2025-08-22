'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { LoginForm } from '@/components/auth/LoginForm'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  // Eğer kullanıcı zaten giriş yaptıysa, login sayfasında kalmayıp keşfe yönlendir
  // loading tamamlanana kadar bekle
  useEffect(() => {
    if (!loading && user) {
      router.push('/explore')
    }
  }, [user, loading, router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue your storytelling journey
          </p>
        </div>
        
        <div className="space-y-4">
          <LoginForm />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or</span>
            </div>
          </div>
          
          <GoogleAuthButton />
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}