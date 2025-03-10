// src/lib/transforms/baseTransforms.ts
// Core transformation utilities and interfaces

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    [key: string]: any;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Standard paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: PaginationMeta;
    [key: string]: any;
  };
}

/**
 * Create a standard API response
 */
export function createApiResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    data,
    ...(meta ? { meta } : {})
  };
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  additionalMeta?: any
): PaginatedApiResponse<T> {
  return {
    data,
    meta: {
      pagination,
      ...additionalMeta
    }
  };
}

/**
 * Apply a transform function to an array of items
 */
export function transformArray<T, R>(
  items: T[] | null | undefined,
  transformFn: (item: T) => R | null
): R[] {
  if (!items) return [];
  return items.map(item => transformFn(item)).filter((item): item is R => item !== null);
}

/**
 * A helper for easily constructing API responses with transformed data
 */
export function createTransformedResponse<T, R>(
  data: T | null,
  transformFn: (item: T) => R | null,
  meta?: any
): ApiResponse<R | null> {
  return createApiResponse(data ? transformFn(data) : null, meta);
}

/**
 * A helper for easily constructing paginated API responses with transformed data
 */
export function createTransformedPaginatedResponse<T, R>(
  data: T[],
  transformFn: (item: T) => R | null,
  pagination: PaginationMeta,
  additionalMeta?: any
): PaginatedApiResponse<R> {
  const transformedData = data.map(item => transformFn(item)).filter((item): item is R => item !== null);
  return createPaginatedResponse(transformedData, pagination, additionalMeta);
}
