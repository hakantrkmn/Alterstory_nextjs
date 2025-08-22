'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'

interface GoogleAuthButtonProps {
  className?: string
}

export function GoogleAuthButton({ className }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
      }
      // Note: The redirect will be handled by Supabase OAuth flow
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`w-full ${className}`}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
          ></path>
        </svg>
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}