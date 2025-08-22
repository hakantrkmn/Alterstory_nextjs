import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageLayout({ 
  children, 
  className = '',
  maxWidth = 'xl',
  padding = 'md'
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'py-4 md:py-8',
    md: 'py-6 md:py-8',
    lg: 'py-8 md:py-12'
  }

  return (
    <div className={cn(
      'container mx-auto px-3 md:px-4',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

// Sayfa başlığı için component
interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  children,
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-0">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Sayfa içeriği için component
interface PageContentProps {
  children: ReactNode
  className?: string
}

export function PageContent({ children, className = '' }: PageContentProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  )
}
