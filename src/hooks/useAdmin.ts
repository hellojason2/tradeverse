import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  AdminUserDetail,
  ConfigEntry,
  Transaction,
  GetAdminUsersQuery,
  GetAdminWithdrawalsQuery,
  UpdateConfigRequest,
  SuspendUserRequest,
  BanUserRequest,
  KycRejectRequest,
  RejectWithdrawalRequest,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useAdminUsers(params?: GetAdminUsersQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<AdminUserDetail>>>({
    queryKey: ['admin', 'users', params],
    queryFn: () => apiClient.get(`/admin/users${qs}`),
    staleTime: 60_000,
  });
}

export function useAdminUser(id: string) {
  return useQuery<ApiResponse<AdminUserDetail>>({
    queryKey: ['admin', 'user', id],
    queryFn: () => apiClient.get(`/admin/users/${id}`),
    staleTime: 60_000,
    enabled: Boolean(id),
  });
}

export function useAdminConfig() {
  return useQuery<ApiResponse<ConfigEntry[]>>({
    queryKey: ['admin', 'config'],
    queryFn: () => apiClient.get('/admin/config'),
    staleTime: 60_000,
  });
}

export function useUpdateConfig(key: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ConfigEntry>, Error, UpdateConfigRequest>({
    mutationFn: (body) => apiClient.patch(`/admin/config/${key}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'config'] }),
  });
}

export function useAdminWithdrawals(params?: GetAdminWithdrawalsQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<Transaction>>>({
    queryKey: ['admin', 'withdrawals', params],
    queryFn: () => apiClient.get(`/admin/withdrawals${qs}`),
    staleTime: 30_000,
  });
}

export function useApproveWithdrawal() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Transaction>, Error, string>({
    mutationFn: (id) => apiClient.post(`/admin/withdrawals/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });
}

export function useRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Transaction>, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiClient.post(`/admin/withdrawals/${id}/reject`, { reason } satisfies RejectWithdrawalRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUserDetail>, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiClient.post(`/admin/users/${id}/suspend`, { reason } satisfies SuspendUserRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUserDetail>, Error, string>({
    mutationFn: (id) => apiClient.post(`/admin/users/${id}/unsuspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUserDetail>, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiClient.post(`/admin/users/${id}/ban`, { reason } satisfies BanUserRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useKycApprove() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUserDetail>, Error, string>({
    mutationFn: (id) => apiClient.post(`/admin/users/${id}/kyc/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useKycReject() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUserDetail>, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      apiClient.post(`/admin/users/${id}/kyc/reject`, { reason } satisfies KycRejectRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
