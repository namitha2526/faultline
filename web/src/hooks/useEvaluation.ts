import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';

export function useEvaluation() {
  return useQuery({
    queryKey: ['evaluation'],
    queryFn: () => apiClient.getEvaluation(),
  });
}

export function useEmbeddingMap() {
  return useQuery({
    queryKey: ['embedding-map'],
    queryFn: () => apiClient.getEmbeddingMap(),
  });
}

export function useReleases() {
  return useQuery({
    queryKey: ['releases'],
    queryFn: () => apiClient.getReleases(),
  });
}
