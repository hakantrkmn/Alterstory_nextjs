'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronRight, ChevronDown, Map as MapIcon } from 'lucide-react'
import type { Story } from '@/types/database'

interface StoryTreeVisualizationProps {
  storyRootId: string
  currentStoryId: string
  onStorySelect: (storyId: string) => void
}

interface TreeNode {
  story: Story & {
    profiles: {
      username: string
      display_name: string
      avatar_url?: string
    }
  }
  children: TreeNode[]
  isExpanded: boolean
}

export function StoryTreeVisualization({ 
  storyRootId, 
  currentStoryId, 
  onStorySelect 
}: StoryTreeVisualizationProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch story tree data
  useEffect(() => {
    const fetchStoryTree = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/stories/${storyRootId}/tree`)
        if (!response.ok) {
          throw new Error('Failed to fetch story tree')
        }
        
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error.message)
        }

        // Build tree structure
        const buildTree = (stories: Story[]): TreeNode | null => {
          const storyMap = new globalThis.Map()
          const rootStories: TreeNode[] = []

          // Create map of all stories
          stories.forEach(story => {
            storyMap.set(story.id, {
              story,
              children: [],
              isExpanded: story.id === currentStoryId || story.level <= 1
            })
          })

          // Build tree structure
          stories.forEach(story => {
            const node = storyMap.get(story.id)
            if (node && story.level === 0) {
              rootStories.push(node)
            } else if (node && story.parent_id) {
              const parent = storyMap.get(story.parent_id)
              if (parent) {
                parent.children.push(node)
              }
            }
          })

          return rootStories[0] || null
        }

        const tree = buildTree(data.stories)
        setTreeData(tree)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story tree')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoryTree()
  }, [storyRootId, currentStoryId])

  const toggleNode = (nodeId: string) => {
    const updateNode = (node: TreeNode): TreeNode => {
      if (node.story.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded }
      }
      return {
        ...node,
        children: node.children.map(updateNode)
      }
    }

    if (treeData) {
      setTreeData(updateNode(treeData))
    }
  }

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isCurrentStory = node.story.id === currentStoryId
    const hasChildren = node.children.length > 0

    return (
      <div key={node.story.id} className="space-y-2">
        <div 
          className={`
            flex items-center space-x-2 p-2 rounded-lg border transition-colors cursor-pointer
            ${isCurrentStory 
              ? 'bg-primary/10 border-primary/20' 
              : 'hover:bg-gray-50 border-gray-200'
            }
          `}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.story.id)
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <div 
            className="flex-1 flex items-center space-x-3"
            onClick={() => onStorySelect(node.story.id)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={node.story.profiles.avatar_url} />
              <AvatarFallback>
                {node.story.profiles.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm truncate">
                  {node.story.title}
                </h4>
                {isCurrentStory && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{node.story.profiles.display_name}</span>
                <span>•</span>
                <span>Level {node.story.level}</span>
                <span>•</span>
                <span>👍 {node.story.like_count}</span>
                <span>👎 {node.story.dislike_count}</span>
              </div>
            </div>
          </div>
        </div>

        {node.isExpanded && hasChildren && (
          <div className="space-y-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapIcon className="h-5 w-5" />
            <span>Story Tree</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapIcon className="h-5 w-5" />
            <span>Story Tree</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!treeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapIcon className="h-5 w-5" />
            <span>Story Tree</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No story tree data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapIcon className="h-5 w-5" />
          <span>Story Tree</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {renderTreeNode(treeData)}
        </div>
      </CardContent>
    </Card>
  )
}
