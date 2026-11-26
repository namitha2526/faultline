import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import { ClusterStatus } from '../types';

export function useClusters(params?: {
  status?: string;
  search?: string;
  browser?: string;
  sort?: 'count' | 'last_seen' | 'similarity';
}) {
  return useQuery({
    queryKey: ['clusters', params],
    queryFn: () => apiClient.getClusters(params),
    refetchInterval: 10000,
  });
}

export function useClusterDetail(id: string | null) {
  return useQuery({
    queryKey: ['cluster', id],
    queryFn: () => (id ? apiClient.getCluster(id) : null),
    enabled: Boolean(id),
  });
}

export function useUpdateClusterStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClusterStatus }) =>
      apiClient.updateClusterStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['cluster', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useBulkResolve() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkResolve(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}
