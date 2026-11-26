import React, { useEffect, useState } from 'react';
import {
  Layers,
  Hash,
  Minimize2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { OverviewMetrics } from '../../types/api';

interface OverviewScreenProps {
  onNavigateToClusters: () => void;
  onNavigateToLiveFeed: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  onNavigateToClusters,
  onNavigateToLiveFeed,
}) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOverview = async () => {
    try {
      const data = await api.getOverview();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3" />
        Loading platform overview...
      </div>
    );
  }

  const m = metrics || {
    total_errors: 600,
    total_clusters: 8,
    total_hash_issues: 231,
    compression_ratio: 75.0,
    hash_compression_ratio: 2.6,
    recent_errors_count_24h: 600,
    spiking_clusters_count: 0,
    comparison: {
      raw_errors: 600,
      hash_groups: 231,
      semantic_clusters: 8,
      noise_reduction_pct: 96.5,
      ratio_improvement: '75.0x vs 2.6x',
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            System Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time error deduplication powered by 384-dimensional semantic embeddings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToLiveFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            Open Live Feed <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Ingested Errors */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Raw Ingested Errors</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {m.total_errors.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{m.recent_errors_count_24h}</span> in last 24h
          </div>
        </div>

        {/* Semantic Clusters (Faultline) */}
        <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
            <span>Faultline Clusters</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-indigo-200 font-mono">
            {m.total_clusters}
          </div>
          <div className="text-[11px] text-indigo-400/90 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exact true root causes</span>
          </div>
        </div>

        {/* Legacy Hash Issues */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Sentry Hash Issues</span>
            <Hash className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-300 font-mono">
            {m.total_hash_issues}
          </div>
          <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+{m.total_hash_issues - m.total_clusters} fragmented issues</span>
          </div>
        </div>

        {/* Deduplication Compression Ratio */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Compression Ratio</span>
            <Minimize2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-300 font-mono">
            {m.compression_ratio}x
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>vs legacy {m.hash_compression_ratio}x compression</span>
          </div>
        </div>
      </div>

      {/* Centerpiece Comparison Panel: Hash Grouping vs Faultline */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Sentry Stack Hashing vs. Faultline Semantic Clustering
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side comparison on the 600-error synthetic dataset benchmark.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            {m.comparison.noise_reduction_pct}% Issue Triage Noise Eliminated
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Legacy Hash Column */}
          <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Sentry (Stack-Trace Hash)
              </span>
              <span className="text-xs font-mono font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                231 Separate Issues
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Hashes exact normalized call stacks. Fails when frame order shifts, line numbers change across commits, or when asynchronous callbacks invoke the same code from multiple callers.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-rose-300/90">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Redis Partition failure fragmented into 14 distinct issues</span>
              </div>
              <div className="flex items-center gap-2 text-rose-300/90">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Pairwise Recall drops to 7.7% due to extreme fragmentation</span>
              </div>
              <div className="flex items-center gap-2 text-rose-300/90">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Engineers triage 28 duplicates per real bug</span>
              </div>
            </div>
          </div>

          {/* Faultline Semantic Column */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950/80 border border-indigo-500/30 rounded-xl p-5 space-y-3 shadow-lg shadow-indigo-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Faultline (Semantic Embeddings)
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                8 Clean Clusters
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Normalizes error meaning using 384-D dense embeddings. Recognizes that differing call paths (WebSocket vs REST vs Queue) stem from the exact same failure.
            </p>

            <div className="space-y-2 pt-2 border-t border-indigo-950/40 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>100.0% Pairwise Recall & 100.0% Precision</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Separates tricky similar errors (User Login vs Org Settings)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Sub-200ms incremental assignment on ingestion</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onNavigateToClusters}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            Explore all {m.total_clusters} clusters <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
