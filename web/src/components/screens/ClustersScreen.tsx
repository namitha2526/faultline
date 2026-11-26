import React, { useState } from 'react';
import {
  Layers,
  Search,
  Zap,
  Clock,
  Compass,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { ClusterListItem } from '../../types/api';

interface ClustersScreenProps {
  clusters: ClusterListItem[];
  loading: boolean;
  onSelectCluster: (clusterId: string) => void;
}

export const ClustersScreen: React.FC<ClustersScreenProps> = ({
  clusters,
  loading,
  onSelectCluster,
}) => {
  const [search, setSearch] = useState('');
  const [filterSpikeOnly, setFilterSpikeOnly] = useState(false);

  const filteredClusters = clusters.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.representative_message.toLowerCase().includes(search.toLowerCase());
    const matchesSpike = filterSpikeOnly ? c.is_spiking : true;
    return matchesSearch && matchesSpike;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Semantic Error Clusters
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Errors grouped by underlying meaning via 384-dimensional vector proximity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clusters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 transition-all"
            />
          </div>

          {/* Filter Spikes Only Toggle */}
          <button
            onClick={() => setFilterSpikeOnly(!filterSpikeOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterSpikeOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Spikes Only
          </button>
        </div>
      </div>

      {/* Clusters List */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-slate-500 text-xs">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2" />
          Loading clusters...
        </div>
      ) : filteredClusters.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-500 text-xs">
          No clusters found matching your filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClusters.map((cluster) => {
            return (
              <div
                key={cluster.id}
                onClick={() => onSelectCluster(cluster.id)}
                className={`group bg-slate-900/60 hover:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  cluster.is_spiking
                    ? 'border-rose-500/40 shadow-lg shadow-rose-950/20 hover:border-rose-500/60'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Title & Sample Message */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {cluster.title}
                    </span>

                    {/* Spike Badge */}
                    {cluster.is_spiking && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/40 animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-current" /> Spiking Rate
                      </span>
                    )}

                    {/* Status Badge */}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {cluster.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate font-mono">
                    {cluster.representative_message}
                  </p>

                  {/* Browser Breakdown Tags */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {Object.entries(cluster.browsers || {}).map(([browser, count]) => (
                      <span
                        key={browser}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400"
                      >
                        {browser}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Sparkline, Counts & Arrow */}
                <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/60">
                  {/* Mini Sparkline Bar Chart */}
                  <div className="flex items-end gap-1 h-8 w-24">
                    {cluster.sparkline.map((val, idx) => {
                      const maxVal = Math.max(...cluster.sparkline, 1);
                      const heightPercent = Math.max(15, (val / maxVal) * 100);
                      return (
                        <div
                          key={idx}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-2.5 rounded-t transition-all ${
                            cluster.is_spiking ? 'bg-rose-500/80' : 'bg-indigo-500/70'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Error Count */}
                  <div className="text-right min-w-[70px]">
                    <div className="text-base font-extrabold text-white font-mono">
                      {cluster.error_count.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      events
                    </div>
                  </div>

                  {/* Open Arrow */}
                  <div className="w-8 h-8 rounded-xl bg-slate-800/60 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
