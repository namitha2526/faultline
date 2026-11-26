import rawGroundTruth from './ground_truth.json';
import {
  Cluster,
  ErrorEvent,
  OverviewMetrics,
  BenchmarkResult,
  TrickyCaseEvaluation,
  EvaluationData,
  EmbeddingPoint,
  ReleaseItem,
  StackFrame,
  StackVariant,
} from '../types';

// Helper to parse stack frames from raw string
function parseFrames(rawTrace: string): StackFrame[] {
  if (!rawTrace) return [];
  const lines = rawTrace.split('\n');
  return lines.map((line) => {
    const trimmed = line.trim();
    const isAt = trimmed.startsWith('at ');
    const content = isAt ? trimmed.slice(3) : trimmed;
    const parts = content.split(' (');
    let fn = parts[0] || 'anonymous';
    let fileInfo = parts[1] ? parts[1].replace(')', '') : '';
    if (!parts[1] && content.includes('@')) {
      const atParts = content.split('@');
      fn = atParts[0];
      fileInfo = atParts[1];
    }
    const isApp = !fileInfo.includes('node_modules') && !fileInfo.includes('axios');
    return {
      function: fn,
      file: fileInfo || 'unknown',
      is_app: isApp,
    };
  });
}

// Convert raw ground truth errors to typed ErrorEvent list
export const allErrors: ErrorEvent[] = (rawGroundTruth.errors || []).map((err: any, idx: number) => {
  const p = err.payload;
  const frames = parseFrames(p.stack_trace || '');
  return {
    id: `err_${err.index ?? idx}_${Math.random().toString(36).substring(2, 6)}`,
    cluster_id: err.root_cause_id,
    cluster_title: err.root_cause_title,
    message: p.message,
    exception_type: p.exception_type,
    timestamp: p.timestamp,
    browser: p.browser || 'Chrome 124.0.6367',
    os: p.os || 'macOS Sonoma (14.4)',
    url: p.url || 'https://app.faultline.io',
    user_id: p.user_id || `usr_${1000 + idx}`,
    release: p.release || 'v2.4.0',
    stack_trace: p.stack_trace || '',
    frames,
    stack_hash: `hash_${(err.root_cause_id + (idx % 29)).slice(0, 12)}`,
    similarity_to_centroid: 0.91 + (Math.sin(idx) * 0.08),
    is_tricky: err.is_tricky,
  };
});

// Cluster details metadata
const clusterExplanations: Record<string, { explanation: string; shared_functions: string[]; similarity: number }> = {
  'RC-1': {
    explanation: 'All 75 errors stem from an asynchronous session resolution returning a null user payload prior to Redux state dispatch. While differing in wrapper frames (telemetry vs rate-limiting), the semantic embedding tightly isolates auth callbacks.',
    shared_functions: ['validateSessionCredentials', 'handleAuthCallback', 'dispatchLoginAction', 'handleLoginClick'],
    similarity: 0.94,
  },
  'RC-2': {
    explanation: 'Upstream payment gateway timeout during checkout confirmation exceeding 15000ms deadline. Variations are caused by HTTP retry wrappers and currency audit interceptors.',
    shared_functions: ['StripeClient.confirmPaymentIntent', 'PaymentService.chargeCustomerCard', 'CheckoutController.processOrderPayment'],
    similarity: 0.96,
  },
  'RC-3': {
    explanation: 'Backend analytics schema drift: monthly revenue and session counts omitted from JSON response, crashing downstream dashboard summary cards and chart calculation routines.',
    shared_functions: ['calculateMetricDelta', 'MetricsCard.renderStats', 'DashboardGrid.renderWidgets'],
    similarity: 0.93,
  },
  'RC-4': {
    explanation: 'PostgreSQL connection pool exhaustion (20 connection limit). Concurrent background jobs and REST endpoints block on Knex client acquisition timeout (5000ms).',
    shared_functions: ['Pool.acquireConnection', 'BaseRepository.executeQuery', 'OrganizationRepository.getMembers'],
    similarity: 0.95,
  },
  'RC-5': {
    explanation: 'JWT bearer tokens rejected across multiple edge gateway routes due to expired token signatures or rotated JWKS validation keys.',
    shared_functions: ['JWTVerifier.verifyToken', 'AuthMiddleware.authenticateRequest', 'Route.dispatch'],
    similarity: 0.92,
  },
  'RC-6': {
    explanation: 'HTTP multipart upload parser rejects media attachments exceeding the 15MB ceiling. Failures originate from client dropzone uploads and direct REST attachments.',
    shared_functions: ['MulterStreamValidator.onFileStream', 'AttachmentUploadService.processFile', 'FileUploadController.uploadAttachment'],
    similarity: 0.94,
  },
  'RC-7': {
    explanation: 'Organization settings crash when rendering undefined workspace branding avatar. Although message text mimics RC-1 (\'reading avatar_url\'), module context correctly isolates it to tenant branding.',
    shared_functions: ['renderWorkspaceLogo', 'OrganizationSettingsView.renderProfile', 'SettingsLayout.renderContent'],
    similarity: 0.93,
  },
  'RC-8': {
    explanation: 'Shared Redis session cluster partition / desync. Disperses into 4 completely disjoint call stacks (WebSocket handler, HTTP Permission guard, Celery worker, GraphQL auth directive), yet all unified by semantic embedding.',
    shared_functions: ['RedisSessionStore.getSession', 'SocketManager.handleHeartbeatTimeout', 'SessionCacheLookup.fetchUserSession', 'RequireAuthDirective.resolveSession'],
    similarity: 0.91,
  },
};

// Stack variants for Tricky Case 2 (RC-8)
const rc8Variants: StackVariant[] = [
  {
    id: 'var_ws',
    title: 'WebSocket Connection Manager (Real-time)',
    pathway: 'src/realtime/socketManager.ts',
    occurrence_count: 22,
    diff_notes: 'WebSocket heartbeat loop detects abrupt socket closure while verifying session handshake token.',
    frames: [
      { function: 'SocketManager.onClose', file: 'src/realtime/socketManager.ts:84', is_app: true },
      { function: 'SocketManager.handleHeartbeatTimeout', file: 'src/realtime/heartbeat.ts:42', is_app: true },
      { function: 'WebSocketClient.dispatch', file: 'src/client/wsClient.ts:119', is_app: true },
      { function: 'HTMLDocument.onVisibilityChange', file: 'src/listeners/visibility.ts:27', is_app: true },
    ],
    stack_trace: `    at SocketManager.onClose (src/realtime/socketManager.ts:84:12)
    at SocketManager.handleHeartbeatTimeout (src/realtime/heartbeat.ts:42:19)
    at WebSocketClient.dispatch (src/client/wsClient.ts:119:33)
    at HTMLDocument.onVisibilityChange (src/listeners/visibility.ts:27:5)`
  },
  {
    id: 'var_http',
    title: 'HTTP REST Permission Guard (Gateway)',
    pathway: 'src/guards/permissionGuard.ts',
    occurrence_count: 28,
    diff_notes: 'REST Express middleware fails session role lookup because Redis pool dropped TCP connection.',
    frames: [
      { function: 'RedisSessionStore.getSession', file: 'src/session/redisStore.ts:98', is_app: true },
      { function: 'PermissionGuard.validateRole', file: 'src/guards/permissionGuard.ts:45', is_app: true },
      { function: 'ExpressApp.handleRequest', file: 'src/server/app.ts:210', is_app: true },
      { function: 'Server.emit', file: 'node_modules/http/server.js:314', is_app: false },
    ],
    stack_trace: `    at RedisSessionStore.getSession (src/session/redisStore.ts:98:24)
    at PermissionGuard.validateRole (src/guards/permissionGuard.ts:45:18)
    at ExpressApp.handleRequest (src/server/app.ts:210:31)
    at Server.emit (node_modules/http/server.js:314:12)`
  },
  {
    id: 'var_worker',
    title: 'Background Celery / Job Worker',
    pathway: 'src/workers/tasks/sessionCache.ts',
    occurrence_count: 14,
    diff_notes: 'Background synchronization job throws CommandTimedOut when fetching user cache for email digest.',
    frames: [
      { function: 'SessionCacheLookup.fetchUserSession', file: 'src/workers/tasks/sessionCache.ts:62', is_app: true },
      { function: 'SyncUserProfileTask.execute', file: 'src/workers/jobs/syncProfile.ts:88', is_app: true },
      { function: 'WorkerQueue.processNextJob', file: 'src/queue/workerRunner.ts:140', is_app: true },
      { function: 'main', file: 'src/workers/bootstrap.ts:15', is_app: true },
    ],
    stack_trace: `    at SessionCacheLookup.fetchUserSession (src/workers/tasks/sessionCache.ts:62:35)
    at SyncUserProfileTask.execute (src/workers/jobs/syncProfile.ts:88:14)
    at WorkerQueue.processNextJob (src/queue/workerRunner.ts:140:22)
    at main (src/workers/bootstrap.ts:15:5)`
  },
  {
    id: 'var_graphql',
    title: 'GraphQL Schema Directive (@requireAuth)',
    pathway: 'src/graphql/directives/requireAuth.ts',
    occurrence_count: 11,
    diff_notes: 'GraphQL resolver pipeline halts on field resolution due to unhandled Redis connection error.',
    frames: [
      { function: 'RequireAuthDirective.resolveSession', file: 'src/graphql/directives/requireAuth.ts:51', is_app: true },
      { function: 'executeFieldResolvers', file: 'src/graphql/execution/fieldResolver.ts:109', is_app: true },
      { function: 'ApolloServer.executeOperation', file: 'src/graphql/server.ts:245', is_app: true },
      { function: 'handleGraphQLRequest', file: 'src/api/graphqlHandler.ts:76', is_app: true },
    ],
    stack_trace: `    at RequireAuthDirective.resolveSession (src/graphql/directives/requireAuth.ts:51:27)
    at executeFieldResolvers (src/graphql/execution/fieldResolver.ts:109:44)
    at ApolloServer.executeOperation (src/graphql/server.ts:245:18)
    at handleGraphQLRequest (src/api/graphqlHandler.ts:76:12)`
  }
];

// Build 8 rich clusters
export const initialClusters: Cluster[] = Object.keys(rawGroundTruth.root_causes).map((rcId) => {
  const rc = (rawGroundTruth.root_causes as any)[rcId];
  const members = allErrors.filter((e) => e.cluster_id === rcId);
  const repError = members[0] || allErrors[0];

  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  members.forEach((m) => {
    const b = m.browser.split(' ')[0] || 'Chrome';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
    const o = m.os.split(' ')[0] || 'macOS';
    osCounts[o] = (osCounts[o] || 0) + 1;
  });

  const isSpike = rcId === 'RC-2' || rcId === 'RC-8';
  const meta = clusterExplanations[rcId] || {
    explanation: rc.description,
    shared_functions: ['processRequest', 'handleError'],
    similarity: 0.93,
  };

  // Sparkline data (24-hour hourly trend)
  const sparkline = isSpike
    ? [2, 1, 3, 2, 4, 3, 5, 4, 8, 12, 18, 25, 34, 42, 58, 65, 71, 75]
    : [6, 7, 5, 8, 6, 7, 6, 8, 7, 5, 6, 7, 8, 6, 7, 8, 7, 6];

  const variants = rcId === 'RC-8' ? rc8Variants : [
    {
      id: `${rcId}_var1`,
      title: 'Primary Handler Variant (Direct Call)',
      pathway: rc.base_frames?.[0]?.[1] || 'src/handler.ts',
      occurrence_count: Math.round(members.length * 0.65),
      diff_notes: 'Standard error pathway originating directly from the primary service function.',
      frames: (rc.base_frames || []).map((f: string[]) => ({ function: f[0], file: f[1], is_app: true })),
      stack_trace: (rc.base_frames || []).map((f: string[]) => `    ${f[0]} (${f[1]}:42:15)`).join('\n')
    },
    {
      id: `${rcId}_var2`,
      title: 'Wrapped Telemetry / Interceptor Variant',
      pathway: rc.extra_frames?.[0]?.[1] || 'src/middleware.ts',
      occurrence_count: Math.round(members.length * 0.35),
      diff_notes: 'Additional telemetry logger and error boundary frames wrapping the call chain.',
      frames: [
        ...((rc.extra_frames || []).map((f: string[]) => ({ function: f[0], file: f[1], is_app: true }))),
        ...((rc.base_frames || []).map((f: string[]) => ({ function: f[0], file: f[1], is_app: true }))),
      ],
      stack_trace: [
        ...((rc.extra_frames || []).map((f: string[]) => `    ${f[0]} (${f[1]}:18:22)`)),
        ...((rc.base_frames || []).map((f: string[]) => `    ${f[0]} (${f[1]}:42:15)`)),
      ].join('\n')
    }
  ];

  const similarList = Object.keys(rawGroundTruth.root_causes)
    .filter((id) => id !== rcId)
    .slice(0, 3)
    .map((otherId, idx) => ({
      id: otherId,
      title: (rawGroundTruth.root_causes as any)[otherId].title,
      similarity: Number((0.65 - idx * 0.12).toFixed(2)),
      error_count: 75,
      status: 'ongoing' as const,
    }));

  return {
    id: rcId,
    name: rc.name,
    title: rc.title,
    description: rc.description,
    exception_type: rc.exception_type,
    error_count: members.length,
    status: isSpike ? 'ongoing' : (rcId === 'RC-3' ? 'resolved' : 'new'),
    is_spiking: isSpike,
    spike_velocity: isSpike ? 14.8 : undefined,
    first_seen: '2026-10-09T14:36:23Z',
    last_seen: '2026-10-24T09:12:44Z',
    similarity_score: meta.similarity,
    shared_functions: meta.shared_functions,
    explanation: meta.explanation,
    browsers: browserCounts,
    os_breakdown: osCounts,
    sparkline,
    representative_error: repError,
    members,
    stack_variants: variants,
    similar_clusters: similarList,
  };
});

// Overview metrics calculation
export const initialOverviewMetrics: OverviewMetrics = {
  total_errors: 600,
  total_clusters: 8,
  total_hash_issues: 231,
  compression_ratio: 75.0,
  hash_compression_ratio: 2.6,
  errors_24h: 184,
  errors_24h_delta_pct: 14.2,
  clusters_delta_pct: -6.4,
  compression_delta: 5.2,
  spiking_clusters_count: 2,
  reduction_pct: 96.5,
  comparison: {
    raw_errors: 600,
    hash_groups: 231,
    semantic_clusters: 8,
    noise_reduction_pct: 96.5,
    ratio_improvement: '28.8x fewer alerts',
  },
  timeseries: [
    { time: '00:00', total: 24, 'RC-2': 4, 'RC-8': 6, 'RC-1': 5, 'RC-4': 4, 'RC-5': 5 },
    { time: '03:00', total: 18, 'RC-2': 3, 'RC-8': 4, 'RC-1': 4, 'RC-4': 3, 'RC-5': 4 },
    { time: '06:00', total: 28, 'RC-2': 5, 'RC-8': 7, 'RC-1': 6, 'RC-4': 5, 'RC-5': 5 },
    { time: '09:00', total: 45, 'RC-2': 8, 'RC-8': 12, 'RC-1': 9, 'RC-4': 8, 'RC-5': 8 },
    { time: '12:00', total: 72, 'RC-2': 18, 'RC-8': 22, 'RC-1': 14, 'RC-4': 9, 'RC-5': 9 },
    { time: '15:00', total: 98, 'RC-2': 38, 'RC-8': 26, 'RC-1': 16, 'RC-4': 10, 'RC-5': 8 },
    { time: '18:00', total: 124, 'RC-2': 54, 'RC-8': 31, 'RC-1': 18, 'RC-4': 11, 'RC-5': 10 },
    { time: '21:00', total: 142, 'RC-2': 68, 'RC-8': 35, 'RC-1': 17, 'RC-4': 12, 'RC-5': 10 },
    { time: 'Now', total: 184, 'RC-2': 75, 'RC-8': 42, 'RC-1': 19, 'RC-4': 13, 'RC-5': 11 },
  ],
};

// 2D UMAP projection centroids for each cluster
const clusterCentroids: Record<string, [number, number]> = {
  'RC-1': [-4.8, 5.2],
  'RC-2': [6.5, 3.8],
  'RC-3': [2.2, -6.1],
  'RC-4': [-7.1, -2.4],
  'RC-5': [5.8, -4.5],
  'RC-6': [-1.5, 7.6],
  'RC-7': [-6.2, 4.4], // Note: RC-7 is separated from RC-1 by semantic normalization!
  'RC-8': [1.8, 6.4],
};

// Generate 2D embedding points with gaussian jitter around centroids
export const initialEmbeddingPoints: EmbeddingPoint[] = allErrors.map((err, i) => {
  const [cx, cy] = clusterCentroids[err.cluster_id] || [0, 0];
  const u1 = Math.random();
  const u2 = Math.random();
  const radius = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * 0.45;
  const angle = 2 * Math.PI * u2;
  const x = Number((cx + radius * Math.cos(angle)).toFixed(3));
  const y = Number((cy + radius * Math.sin(angle)).toFixed(3));

  return {
    id: `map_${err.id}`,
    x,
    y,
    cluster_id: err.cluster_id,
    cluster_title: err.cluster_title || 'Unknown Cluster',
    exception_type: err.exception_type,
    message: err.message,
    browser: err.browser,
    os: err.os,
    timestamp: err.timestamp,
    is_tricky: err.is_tricky,
  };
});

// Benchmark Evaluation Data
export const initialEvaluationData: EvaluationData = {
  results: [
    {
      method: 'Hash Baseline (Sentry MD5)',
      precision: 100.0,
      recall: 7.71,
      f1: 14.31,
      ari: 0.128,
      nmi: 0.435,
      cluster_count: 231,
      compression_ratio: 2.6,
      is_best: false,
    },
    {
      method: 'Faultline (Embedding + DBSCAN eps=0.22)',
      precision: 100.0,
      recall: 100.0,
      f1: 100.0,
      ari: 1.0,
      nmi: 1.0,
      cluster_count: 8,
      compression_ratio: 75.0,
      is_best: true,
    },
    {
      method: 'Embedding + HDBSCAN (min_cluster=5)',
      precision: 100.0,
      recall: 5.96,
      f1: 11.26,
      ari: 0.096,
      nmi: 0.381,
      cluster_count: 113,
      compression_ratio: 5.3,
      is_best: false,
    },
  ],
  timing: {
    hash_time_sec: 0.03,
    embed_time_sec: 2.15,
    dbscan_time_sec: 0.08,
    hdbscan_time_sec: 0.34,
  },
  tricky_cases: [
    {
      id: 'tricky_1',
      name: 'Tricky Case 1: Superficial Message Similarity',
      title: 'User Login (RC-1) vs Organization Settings (RC-7)',
      description: 'Both bugs report identical error messages: "Cannot read properties of undefined (reading \'avatar_url\')", yet stem from distinct modules and engineering teams.',
      hash_result: 'Lumped together if stripping stack traces, or fragmented into 28 different hash groups when line numbers varied.',
      faultline_result: 'Perfectly separated into 2 isolated clusters (RC-1 auth vs RC-7 org settings) with 0 false positives, because normalized module embeddings recognize semantic context.',
      verdict: 'success',
      details: 'Evaluated across 150 instances (75 in RC-1, 75 in RC-7). Zero cross-contamination occurred.',
      error_samples: [
        {
          message: "Cannot read properties of undefined (reading 'avatar_url')",
          context: 'RC-1 User Login Flow (src/auth/sessionManager.ts)',
          stack_snippet: 'at validateSessionCredentials (src/auth/sessionManager.ts:32)\nat handleAuthCallback (src/controllers/authController.ts:88)',
        },
        {
          message: "Cannot read properties of undefined (reading 'avatar_url')",
          context: 'RC-7 Org Branding View (src/settings/organizationBranding.tsx)',
          stack_snippet: 'at renderWorkspaceLogo (src/settings/organizationBranding.tsx:64)\nat OrganizationSettingsView.renderProfile (src/views/settings:112)',
        },
      ],
    },
    {
      id: 'tricky_2',
      name: 'Tricky Case 2: Dispersed Multi-Tier Manifestation',
      title: 'Distributed Redis Session Store Network Partition (RC-8)',
      description: 'One single infrastructure incident (Redis node disconnect) triggered errors across 4 disparate system tiers: WebSocket daemon, HTTP Permission Guard, Celery worker, and GraphQL directive.',
      hash_result: 'Shattered into 14 separate issues in Sentry. Four on-call engineers were paged concurrently for what was 1 single root cause.',
      faultline_result: 'Unified 100% of the 75 errors across all 4 stack pathways into 1 single cluster (RC-8) with 0.91 semantic similarity.',
      verdict: 'success',
      details: 'Noise reduced by 92.8% on this incident alone. Alert fatigue prevented.',
      error_samples: [
        {
          message: 'RedisConnectionError: Connection lost to session redis cluster at redis-02:6379',
          context: 'Pathway A: Real-time WebSocket daemon',
          stack_snippet: 'at SocketManager.onClose (src/realtime/socketManager.ts:84)\nat SocketManager.handleHeartbeatTimeout (src/realtime/heartbeat.ts:42)',
        },
        {
          message: 'CommandTimedOut: Redis GET session:{session_id} timed out after 3000ms',
          context: 'Pathway B: HTTP REST Permission Guard',
          stack_snippet: 'at RedisSessionStore.getSession (src/session/redisStore.ts:98)\nat PermissionGuard.validateRole (src/guards/permissionGuard.ts:45)',
        },
      ],
    },
  ],
};

// Releases Data
export const initialReleases: ReleaseItem[] = [
  {
    id: 'rel_250_canary',
    version: 'v2.5.0-canary',
    commit: 'b94f18d',
    deployed_at: '2026-10-24T07:15:00Z',
    author: 'deploy-bot',
    environment: 'production',
    new_clusters_count: 1,
    spiking_cluster_id: 'RC-2',
    status: 'spiking',
    description: 'Updated Stripe SDK to v15.2 and upgraded HTTP client timeout settings.',
  },
  {
    id: 'rel_241',
    version: 'v2.4.1',
    commit: '7a29e41',
    deployed_at: '2026-10-23T16:40:00Z',
    author: 'sarah.chen@company.com',
    environment: 'production',
    new_clusters_count: 0,
    status: 'healthy',
    description: 'Hotfix for organization avatar branding fallback.',
  },
  {
    id: 'rel_240',
    version: 'v2.4.0',
    commit: 'c5180f2',
    deployed_at: '2026-10-21T11:20:00Z',
    author: 'alex.rivera@company.com',
    environment: 'production',
    new_clusters_count: 2,
    status: 'healthy',
    description: 'Major quarterly release: new workspace analytics dashboard and file upload overhaul.',
  },
  {
    id: 'rel_239',
    version: 'v2.3.9',
    commit: '48f93a1',
    deployed_at: '2026-10-18T09:00:00Z',
    author: 'marcus.vance@company.com',
    environment: 'production',
    new_clusters_count: 0,
    status: 'healthy',
    description: 'Database connection pool optimization and connection timeout tuning.',
  },
];
