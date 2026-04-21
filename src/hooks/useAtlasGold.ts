import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  AtlasGoldBalance,
  AtlasGoldTransaction,
  BuyAtlasGoldRequest,
  RedeemAtlasGoldRequest,
  GetAtlasGoldHistoryQuery,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useAtlasGoldBalance() {
  return useQuery<ApiResponse<AtlasGoldBalance>>({
    queryKey: ['atlas-gold', 'balance'],
    queryFn: () => apiClient.get('/atlas-gold/balance'),
    staleTime: 15_000,
  });
}

export function useAtlasGoldHistory(params?: GetAtlasGoldHistoryQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<AtlasGoldTransaction>>>({
    queryKey: ['atlas-gold', 'history', params],
    queryFn: () => apiClient.get(`/atlas-gold/history${qs}`),
    staleTime: 30_000,
  });
}

export function useBuyAtlasGold() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AtlasGoldTransaction>, Error, BuyAtlasGoldRequest>({
    mutationFn: (body) => apiClient.post('/atlas-gold/buy', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atlas-gold', 'balance'] });
      qc.invalidateQueries({ queryKey: ['atlas-gold', 'history'] });
      qc.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
  });
}

export function useRedeemAtlasGold() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AtlasGoldTransaction>, Error, RedeemAtlasGoldRequest>({
    mutationFn: (body) => apiClient.post('/atlas-gold/redeem', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atlas-gold', 'balance'] });
      qc.invalidateQueries({ queryKey: ['atlas-gold', 'history'] });
      qc.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    },
  });
}
