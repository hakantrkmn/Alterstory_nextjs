import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

// Sayfa yükleme için özel component
export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  )
}

// Küçük yükleme için
export function Spinner({ size = 'sm', className = '' }: Omit<LoadingProps, 'text'>) {
  return <Loading size={size} className={className} />
}
