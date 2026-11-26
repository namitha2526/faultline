import {
  Cluster,
  ClusterStatus,
  ErrorEvent,
  OverviewMetrics,
  EmbeddingPoint,
  EvaluationData,
  ReleaseItem,
  LiveStreamEvent,
} from '../types';
import {
  initialClusters,
  allErrors,
  initialOverviewMetrics,
  initialEmbeddingPoints,
  initialEvaluationData,
  initialReleases,
} from './groundTruthData';

// Mutable in-memory store for interactive sessions
let currentClusters: Cluster[] = JSON.parse(JSON.stringify(initialClusters));
let currentMetrics: OverviewMetrics = JSON.parse(JSON.stringify(initialOverviewMetrics));
let isSpikeSimulated = false;

// Artificial async network delay for realism
const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async getOverview(): Promise<OverviewMetrics> {
    await delay(60);
    return JSON.parse(JSON.stringify(currentMetrics));
  },

  async getClusters(params?: {
    status?: string;
    search?: string;
    browser?: string;
    sort?: 'count' | 'last_seen' | 'similarity';
  }): Promise<Cluster[]> {
    await delay(70);
    let list = [...currentClusters];

    if (params?.status && params.status !== 'all') {
      list = list.filter((c) => c.status === params.status);
    }

    if (params?.browser && params.browser !== 'all') {
      list = list.filter((c) => Object.keys(c.browsers).some((b) => b.toLowerCase().includes(params.browser!.toLowerCase())));
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.exception_type.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.shared_functions.some((fn) => fn.toLowerCase().includes(q))
      );
    }

    if (params?.sort === 'last_seen') {
      list.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
    } else if (params?.sort === 'similarity') {
      list.sort((a, b) => b.similarity_score - a.similarity_score);
    } else {
      // default: count desc
      list.sort((a, b) => b.error_count - a.error_count);
    }

    return list;
  },

  async getCluster(id: string): Promise<Cluster> {
    await delay(50);
    const found = currentClusters.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Cluster not found: ${id}`);
    }
    return JSON.parse(JSON.stringify(found));
  },

  async getErrors(params?: { cluster_id?: string; limit?: number }): Promise<ErrorEvent[]> {
    await delay(60);
    let list = [...allErrors];
    if (params?.cluster_id) {
      list = list.filter((e) => e.cluster_id === params.cluster_id);
    }
    if (params?.limit) {
      list = list.slice(0, params.limit);
    }
    return list;
  },

  async getEmbeddingMap(): Promise<EmbeddingPoint[]> {
    await delay(90);
    return JSON.parse(JSON.stringify(initialEmbeddingPoints));
  },

  async getEvaluation(): Promise<EvaluationData> {
    await delay(60);
    return JSON.parse(JSON.stringify(initialEvaluationData));
  },

  async getReleases(): Promise<ReleaseItem[]> {
    await delay(50);
    return JSON.parse(JSON.stringify(initialReleases));
  },

  async updateClusterStatus(id: string, status: ClusterStatus): Promise<Cluster> {
    await delay(40);
    const target = currentClusters.find((c) => c.id === id);
    if (target) {
      target.status = status;
    }
    return JSON.parse(JSON.stringify(target));
  },

  async bulkResolve(ids: string[]): Promise<string[]> {
    await delay(60);
    currentClusters.forEach((c) => {
      if (ids.includes(c.id)) {
        c.status = 'resolved';
      }
    });
    return ids;
  },

  // Simulate bad deployment spike
  triggerBadDeploy(active: boolean): { is_active: boolean; affected_cluster: string } {
    isSpikeSimulated = active;
    const paymentCluster = currentClusters.find((c) => c.id === 'RC-2');
    if (paymentCluster) {
      paymentCluster.is_spiking = active;
      if (active) {
        paymentCluster.error_count += 48;
        paymentCluster.spike_velocity = 28.5;
        paymentCluster.sparkline = [...paymentCluster.sparkline.slice(4), 45, 62, 85, 120];
        currentMetrics.errors_24h += 48;
        currentMetrics.spiking_clusters_count = 3;
      } else {
        paymentCluster.spike_velocity = undefined;
        currentMetrics.spiking_clusters_count = 2;
      }
    }
    return {
      is_active: active,
      affected_cluster: 'RC-2 (Payment Gateway Timeout)',
    };
  },

  isSpikeActive(): boolean {
    return isSpikeSimulated;
  },

  // Generate a live incoming error event that matches one of the clusters
  generateLiveFeedEvent(targetClusterId?: string): LiveStreamEvent {
    const cluster = targetClusterId
      ? currentClusters.find((c) => c.id === targetClusterId) || currentClusters[0]
      : currentClusters[Math.floor(Math.random() * currentClusters.length)];

    // Pick a realistic error payload from cluster members
    const pool = allErrors.filter((e) => e.cluster_id === cluster.id);
    const sample = pool[Math.floor(Math.random() * pool.length)] || allErrors[0];

    cluster.error_count += 1;
    currentMetrics.total_errors += 1;
    currentMetrics.errors_24h += 1;

    const eventError: ErrorEvent = {
      ...sample,
      id: `live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    return {
      id: `evt_${Date.now()}`,
      type: 'incoming_error',
      error: eventError,
      target_cluster_id: cluster.id,
      target_cluster_title: cluster.title,
      target_cluster_count: cluster.error_count,
      is_spike: cluster.is_spiking,
      timestamp: new Date().toISOString(),
    };
  },
};
