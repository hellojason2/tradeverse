/**
 * Stub auth module — Agent 3 (Business & Wallet)
 *
 * Re-exports auth contract types for use in development.
 * MUST be replaced with real middleware imports from Agent 1 before merging to main.
 */

// Re-export the authoritative types from the contracts layer
export type {
  AuthenticatedUser,
  AuthenticatedRequest,
  AuthMiddleware,
} from '../../../contracts/auth.js';

// Re-export the actual middleware from Agent 1's middleware module
// Currently a no-op stub until Agent 1 provides the real implementation
export { authMiddleware } from '../../../middleware/auth.js';
