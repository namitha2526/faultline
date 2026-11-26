import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Globe,
  Chrome,
} from 'lucide-react';
import { useClusters, useBulkResolve } from '../hooks/useClusters';
import { Sparkline } from '../components/common/Sparkline';
import { StatusBadge } from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Cluster, ClusterStatus, ScreenId } from '../types';

interface ClustersPageProps {
  onSelectCluster: (id: string) => void;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({ onSelectCluster }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [browserFilter, setBrowserFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'count' | 'last_seen' | 'similarity'>('count');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: clusters = [], isLoading } = useClusters({
    status: statusFilter,
    browser: browserFilter,
    sort: sortBy,
    search: searchQuery,
  });

  const bulkResolveMutation = useBulkResolve();

  // Helper for browser icon
  const renderBrowserBadges = (browsers: Record<string, number>) => {
    const entries = Object.entries(browsers).slice(0, 3);
    return (
      <div className="flex items-center gap-1.5">
        {entries.map(([name, count]) => {
          const isChrome = name.toLowerCase().includes('chrome');
          const isSafari = name.toLowerCase().includes('safari');
          const isFirefox = name.toLowerCase().includes('firefox');

          return (
            <span
              key={name}
              title={`${name}: ${count} errors`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 border border-dark-border text-slate-300"
            >
              <Globe className="w-2.5 h-2.5 text-slate-400" />
              <span>{name.slice(0, 6)}</span>
              <span className="text-slate-500">({count})</span>
            </span>
          );
        })}
      </div>
    );
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === clusters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clusters.map((c) => c.id));
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIds.length === 0) return;
    await bulkResolveMutation.mutateAsync(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Root Cause Clusters</span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {clusters.length} Active Clusters
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual errors aggregated into semantic root causes using sentence embeddings.
          </p>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-brand-950/40 border border-brand-500/40 px-3 py-1.5 rounded-lg text-xs animate-in fade-in">
            <span className="font-mono text-brand-300 font-semibold">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkResolve}
              disabled={bulkResolveMutation.isPending}
              className="px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white px-1.5 py-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-dark-card border border-dark-border rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by title, exception type, or function..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0D111A] border border-dark-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="ongoing">Ongoing</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Browser Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Browser:</span>
            <select
              value={browserFilter}
              onChange={(e) => setBrowserFilter(e.target.value)}
              aria-label="Filter by Browser"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Browsers</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Firefox">Firefox</option>
              <option value="Edge">Edge</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort clusters"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="count">Error Count (High-Low)</option>
              <option value="last_seen">Last Seen (Recent)</option>
              <option value="similarity">Semantic Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : clusters.length === 0 ? (
          <EmptyState
            title="No clusters matched your filters"
            description="Try clearing search criteria or selecting 'All Statuses'."
            actionText="Reset Filters"
            onAction={() => {
              setStatusFilter('all');
              setBrowserFilter('all');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0E121A] border-b border-dark-border text-slate-400 font-mono text-[11px] select-none">
                  <th className="py-2.5 px-3 w-8">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-white"
                      title="Select all"
                    >
                      {selectedIds.length === clusters.length && clusters.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-brand-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Cluster / Root Cause Title</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Errors</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-28">24h Trend</th>
                  <th className="py-2.5 px-3 font-semibold">Browsers</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Last Seen</th>
                  <th className="py-2.5 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 font-sans">
                {clusters.map((cluster) => {
                  const isSelected = selectedIds.includes(cluster.id);

                  return (
                    <tr
                      key={cluster.id}
                      onClick={() => onSelectCluster(cluster.id)}
                      className={`hover:bg-dark-cardHover transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-brand-500/10'
                          : cluster.is_spiking
                          ? 'bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3" onClick={(e) => handleToggleSelect(cluster.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </td>

                      {/* Title & Metadata */}
                      <td className="py-3 px-3 max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                            {cluster.id}
                          </span>
                          <span className="font-mono text-[11px] text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">
                            {cluster.exception_type}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {(cluster.similarity_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1 leading-snug">
                          {cluster.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {cluster.representative_error?.message}
                        </div>
                      </td>

                      {/* Error Count */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono text-sm font-bold text-white tabular-nums">
                          {cluster.error_count.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {((cluster.error_count / 600) * 100).toFixed(1)}% of total
                        </div>
                      </td>

                      {/* 24h Trend Sparkline */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-block">
                          <Sparkline
                            data={cluster.sparkline}
                            width={80}
                            height={22}
                            isSpike={cluster.is_spiking}
                          />
                        </div>
                      </td>

                      {/* Affected Browsers */}
                      <td className="py-3 px-3">
                        {renderBrowserBadges(cluster.browsers)}
                      </td>

                      {/* Status & Spike Badge */}
                      <td className="py-3 px-3">
                        <StatusBadge
                          status={cluster.status}
                          isSpiking={cluster.is_spiking}
                        />
                      </td>

                      {/* Last Seen */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div className="text-slate-300">Just now</div>
                        <div className="text-[10px] text-slate-500">2026-10-24 09:12</div>
                      </td>

                      {/* Chevron Arrow */}
                      <td className="py-3 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
