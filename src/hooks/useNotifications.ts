import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  Notification,
  GetNotificationsQuery,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useNotifications(params?: GetNotificationsQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<Notification>>>({
    queryKey: ['notifications', params],
    queryFn: () => apiClient.get(`/notifications${qs}`),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Notification>, Error, string>({
    mutationFn: (id) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<{ count: number }>, Error, void>({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
