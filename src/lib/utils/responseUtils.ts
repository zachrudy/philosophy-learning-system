// src/lib/utils/responseUtils.ts
import { AppError, ValidationError } from '@/lib/errors/appErrors';

/**
 * Standard successful response format
 */
export function successResponse<T>(data: T, message?: string, metadata?: any) {
  const response: any = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return response;
}

/**
 * Standard error response format
 */
export function errorResponse(error: Error | string, metadata?: any) {
  const response: any = {
    success: false,
    error: typeof error === 'string' ? error : error.message
  };

  // Handle AppError types
  if (error instanceof AppError) {
    response.statusCode = error.statusCode;

    // Add validation fields if this is a validation error
    if (error instanceof ValidationError && error.invalidFields) {
      response.invalidFields = error.invalidFields;
    }

    // For other custom error properties, extract them
    const customProperties = Object.entries(error)
      .filter(([key]) => !['name', 'message', 'stack', 'statusCode', 'isOperational', 'invalidFields'].includes(key));

    // Add any custom properties to the response
    if (customProperties.length > 0) {
      customProperties.forEach(([key, value]) => {
        response[key] = value;
      });
    }
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return response;
}

/**
 * Standard paginated response format
 */
export function paginatedResponse<T>(
  data: T[],
  {
    page,
    limit,
    total,
    additionalMetadata = {}
  }: {
    page: number;
    limit: number;
    total: number;
    additionalMetadata?: Record<string, any>;
  }
) {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    metadata: {
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      ...additionalMetadata
    }
  };
}
