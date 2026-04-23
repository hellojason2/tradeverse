/**
 * auth.ts — Tradeverse Auth Contract
 *
 * Single source of truth for all auth-related types shared across middleware,
 * route handlers, admin code, and copier code. Import from here — never re-declare
 * these shapes inline elsewhere.
 */

import type {
  FastifyRequest,
  FastifyReply,
  HookHandlerDoneFunction,
  FastifyInstance,
} from 'fastify';

// ---------------------------------------------------------------------------
// 1. Role
// ---------------------------------------------------------------------------

/**
 * All user roles in the system, mirroring the Prisma `UserRole` enum exactly.
 * USER     — standard platform member (copy follower, wallet user, referral participant)
 * TRADER   — strategy owner (can create strategies, has master MT accounts)
 * ADMIN    — platform operator (full back-office access, config writes, user management)
 */
export type UserRole = 'USER' | 'TRADER' | 'ADMIN' | 'MANAGER' | 'SUPER_ADMIN';

// ---------------------------------------------------------------------------
// 2. JWT
// ---------------------------------------------------------------------------

/**
 * Shape of every signed JWT payload, both access and refresh tokens.
 * `sub` is the canonical user ID (UUID string), matching `User.id` in Postgres.
 * `type` distinguishes access tokens from refresh tokens at the middleware layer.
 */
export interface JwtPayload {
  /** User UUID — primary key in the `users` table. */
  sub: string;
  /** Convenience alias for `sub`; some helpers may prefer `id`. */
  id: string;
  /** User's email address at token-issue time. */
  email: string;
  /** User's role at token-issue time. */
  role: UserRole;
  /** Issued-at timestamp (seconds since epoch), set by the signing library. */
  iat: number;
  /** Expiration timestamp (seconds since epoch). Access: short-lived; refresh: long-lived. */
  exp: number;
  /** Discriminates access tokens from refresh tokens. */
  type: 'access' | 'refresh';
  /** Session ID for token rotation and logout. */
  sessionId: string;
}

// ---------------------------------------------------------------------------
// 3. Authenticated user shape (req.user)
// ---------------------------------------------------------------------------

/**
 * Normalised user identity attached to every authenticated request.
 * Derived from the verified JWT payload; never read directly from the DB
 * in hot paths — the token is the source of truth for the request lifetime.
 *
 * Admin handlers and copier handlers should both use this shape — add fields
 * here rather than re-declaring inline.
 */
export interface AuthenticatedUser {
  /** User UUID — primary key in the `users` table. */
  id: string;
  /** User's email address. */
  email: string;
  /** User's current role. */
  role: UserRole;
}

// ---------------------------------------------------------------------------
// 4. Augmented Fastify request
// ---------------------------------------------------------------------------

/**
 * Fastify request augmented with a verified `user` field.
 * Use this type in every route handler that sits behind the auth middleware.
 * Before auth middleware runs, `user` is `undefined`; after verification it is
 * always present and fully typed.
 */
export interface AuthenticatedRequest extends FastifyRequest {
  /** Populated by `authMiddleware` after JWT verification succeeds. */
  user: AuthenticatedUser;
}

// ---------------------------------------------------------------------------
// 5. Middleware function types
// ---------------------------------------------------------------------------

/**
 * Standard Fastify hook handler signature used by the auth middleware.
 * Implementation lives in `middleware/auth.ts`; this type is the contract.
 */
export type AuthMiddleware = (
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => void | Promise<void>;

/**
 * Factory that returns a role-guard middleware.
 * Pass one role or an array of roles that are permitted to reach the route.
 * If the authenticated user's role is not in the allowed set, the middleware
 * replies with 403 FORBIDDEN before the handler runs.
 *
 * @example
 *   fastify.addHook('preHandler', requireRole('ADMIN'));
 *   fastify.addHook('preHandler', requireRole(['ADMIN', 'TRADER']));
 */
export type RequireRole = (
  allowed: UserRole | UserRole[],
) => (
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// 6. Fastify module augmentation — global req.user typing
// ---------------------------------------------------------------------------

/**
 * Augments Fastify's built-in `FastifyRequest` interface so that
 * `request.user` is typed everywhere after the auth decoration is applied,
 * without needing to cast to `AuthenticatedRequest` at every call site.
 *
 * `user` is optional here because it is absent on unauthenticated requests
 * (public routes). Auth-required routes should cast to `AuthenticatedRequest`
 * or assert non-null after the middleware has run.
 */
declare module 'fastify' {
  interface FastifyRequest {
    /** Set by auth middleware after successful JWT verification. */
    user?: AuthenticatedUser;
  }
}

// ---------------------------------------------------------------------------
// 7. Auth error codes
// ---------------------------------------------------------------------------

/**
 * Machine-readable error codes for every auth failure path.
 * Used in API error responses alongside `DomainErrorCode` from `types/errors.ts`.
 * Frontend maps these to the correct UI pattern (inline, modal, redirect).
 */
export type AuthErrorCode =
  /** JWT is absent from the Authorization header or cookie. */
  | 'TOKEN_MISSING'
  /** JWT signature is invalid or the payload cannot be decoded. */
  | 'TOKEN_INVALID'
  /** JWT `exp` is in the past. Client must refresh or re-login. */
  | 'TOKEN_EXPIRED'
  /** Authenticated user's role is not permitted for this resource. */
  | 'FORBIDDEN'
  /** Generic unauthenticated access attempt (no valid session). */
  | 'UNAUTHORIZED';

// ---------------------------------------------------------------------------
// 8. Request body shapes
// ---------------------------------------------------------------------------

/**
 * Body sent by the client when logging in with email + password.
 */
export interface LoginRequestBody {
  /** User's registered email address. */
  email: string;
  /** Plain-text password (hashed server-side; never stored or logged). */
  password: string;
}

/**
 * Body sent by the client when creating a new account.
 */
export interface RegisterRequestBody {
  /** Desired email address — must be unique. */
  email: string;
  /** Plain-text password — validated against strength policy server-side. */
  password: string;
  /** Display name shown in the UI. */
  name: string;
  /**
   * Optional referral code from another user.
   * If provided and valid, a referral relationship is created on registration.
   */
  referralCode?: string;
}

/**
 * Body sent by the client when exchanging a refresh token for a new access token.
 */
export interface RefreshRequestBody {
  /** A valid, non-expired refresh token previously issued by the server. */
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// 9. Response shapes
// ---------------------------------------------------------------------------

/**
 * Successful login response.
 * Both tokens are JWTs; the access token is short-lived (15m default),
 * the refresh token is long-lived (7d default).
 */
export interface LoginResponse {
  /** Short-lived JWT for authorising API requests. */
  accessToken: string;
  /** Long-lived JWT for obtaining new access tokens without re-login. */
  refreshToken: string;
  /** Authenticated user's identity, ready to hydrate frontend auth store. */
  user: AuthenticatedUser;
}

/**
 * Successful registration response.
 * Mirrors `LoginResponse` — the user is automatically logged in after sign-up.
 */
export interface RegisterResponse {
  /** Short-lived JWT for authorising API requests. */
  accessToken: string;
  /** Long-lived JWT for obtaining new access tokens without re-login. */
  refreshToken: string;
  /** Newly created user's identity. */
  user: AuthenticatedUser;
}

/**
 * Successful token-refresh response.
 * A new access token is always issued; a new refresh token is issued if the
 * original is within the rotation window (rolling refresh strategy).
 */
export interface RefreshResponse {
  /** Freshly issued short-lived access token. */
  accessToken: string;
  /**
   * Freshly issued refresh token (rotation).
   * Old refresh token is invalidated after this call.
   */
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// 10. Plugin registration helper type
// ---------------------------------------------------------------------------

/**
 * Type for a Fastify plugin function that registers auth-related decorators
 * or hooks onto a Fastify instance. Agents implementing the auth plugin should
 * match this signature.
 */
export type AuthPlugin = (
  fastify: FastifyInstance,
  opts: Record<string, unknown>,
) => Promise<void>;
