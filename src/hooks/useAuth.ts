import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@contracts/routes';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isTrader = user?.role === 'USER' || user?.role === 'PROVIDER' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return {
    user,
    isAuthenticated,
    accessToken,
    isAdmin,
    isTrader,
    login,
    logout,
    refresh,
  };
}

export function useHasRole(role: UserRole | UserRole[]) {
  const { user } = useAuth();
  const roles = Array.isArray(role) ? role : [role];
  return user ? roles.includes(user.role) : false;
}
