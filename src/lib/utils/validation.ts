import { ErrorCodes, type AppError } from '@/lib/api'

// Story validation
export const validateStoryTitle = (title: string): AppError | null => {
  if (!title?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story title is required"
    }
  }
  
  if (title.length > 200) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story title cannot exceed 200 characters"
    }
  }
  
  return null
}

export const validateStoryContent = (content: string): AppError | null => {
  if (!content?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story content is required"
    }
  }
  
  if (content.length > 800) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Story content cannot exceed 800 characters"
    }
  }
  
  return null
}

export const validateStoryInput = (title: string, content: string): AppError | null => {
  const titleError = validateStoryTitle(title)
  if (titleError) return titleError
  
  const contentError = validateStoryContent(content)
  if (contentError) return contentError
  
  return null
}

// Comment validation
export const validateCommentContent = (content: string): AppError | null => {
  if (!content?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Comment content is required"
    }
  }
  
  if (content.length > 1000) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Comment content cannot exceed 1000 characters"
    }
  }
  
  return null
}

// User profile validation
export const validateUsername = (username: string): AppError | null => {
  if (!username?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Username is required"
    }
  }
  
  if (username.length > 50) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Username cannot exceed 50 characters"
    }
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Username can only contain letters, numbers, underscores, and hyphens"
    }
  }
  
  return null
}

export const validateDisplayName = (displayName: string): AppError | null => {
  if (!displayName?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Display name is required"
    }
  }
  
  if (displayName.length > 100) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Display name cannot exceed 100 characters"
    }
  }
  
  return null
}

export const validateBio = (bio: string): AppError | null => {
  if (bio && bio.length > 500) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Bio cannot exceed 500 characters"
    }
  }
  
  return null
}

// Search validation
export const validateSearchQuery = (query: string): AppError | null => {
  if (!query?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Search query is required"
    }
  }
  
  if (query.length < 2) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Search query must be at least 2 characters long"
    }
  }
  
  if (query.length > 100) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Search query cannot exceed 100 characters"
    }
  }
  
  return null
}

// Pagination validation
export const validatePagination = (page: number, limit: number): AppError | null => {
  if (page < 0) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Page number must be non-negative"
    }
  }
  
  if (limit < 1 || limit > 100) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Limit must be between 1 and 100"
    }
  }
  
  return null
}

// UUID validation
export const validateUUID = (uuid: string): AppError | null => {
  if (!uuid?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "ID is required"
    }
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Invalid ID format"
    }
  }
  
  return null
}

// Email validation
export const validateEmail = (email: string): AppError | null => {
  if (!email?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Email is required"
    }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Please enter a valid email address"
    }
  }
  
  return null
}

// Password validation
export const validatePassword = (password: string): AppError | null => {
  if (!password) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Password is required"
    }
  }
  
  if (password.length < 6) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Password must be at least 6 characters long"
    }
  }
  
  return null
}

// Generic string validation
export const validateRequiredString = (
  value: string, 
  fieldName: string, 
  maxLength?: number
): AppError | null => {
  if (!value?.trim()) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: `${fieldName} is required`
    }
  }
  
  if (maxLength && value.length > maxLength) {
    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: `${fieldName} cannot exceed ${maxLength} characters`
    }
  }
  
  return null
}
