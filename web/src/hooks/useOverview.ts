import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: () => apiClient.getOverview(),
    refetchInterval: 8000,
  });
}
