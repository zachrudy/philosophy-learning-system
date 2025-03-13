// src/lib/errors/appErrors.ts

/**
 * Base application error class that all other errors will extend
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates whether this is an expected error that we can handle gracefully

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Used when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Used for validation errors (bad input)
 */
export class ValidationError extends AppError {
  public invalidFields?: Record<string, string>;

  constructor(message: string = 'Validation failed', invalidFields?: Record<string, string>) {
    super(message, 400);
    this.invalidFields = invalidFields;
  }
}

/**
 * Used when a conflict occurs (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Used for circular dependency errors in prerequisites
 */
export class CircularDependencyError extends AppError {
  public path?: string[];

  constructor(message: string = 'Circular dependency detected', path?: string[]) {
    super(message, 400);
    this.path = path;
  }
}

/**
 * Used when a user is not authorized to perform an action
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

/**
 * Used when a user doesn't have sufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden - insufficient permissions') {
    super(message, 403);
  }
}

/**
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

/**
 * Used when a dependency is preventing an operation (e.g., can't delete a lecture that's a prerequisite)
 */
export class DependencyError extends AppError {
  public dependencies?: string[];

  constructor(message: string = 'Operation blocked by dependencies', dependencies?: string[]) {
    super(message, 400);
    this.dependencies = dependencies;
  }
}
