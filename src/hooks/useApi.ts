import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Notification } from '@contracts/routes';

// Dashboard (aggregate endpoint)
interface DashboardResponse {
  portfolioValue: number;
  totalPnl: number;
  pnlPercent: number;
  activeStrategies: number;
  openPositions: number;
  copyRelations: number;
  winRate: number;
  todayPnl: number;
  todayPnlPercent: number;
  weeklyPnl: number;
  monthlyPnl: number;
  equityCurve: Array<{ date: string; value: number }>;
  portfolioAllocation: Array<{ label: string; value: number; color: string }>;
  recentActivity: Array<{ id: string; type: string; description: string; amount: number; timestamp: string }>;
}

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard'),
    staleTime: 30 * 1000,
  });
}

// Notifications (legacy re-export for backward compat)
interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications'),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.post('/notifications/read-all', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
