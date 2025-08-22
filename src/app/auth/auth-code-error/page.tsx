import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            We encountered an error while trying to sign you in. This could be due to:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>An expired or invalid authentication code</li>
            <li>A network connection issue</li>
            <li>A temporary server problem</li>
          </ul>
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/auth/login">
                Try signing in again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                Go to homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}