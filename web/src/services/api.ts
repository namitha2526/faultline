import {
  ClusterDetail,
  ClusterListItem,
  DemoStatus,
  EmbeddingMapPoint,
  EvaluationData,
  OverviewMetrics,
} from '../types/api';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  getOverview: (): Promise<OverviewMetrics> => fetchJson('/overview'),

  getClusters: (): Promise<ClusterListItem[]> => fetchJson('/clusters'),

  getClusterDetail: (id: string): Promise<ClusterDetail> => fetchJson(`/clusters/${id}`),

  getEmbeddingMap: (recompute: boolean = false): Promise<{ total_points: number; points: EmbeddingMapPoint[] }> =>
    fetchJson(`/embedding-map?recompute=${recompute}`),

  getEvaluation: (recompute: boolean = false): Promise<EvaluationData> =>
    fetchJson(`/evaluation?recompute=${recompute}`),

  // Demo Controls
  startDemo: (speed: number = 2.0, simulate_spike: boolean = false): Promise<any> =>
    fetchJson('/demo/start', {
      method: 'POST',
      body: JSON.stringify({ speed, simulate_spike }),
    }),

  stopDemo: (): Promise<any> =>
    fetchJson('/demo/stop', {
      method: 'POST',
    }),

  setDemoSpeed: (speed: number): Promise<any> =>
    fetchJson('/demo/speed', {
      method: 'POST',
      body: JSON.stringify({ speed }),
    }),

  triggerDemoSpike: (root_cause: string = 'RC-2'): Promise<any> =>
    fetchJson('/demo/spike', {
      method: 'POST',
      body: JSON.stringify({ root_cause }),
    }),

  getDemoStatus: (): Promise<DemoStatus> => fetchJson('/demo/status'),

  // ML Reclustering
  triggerClusterRun: (algorithm: string = 'dbscan', eps: number = 0.22, min_samples: number = 3): Promise<any> =>
    fetchJson('/cluster/run', {
      method: 'POST',
      body: JSON.stringify({ algorithm, eps, min_samples }),
    }),
};
