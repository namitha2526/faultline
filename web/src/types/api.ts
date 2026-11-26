export interface OverviewMetrics {
  total_errors: number;
  total_clusters: number;
  total_hash_issues: number;
  compression_ratio: number;
  hash_compression_ratio: number;
  recent_errors_count_24h: number;
  spiking_clusters_count: number;
  comparison: {
    raw_errors: number;
    hash_groups: number;
    semantic_clusters: number;
    noise_reduction_pct: number;
    ratio_improvement: string;
  };
}

export interface ClusterListItem {
  id: string;
  project_id: string;
  title: string;
  representative_message: string;
  first_seen: string;
  last_seen: string;
  error_count: number;
  status: string;
  is_spiking: boolean;
  browsers: Record<string, number>;
  sparkline: number[];
}

export interface ClusterMember {
  id: string;
  message: string;
  exception_type?: string;
  browser?: string;
  os?: string;
  url?: string;
  user_id?: string;
  release?: string;
  timestamp: string;
  stack_trace?: string;
  stack_hash?: string;
  similarity_score: number;
}

export interface ClusterDetail {
  id: string;
  title: string;
  first_seen: string;
  last_seen: string;
  error_count: number;
  status: string;
  is_spiking: boolean;
  explanation: string;
  shared_functions: string[];
  browser_breakdown: Record<string, number>;
  representative_error: {
    id: string;
    message: string;
    exception_type: string;
    stack_trace?: string;
    browser?: string;
    url?: string;
  } | null;
  members: ClusterMember[];
}

export interface EmbeddingMapPoint {
  id: string;
  x: number;
  y: number;
  cluster_id: string | null;
  cluster_title: string;
  exception_type: string;
  message: string;
  browser: string;
  timestamp: string;
}

export interface BenchmarkResult {
  method: string;
  precision: number;
  recall: number;
  f1: number;
  ari: number;
  nmi: number;
  cluster_count: number;
  compression_ratio: number;
}

export interface EvaluationData {
  results: BenchmarkResult[];
  timing: {
    hash_time_sec: number;
    embed_time_sec: number;
    dbscan_time_sec: number;
    hdbscan_time_sec: number;
  };
  tricky_cases: {
    tricky_1_separated: boolean;
    tricky_2_hash_groups: number;
    tricky_2_dbscan_clusters: number;
  };
}

export interface LiveStreamEvent {
  type: string;
  error: {
    id: string;
    message: string;
    exception_type?: string;
    browser?: string;
    os?: string;
    url?: string;
    timestamp: string;
    stack_hash?: string;
    cluster_id?: string | null;
    cluster_title?: string;
  };
  cluster: {
    id?: string | null;
    title: string;
    error_count: number;
  };
  is_spike: boolean;
  timestamp: string;
}

export interface DemoStatus {
  is_running: boolean;
  speed: number;
  spike_active: boolean;
  spike_root_cause: string;
}
