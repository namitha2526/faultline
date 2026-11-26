export type ClusterStatus = 'new' | 'ongoing' | 'resolved' | 'ignored';

export interface StackFrame {
  function: string;
  file: string;
  line?: number;
  col?: number;
  is_app?: boolean;
}

export interface ErrorEvent {
  id: string;
  cluster_id: string;
  cluster_title?: string;
  message: string;
  exception_type: string;
  timestamp: string;
  browser: string;
  os: string;
  url: string;
  user_id: string;
  release: string;
  stack_trace: string;
  frames?: StackFrame[];
  stack_hash: string;
  similarity_to_centroid: number;
  is_tricky?: boolean;
  pathway_name?: string;
}

export interface StackVariant {
  id: string;
  title: string;
  pathway: string;
  occurrence_count: number;
  stack_trace: string;
  frames: StackFrame[];
  diff_notes: string;
}

export interface SimilarCluster {
  id: string;
  title: string;
  similarity: number;
  error_count: number;
  status: ClusterStatus;
}

export interface Cluster {
  id: string;
  name: string;
  title: string;
  description: string;
  exception_type: string;
  error_count: number;
  status: ClusterStatus;
  is_spiking: boolean;
  spike_velocity?: number;
  first_seen: string;
  last_seen: string;
  similarity_score: number;
  shared_functions: string[];
  explanation: string;
  browsers: Record<string, number>;
  os_breakdown: Record<string, number>;
  sparkline: number[];
  representative_error: ErrorEvent;
  members: ErrorEvent[];
  stack_variants: StackVariant[];
  similar_clusters: SimilarCluster[];
}

export interface OverviewMetrics {
  total_errors: number;
  total_clusters: number;
  total_hash_issues: number;
  compression_ratio: number;
  hash_compression_ratio: number;
  errors_24h: number;
  errors_24h_delta_pct: number;
  clusters_delta_pct: number;
  compression_delta: number;
  spiking_clusters_count: number;
  reduction_pct: number;
  comparison: {
    raw_errors: number;
    hash_groups: number;
    semantic_clusters: number;
    noise_reduction_pct: number;
    ratio_improvement: string;
  };
  timeseries: Array<{
    time: string;
    total: number;
    [key: string]: number | string;
  }>;
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
  is_best?: boolean;
}

export interface TrickyCaseEvaluation {
  id: string;
  name: string;
  title: string;
  description: string;
  hash_result: string;
  faultline_result: string;
  verdict: 'success' | 'failure';
  details: string;
  error_samples: {
    message: string;
    context: string;
    stack_snippet: string;
  }[];
}

export interface EvaluationData {
  results: BenchmarkResult[];
  tricky_cases: TrickyCaseEvaluation[];
  timing: {
    hash_time_sec: number;
    embed_time_sec: number;
    dbscan_time_sec: number;
    hdbscan_time_sec: number;
  };
}

export interface EmbeddingPoint {
  id: string;
  x: number;
  y: number;
  cluster_id: string;
  cluster_title: string;
  exception_type: string;
  message: string;
  browser: string;
  os: string;
  timestamp: string;
  is_tricky?: boolean;
}

export interface ReleaseItem {
  id: string;
  version: string;
  commit: string;
  deployed_at: string;
  author: string;
  environment: string;
  new_clusters_count: number;
  spiking_cluster_id?: string;
  status: 'healthy' | 'spiking' | 'reverted';
  description: string;
}

export interface LiveStreamEvent {
  id: string;
  type: 'incoming_error' | 'new_cluster' | 'spike_alert';
  error: ErrorEvent;
  target_cluster_id: string;
  target_cluster_title: string;
  target_cluster_count: number;
  is_spike: boolean;
  timestamp: string;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';
export type ScreenId = 'overview' | 'clusters' | 'cluster-detail' | 'feed' | 'map' | 'evaluation' | 'releases' | 'settings';
