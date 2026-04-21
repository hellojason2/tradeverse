export type DomainErrorCode = 'USER_INPUT' | 'USER_STATE' | 'BUSINESS_RULE' | 'SYSTEM_ERROR' | 'FORBIDDEN' | 'NOT_FOUND';

export const HttpStatusMap: Record<DomainErrorCode, number> = {
  USER_INPUT: 400,
  USER_STATE: 409,
  BUSINESS_RULE: 422,
  SYSTEM_ERROR: 500,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
};

export class DomainError extends Error {
  constructor(
    public code: DomainErrorCode,
    message: string,
    public meta?: Record<string, unknown>,
    public isOperational = true,
  ) {
    super(message);
    this.name = 'DomainError';
    Error.captureStackTrace?.(this, DomainError);
  }
}
