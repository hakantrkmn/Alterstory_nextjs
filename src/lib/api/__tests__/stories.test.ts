import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getStoriesForFeed, 
  createStory, 
  addContinuation,
  hasUserContributedToStory,
  validateStoryInput,
  validateContinuationInput
} from '../stories'
import { ErrorCodes } from '../stories'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        is: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  })
}))

describe('Story API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateStoryInput', () => {
    it('should return null for valid input', () => {
      const result = validateStoryInput({
        title: 'Test Story',
        content: 'This is a test story content.',
        authorId: 'user-123'
      })
      expect(result).toBeNull()
    })

    it('should return error for missing title', () => {
      const result = validateStoryInput({
        title: '',
        content: 'This is a test story content.',
        authorId: 'user-123'
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Story title is required'
      })
    })

    it('should return error for missing content', () => {
      const result = validateStoryInput({
        title: 'Test Story',
        content: '',
        authorId: 'user-123'
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Story content is required'
      })
    })

    it('should return error for content exceeding 800 characters', () => {
      const longContent = 'a'.repeat(801)
      const result = validateStoryInput({
        title: 'Test Story',
        content: longContent,
        authorId: 'user-123'
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Story content cannot exceed 800 characters'
      })
    })

    it('should return error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      const result = validateStoryInput({
        title: longTitle,
        content: 'This is a test story content.',
        authorId: 'user-123'
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Story title cannot exceed 200 characters'
      })
    })
  })

  describe('validateContinuationInput', () => {
    it('should return null for valid input', () => {
      const result = validateContinuationInput({
        title: 'Test Continuation',
        content: 'This is a test continuation content.',
        authorId: 'user-123',
        parentId: 'story-123',
        storyRootId: 'story-123',
        level: 1
      })
      expect(result).toBeNull()
    })

    it('should return error for missing title', () => {
      const result = validateContinuationInput({
        title: '',
        content: 'This is a test continuation content.',
        authorId: 'user-123',
        parentId: 'story-123',
        storyRootId: 'story-123',
        level: 1
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Continuation title is required'
      })
    })

    it('should return error for missing content', () => {
      const result = validateContinuationInput({
        title: 'Test Continuation',
        content: '',
        authorId: 'user-123',
        parentId: 'story-123',
        storyRootId: 'story-123',
        level: 1
      })
      expect(result).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Continuation content is required'
      })
    })
  })

  describe('getStoriesForFeed', () => {
    it('should fetch stories successfully', async () => {
      const result = await getStoriesForFeed(0, 20)
      expect(result.error).toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('createStory', () => {
    it('should create story successfully', async () => {
      const storyInput = {
        title: 'Test Story',
        content: 'This is a test story content.',
        authorId: 'user-123'
      }
      
      const result = await createStory(storyInput)
      expect(result.error).toBeNull()
    })

    it('should return validation error for invalid input', async () => {
      const storyInput = {
        title: '',
        content: 'This is a test story content.',
        authorId: 'user-123'
      }
      
      const result = await createStory(storyInput)
      expect(result.error).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Story title is required'
      })
    })
  })

  describe('addContinuation', () => {
    it('should add continuation successfully', async () => {
      const continuationInput = {
        title: 'Test Continuation',
        content: 'This is a test continuation content.',
        authorId: 'user-123',
        parentId: 'story-123',
        storyRootId: 'story-123',
        level: 1
      }
      
      const result = await addContinuation(continuationInput)
      expect(result.error).toBeNull()
    })

    it('should return validation error for invalid input', async () => {
      const continuationInput = {
        title: '',
        content: 'This is a test continuation content.',
        authorId: 'user-123',
        parentId: 'story-123',
        storyRootId: 'story-123',
        level: 1
      }
      
      const result = await addContinuation(continuationInput)
      expect(result.error).toEqual({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Continuation title is required'
      })
    })
  })

  describe('hasUserContributedToStory', () => {
    it('should check contribution status successfully', async () => {
      const result = await hasUserContributedToStory('user-123', 'story-123')
      expect(result.error).toBeNull()
      expect(typeof result.hasContributed).toBe('boolean')
    })
  })
})
