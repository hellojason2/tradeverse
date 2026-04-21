export type DomainErrorCode = 'USER_INPUT' | 'USER_STATE' | 'BUSINESS_RULE' | 'SYSTEM_ERROR';

export const HttpStatusMap: Record<DomainErrorCode, number> = {
  USER_INPUT: 400,
  USER_STATE: 409,
  BUSINESS_RULE: 422,
  SYSTEM_ERROR: 500,
};

/** Base application error with HTTP status support. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

/** Domain-level business logic error. Maps to 4xx status codes. */
export class DomainError extends AppError {
  constructor(
    code: DomainErrorCode,
    message: string,
    public meta?: Record<string, unknown>,
  ) {
    super(HttpStatusMap[code], code, message, true);
    this.name = 'DomainError';
    Error.captureStackTrace?.(this, DomainError);
  }
}

/** Authentication/authorization error. Maps to 401/403. */
export class AuthError extends AppError {
  constructor(
    public authCode: string,
    message: string,
    statusCode: number = 401,
  ) {
    super(statusCode, authCode, message, true);
    this.name = 'AuthError';
    Error.captureStackTrace?.(this, AuthError);
  }
}

/** Validation error with per-field details. Maps to 400. */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields: Record<string, string>,
  ) {
    super(400, 'VALIDATION_ERROR', message, true);
    this.name = 'ValidationError';
    Error.captureStackTrace?.(this, ValidationError);
  }
}
