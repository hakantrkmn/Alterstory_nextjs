'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrent?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      <Link 
        href="/feed" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.isCurrent ? (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isCurrent ? 'text-foreground font-medium' : ''}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Story breadcrumb için özel component
interface StoryBreadcrumbProps {
  storyTitle: string
  storyId: string
  currentNodeTitle?: string
  currentNodeId?: string
  className?: string
}

export function StoryBreadcrumb({ 
  storyTitle, 
  storyId, 
  currentNodeTitle, 
  currentNodeId,
  className = '' 
}: StoryBreadcrumbProps) {
  const items: BreadcrumbItem[] = [
    {
      label: 'Stories',
      href: '/feed'
    },
    {
      label: storyTitle,
      href: `/story/${storyId}`
    }
  ]

  if (currentNodeTitle && currentNodeId && currentNodeId !== storyId) {
    items.push({
      label: currentNodeTitle,
      href: `/story/${storyId}/${currentNodeId}`,
      isCurrent: true
    })
  } else if (items.length > 0) {
    items[items.length - 1].isCurrent = true
  }

  return <Breadcrumb items={items} className={className} />
}
