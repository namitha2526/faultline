import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  Clock,
  User,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Cpu,
  Globe,
  Monitor,
  ExternalLink,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { useClusterDetail, useUpdateClusterStatus } from '../hooks/useClusters';
import { StackTraceViewer } from '../components/common/StackTraceViewer';
import { TraceDiff } from '../components/common/TraceDiff';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { ClusterStatus } from '../types';

interface ClusterDetailPageProps {
  clusterId: string;
  onBack: () => void;
  onSelectCluster: (id: string) => void;
}

export const ClusterDetailPage: React.FC<ClusterDetailPageProps> = ({
  clusterId,
  onBack,
  onSelectCluster,
}) => {
  const { data: cluster, isLoading } = useClusterDetail(clusterId);
  const updateStatusMutation = useUpdateClusterStatus();

  const [activeTab, setActiveTab] = useState<'members' | 'variants' | 'browsers' | 'timeline'>('variants');
  const [copiedId, setCopiedId] = useState(false);
  const [assignee, setAssignee] = useState('sarah.chen');

  if (isLoading || !cluster) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto p-4">
        <Skeleton height={40} width={200} />
        <Skeleton height={120} />
        <Skeleton height={300} />
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(cluster.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStatusChange = (newStatus: ClusterStatus) => {
    updateStatusMutation.mutate({ id: cluster.id, status: newStatus });
  };

  const assignees = [
    { id: 'sarah.chen', name: 'Sarah Chen (Platform Eng)', avatar: 'SC' },
    { id: 'alex.rivera', name: 'Alex Rivera (Backend Infra)', avatar: 'AR' },
    { id: 'marcus.vance', name: 'Marcus Vance (On-Call)', avatar: 'MV' },
    { id: 'unassigned', name: 'Unassigned', avatar: '—' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-dark-card border border-dark-border hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Back to Clusters"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              {cluster.id}
            </span>
            <button
              onClick={handleCopyId}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
              {cluster.exception_type}
            </span>
            {cluster.is_spiking && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                Spike Alert
              </span>
            )}
          </div>
        </div>

        {/* Status Dropdown & Assignee */}
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs font-mono">Status:</span>
            <select
              value={cluster.status}
              onChange={(e) => handleStatusChange(e.target.value as ClusterStatus)}
              aria-label="Cluster Status"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="new">New</option>
              <option value="ongoing">Ongoing</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          {/* Assignee Selector */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              aria-label="Assignee"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Title & Core Counts */}
      <div className="p-6 rounded-2xl bg-dark-card border border-dark-border shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {cluster.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
              {cluster.description}
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-[#0B0E14] border border-dark-border text-right min-w-[120px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Occurrences</div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                {cluster.error_count.toLocaleString()}
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#0B0E14] border border-dark-border text-right min-w-[120px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Cosine Match</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {(cluster.similarity_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "WHY THESE ARE ONE BUG" Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-violet-950/30 via-brand-950/20 to-teal-950/20 border border-brand-500/30 space-y-3 shadow-glow-violet/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Why These Are One Bug</h2>
              <div className="text-[11px] text-slate-400">
                AI semantic explanation & invariant function pathways
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Similarity Score: {cluster.similarity_score}</span>
          </div>
        </div>

        {/* Plain Language Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed bg-[#0B0E14]/70 p-3 rounded-lg border border-dark-border">
          {cluster.explanation}
        </p>

        {/* Shared Function Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-mono text-slate-400">Shared Call-Stack Anchors:</span>
          {cluster.shared_functions.map((fn) => (
            <span
              key={fn}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-violet-500/15 text-violet-300 border border-violet-500/30"
            >
              {fn}
            </span>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Representative Stack Trace + Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Representative Stack Trace Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Representative Stack Trace</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  (Centroid exemplar)
                </span>
              </h3>
            </div>

            <StackTraceViewer
              stackTrace={cluster.representative_error?.stack_trace || ''}
              frames={cluster.representative_error?.frames}
            />
          </div>

          {/* Deep Exploration Tabs */}
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 border-b border-dark-border pb-2 text-xs font-medium">
              <button
                onClick={() => setActiveTab('variants')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'variants'
                    ? 'bg-brand-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Stack Trace Variants ({cluster.stack_variants.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'members'
                    ? 'bg-brand-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cluster Members ({cluster.members.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('browsers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'browsers'
                    ? 'bg-brand-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browsers & OS Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-brand-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {/* Tab 1: Stack Trace Variants Diff */}
            {activeTab === 'variants' && (
              <TraceDiff
                variants={cluster.stack_variants}
                clusterTitle={cluster.title}
              />
            )}

            {/* Tab 2: Members List */}
            {activeTab === 'members' && (
              <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                <div className="p-3 bg-[#0E121A] border-b border-dark-border text-xs text-slate-400 font-mono flex items-center justify-between">
                  <span>Recent Occurrences in this Cluster</span>
                  <span>Showing {cluster.members.slice(0, 15).length} of {cluster.members.length}</span>
                </div>
                <div className="divide-y divide-dark-border/40 text-xs font-mono">
                  {cluster.members.slice(0, 15).map((member) => (
                    <div
                      key={member.id}
                      className="p-3 hover:bg-dark-cardHover transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-sans font-medium">
                          {member.message}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {(member.similarity_to_centroid * 100).toFixed(0)}% to centroid
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span>User: {member.user_id}</span>
                        <span>•</span>
                        <span>{member.browser}</span>
                        <span>•</span>
                        <span>{member.os}</span>
                        <span>•</span>
                        <span>Release: {member.release}</span>
                        <span>•</span>
                        <span className="text-slate-500">Hash: {member.stack_hash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Browsers & OS Breakdown */}
            {activeTab === 'browsers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-400" />
                    Browser Distribution
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(cluster.browsers).map(([name, count]) => {
                      const pct = ((count / cluster.error_count) * 100).toFixed(0);
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span>{name}</span>
                            <span className="text-white font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-teal-400" />
                    Operating System Distribution
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(cluster.os_breakdown).map(([name, count]) => {
                      const pct = ((count / cluster.error_count) * 100).toFixed(0);
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span>{name}</span>
                            <span className="text-white font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Timeline */}
            {activeTab === 'timeline' && (
              <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase">
                  Hourly Occurrence Volume (Last 24 Hours)
                </h4>
                <div className="flex items-end gap-1.5 h-36 pt-4">
                  {cluster.sparkline.map((val, idx) => {
                    const maxVal = Math.max(...cluster.sparkline, 1);
                    const heightPct = Math.max(10, Math.round((val / maxVal) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                        <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {val}
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            cluster.is_spiking ? 'bg-rose-500/80 hover:bg-rose-400' : 'bg-brand-500/80 hover:bg-brand-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="text-[9px] font-mono text-slate-600">
                          {idx * 2}h
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Similar Clusters & Metadata Sidebar */}
        <div className="space-y-5">
          {/* Similar Clusters Sidebar Card */}
          <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                Similar Clusters (Nearest Neighbors)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Clusters nearby in 384-dimensional semantic embedding space:
            </p>

            <div className="space-y-2">
              {cluster.similar_clusters.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onSelectCluster(sim.id)}
                  className="p-2.5 rounded-lg bg-[#0F131E] border border-dark-border hover:border-brand-500/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-brand-400 font-semibold">
                      {sim.id}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold">
                      {(sim.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 group-hover:text-white line-clamp-1">
                    {sim.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model & Centroid Metadata */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-dark-border space-y-2.5 text-xs font-mono">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Vector Engine Metadata
            </h4>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Embedding Model:</span>
                <span className="text-slate-200">all-MiniLM-L6-v2</span>
              </div>
              <div className="flex justify-between">
                <span>Vector Dimension:</span>
                <span className="text-slate-200">384-D Dense</span>
              </div>
              <div className="flex justify-between">
                <span>Centroid Cache:</span>
                <span className="text-emerald-400">Warm (14ms hit)</span>
              </div>
              <div className="flex justify-between">
                <span>Clustering Algorithm:</span>
                <span className="text-slate-200">DBSCAN (eps=0.22)</span>
              </div>
              <div className="flex justify-between">
                <span>Project Scope:</span>
                <span className="text-slate-200">production-api</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
