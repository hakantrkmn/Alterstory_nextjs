import { ErrorCodes, type AppError } from '@/lib/api'

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: "You must be logged in to perform this action",
  [ErrorCodes.FORBIDDEN]: "You don't have permission to perform this action",
  [ErrorCodes.NOT_FOUND]: "The requested resource was not found",
  [ErrorCodes.VALIDATION_ERROR]: "Please check your input and try again",
  [ErrorCodes.ALREADY_CONTRIBUTED]: "You have already contributed to this story",
  [ErrorCodes.MAX_CONTINUATIONS_REACHED]: "Maximum continuations reached for this story",
  [ErrorCodes.NETWORK_ERROR]: "Network error. Please check your connection and try again",
}

// Get user-friendly error message
export const getErrorMessage = (error: AppError | null): string => {
  if (!error) return ""
  
  // Return custom message if provided
  if (error.message) {
    return error.message
  }
  
  // Return mapped message if available
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code]
  }
  
  // Fallback to generic message
  return "An unexpected error occurred. Please try again."
}

// Check if error is a specific type
export const isErrorType = (error: AppError | null, errorCode: ErrorCodes): boolean => {
  return error?.code === errorCode
}

// Check if error is a validation error
export const isValidationError = (error: AppError | null): boolean => {
  return isErrorType(error, ErrorCodes.VALIDATION_ERROR)
}

// Check if error is a network error
export const isNetworkError = (error: AppError | null): boolean => {
  return isErrorType(error, ErrorCodes.NETWORK_ERROR)
}

// Check if error is an authentication error
export const isAuthError = (error: AppError | null): boolean => {
  return isErrorType(error, ErrorCodes.UNAUTHORIZED) || isErrorType(error, ErrorCodes.FORBIDDEN)
}

// Check if error is a not found error
export const isNotFoundError = (error: AppError | null): boolean => {
  return isErrorType(error, ErrorCodes.NOT_FOUND)
}

// Check if error is a contribution limit error
export const isContributionLimitError = (error: AppError | null): boolean => {
  return isErrorType(error, ErrorCodes.ALREADY_CONTRIBUTED) || 
         isErrorType(error, ErrorCodes.MAX_CONTINUATIONS_REACHED)
}

// Create a generic error
export const createError = (code: ErrorCodes, message?: string, details?: unknown): AppError => {
  return {
    code,
    message: message || ERROR_MESSAGES[code] || "An error occurred",
    details
  }
}

// Handle async operation with error catching
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorCode: ErrorCodes = ErrorCodes.NETWORK_ERROR
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (err) {
    const error = createError(
      errorCode,
      err instanceof Error ? err.message : "An unexpected error occurred"
    )
    return { data: null, error }
  }
}
