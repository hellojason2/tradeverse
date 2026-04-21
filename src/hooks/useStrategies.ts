import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  Strategy,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  GetStrategiesQuery,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useStrategies(params?: GetStrategiesQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<Strategy>>>({
    queryKey: ['strategies', params],
    queryFn: () => apiClient.get(`/strategies${qs}`),
    staleTime: 30_000,
  });
}

export function useStrategy(id: string) {
  return useQuery<ApiResponse<Strategy>>({
    queryKey: ['strategy', id],
    queryFn: () => apiClient.get(`/strategies/${id}`),
    staleTime: 30_000,
    enabled: Boolean(id),
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Strategy>, Error, CreateStrategyRequest>({
    mutationFn: (body) => apiClient.post('/strategies', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strategies'] }),
  });
}

export function useUpdateStrategy(id: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Strategy>, Error, UpdateStrategyRequest>({
    mutationFn: (body) => apiClient.patch(`/strategies/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      qc.invalidateQueries({ queryKey: ['strategy', id] });
    },
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<{ success: true }>, Error, string>({
    mutationFn: (id) => apiClient.delete(`/strategies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strategies'] }),
  });
}
