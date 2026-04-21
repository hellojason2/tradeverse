import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type {
  WalletBalance,
  Transaction,
  DepositRequest,
  DepositAddressResponse,
  WithdrawRequest,
  GetTransactionsQuery,
  ApiResponse,
  Paginated,
} from '@contracts/routes';

export function useWalletBalance() {
  return useQuery<ApiResponse<WalletBalance>>({
    queryKey: ['wallet', 'balance'],
    queryFn: () => apiClient.get('/wallet/balance'),
    staleTime: 15_000,
  });
}

export function useTransactions(params?: GetTransactionsQuery) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ApiResponse<Paginated<Transaction>>>({
    queryKey: ['wallet', 'transactions', params],
    queryFn: () => apiClient.get(`/wallet/transactions${qs}`),
    staleTime: 15_000,
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<DepositAddressResponse | Transaction>, Error, DepositRequest>({
    mutationFn: (body) => apiClient.post('/wallet/deposit', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      qc.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Transaction>, Error, WithdrawRequest>({
    mutationFn: (body) => apiClient.post('/wallet/withdraw', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'balance'] });
      qc.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
    },
  });
}

export function useCancelTransaction() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Transaction>, Error, string>({
    mutationFn: (id) => apiClient.post(`/wallet/transactions/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
  });
}
