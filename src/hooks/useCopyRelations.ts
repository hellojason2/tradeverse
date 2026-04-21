import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  CopyRelation,
  SubscribeRequest,
  CloseCopyRelationRequest,
  UpdateRiskCapitalRequest,
  GetCopyRelationsQuery,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useCopyRelations(params?: GetCopyRelationsQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<CopyRelation>>>({
    queryKey: ['copy-relations', params],
    queryFn: () => apiClient.get(`/copy-relations${qs}`),
    staleTime: 30_000,
  });
}

export function useCopyRelation(id: string) {
  return useQuery<ApiResponse<CopyRelation>>({
    queryKey: ['copy-relation', id],
    queryFn: () => apiClient.get(`/copy-relations/${id}`),
    staleTime: 30_000,
    enabled: Boolean(id),
  });
}

export function useSubscribeCopy() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, SubscribeRequest>({
    mutationFn: (body) => apiClient.post('/copy-relations/subscribe', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copy-relations'] }),
  });
}

export function useActivateCopyRelation() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, string>({
    mutationFn: (id) => apiClient.post(`/copy-relations/${id}/activate`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['copy-relations'] });
      qc.invalidateQueries({ queryKey: ['copy-relation', id] });
    },
  });
}

export function usePauseCopyRelation() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, string>({
    mutationFn: (id) => apiClient.post(`/copy-relations/${id}/pause`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['copy-relations'] });
      qc.invalidateQueries({ queryKey: ['copy-relation', id] });
    },
  });
}

export function useResumeCopyRelation() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, string>({
    mutationFn: (id) => apiClient.post(`/copy-relations/${id}/resume`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['copy-relations'] });
      qc.invalidateQueries({ queryKey: ['copy-relation', id] });
    },
  });
}

export function useCloseCopyRelation() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => apiClient.post(`/copy-relations/${id}/close`, { reason } satisfies CloseCopyRelationRequest),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['copy-relations'] });
      qc.invalidateQueries({ queryKey: ['copy-relation', id] });
    },
  });
}

export function useUpdateRiskCapital() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CopyRelation>, Error, { id: string; riskCapital: string }>({
    mutationFn: ({ id, riskCapital }) =>
      apiClient.patch(`/copy-relations/${id}/risk-capital`, { riskCapital } satisfies UpdateRiskCapitalRequest),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['copy-relations'] });
      qc.invalidateQueries({ queryKey: ['copy-relation', id] });
    },
  });
}
