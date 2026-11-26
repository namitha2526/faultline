import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Zap,
  Clock,
  Flame,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useOverview } from '../hooks/useOverview';
import { useClusters } from '../hooks/useClusters';
import { KpiCard } from '../components/common/KpiCard';
import { Sparkline } from '../components/common/Sparkline';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { ScreenId, TimeRange } from '../types';

interface OverviewPageProps {
  onNavigate: (screen: ScreenId, clusterId?: string) => void;
  onTriggerSpike: () => void;
  isSpikeActive: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onTriggerSpike,
  isSpikeActive,
}) => {
  const { data: metrics, isLoading: loadingMetrics } = useOverview();
  const { data: clusters = [], isLoading: loadingClusters } = useClusters();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const spikingClusters = clusters.filter((c) => c.is_spiking);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Error Intelligence Overview</span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              Active Project: production-api
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Errors semantically clustered via sentence embeddings (all-MiniLM-L6-v2) & DBSCAN.
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 bg-dark-card border border-dark-border p-1 rounded-lg text-xs self-start">
          {(['1h', '24h', '7d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded font-mono text-xs transition-colors ${
                timeRange === r
                  ? 'bg-brand-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Ingested Errors"
          value={loadingMetrics ? '...' : (metrics?.total_errors || 600).toLocaleString()}
          delta={{ value: metrics?.errors_24h_delta_pct || 14.2, isInverse: true }}
          icon={<Activity className="w-4 h-4 text-brand-400" />}
          subtitle="Processed through pgvector embeddings"
        />

        <KpiCard
          title="Root Causes (Clusters)"
          value={loadingMetrics ? '...' : metrics?.total_clusters || 8}
          delta={{ value: metrics?.clusters_delta_pct || -6.4, isInverse: false }}
          badge="Semantic DBSCAN"
          icon={<Layers className="w-4 h-4 text-teal-400" />}
          subtitle="Unified from hundreds of stack traces"
        />

        <KpiCard
          title="Compression Ratio"
          value={loadingMetrics ? '...' : `${metrics?.compression_ratio || 75.0}x`}
          delta={{ value: metrics?.compression_delta || 5.2, isInverse: false }}
          badge="High Signal"
          icon={<Zap className="w-4 h-4 text-emerald-400" />}
          subtitle="75 raw errors per actionable cluster"
        />

        <KpiCard
          title="Errors in Last 24h"
          value={loadingMetrics ? '...' : metrics?.errors_24h || 184}
          delta={{ value: metrics?.errors_24h_delta_pct || 14.2, isInverse: true }}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          subtitle={`${spikingClusters.length} clusters currently spiking`}
        />
      </div>

      {/* SIGNATURE HERO PANEL: Hash Grouping vs Faultline */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121624] via-[#0E121A] to-[#161224] border border-violet-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Numbers & Comparison */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-xs text-violet-300 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Signature Reduction Metric</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hash Grouping vs Faultline Semantic Clustering
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard error trackers calculate brittle MD5 hashes over stack frames, creating 
              hundreds of duplicates when line numbers or wrappers change. Faultline embeds stack context, 
              compressing noise down to genuine root causes.
            </p>

            {/* Comparison Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono uppercase">Legacy Hash Issues</div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-0.5">
                  {metrics?.comparison.hash_groups || 231}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Brittle stack-trace fragmentation</div>
              </div>

              <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-500/40 shadow-glow-violet">
                <div className="text-[11px] text-brand-300 font-mono uppercase">Faultline Root Causes</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  {metrics?.comparison.semantic_clusters || 8}
                </div>
                <div className="text-[10px] text-brand-300/80 mt-1">AI-clustered root causes</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400 font-mono uppercase">Noise Reduction</div>
                <div className="text-2xl font-bold font-mono text-violet-300 mt-0.5">
                  {metrics?.comparison.noise_reduction_pct || 96.5}%
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">28.8x fewer on-call pages</div>
              </div>
            </div>
          </div>

          {/* Right: Animated Reduction Bar Visualizer */}
          <div className="w-full lg:w-72 p-5 rounded-xl bg-[#090C12]/90 border border-dark-border space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Alert Volume Compression</span>
              <span className="text-emerald-400 font-bold">96.5% reduction</span>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Legacy (Sentry)</span>
                  <span className="text-rose-400">231 issues</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-rose-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Faultline</span>
                  <span className="text-emerald-400">8 clusters</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: '3.5%' }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('evaluation')}
              className="w-full py-2 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>View Benchmark Methodology</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split: Area Chart + Needs Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stacked Area Chart over Time */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Error Volume by Top Root Causes</span>
              </h3>
              <p className="text-xs text-slate-400">Stacked hourly volume grouped by top 5 clusters</p>
            </div>

            {/* Legend pills */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                RC-2 Payment
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                RC-8 Redis
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                RC-1 Auth
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics?.timeseries || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRc2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRc8" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRc1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E222B" />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E222B' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E222B' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E121A',
                    borderColor: '#1E222B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Area
                  type="monotone"
                  dataKey="RC-2"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="url(#colorRc2)"
                  name="RC-2: Payment Timeout"
                />
                <Area
                  type="monotone"
                  dataKey="RC-8"
                  stackId="1"
                  stroke="#EC4899"
                  fill="url(#colorRc8)"
                  name="RC-8: Redis Partition"
                />
                <Area
                  type="monotone"
                  dataKey="RC-1"
                  stackId="1"
                  stroke="#06B6D4"
                  fill="url(#colorRc1)"
                  name="RC-1: Login Null User"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: "Needs Attention" Spiking Clusters List */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Needs Attention</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {spikingClusters.length} Active Spikes
            </span>
          </div>

          <div className="space-y-3">
            {loadingClusters ? (
              <div className="space-y-2">
                <Skeleton height={60} />
                <Skeleton height={60} />
              </div>
            ) : spikingClusters.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-dark-border rounded-lg">
                No active error velocity spikes detected. All clusters operating within baseline.
              </div>
            ) : (
              spikingClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  onClick={() => onNavigate('cluster-detail', cluster.id)}
                  className="p-3 rounded-lg bg-[#0F131E] border border-rose-500/30 hover:border-rose-500/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">
                        {cluster.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                        {cluster.title}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-rose-400 font-bold">
                      {cluster.error_count} errors (+{cluster.spike_velocity || 18.5}/s)
                    </span>
                    <Sparkline
                      data={cluster.sparkline}
                      width={64}
                      height={18}
                      isSpike={true}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick links to live stream */}
          <div className="pt-2 border-t border-dark-border/60">
            <button
              onClick={() => onNavigate('feed')}
              className="w-full py-2 px-3 rounded-lg bg-[#0F1420] hover:bg-[#161C2C] border border-dark-border text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-brand-400" />
              <span>Watch Live Snapping Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
