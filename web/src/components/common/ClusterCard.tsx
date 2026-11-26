import React from 'react';
import { Flame, Sparkles, ChevronRight, Activity } from 'lucide-react';
import { Cluster } from '../../types';
import { Sparkline } from './Sparkline';
import { StatusBadge } from './StatusBadge';

interface ClusterCardProps {
  cluster: Cluster;
  isSnapped?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  isSnapped = false,
  onSelect,
  className = '',
}) => {
  return (
    <div
      onClick={() => onSelect?.(cluster.id)}
      className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group ${
        isSnapped
          ? 'bg-violet-950/40 border-violet-500 shadow-glow-violet animate-snap ring-1 ring-violet-400'
          : cluster.is_spiking
          ? 'bg-[#181216] border-rose-500/40 hover:border-rose-500/80'
          : 'bg-dark-card border-dark-border hover:border-dark-borderHighlight hover:bg-dark-cardHover'
      } ${className}`}
    >
      {/* Top row: Cluster ID + Status + Error Count */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
            {cluster.id}
          </span>
          <StatusBadge status={cluster.status} isSpiking={cluster.is_spiking} />
        </div>

        {/* Live Tally Counter */}
        <div className="flex items-center gap-1.5">
          {cluster.is_spiking && (
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          )}
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {cluster.error_count.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-sans">errors</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-2 leading-relaxed mb-2.5">
        {cluster.title}
      </h3>

      {/* Exception type pill + similarity */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
        <span className="font-mono text-[11px] text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded max-w-[170px] truncate">
          {cluster.exception_type}
        </span>
        <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {(cluster.similarity_score * 100).toFixed(0)}% match
        </span>
      </div>

      {/* Sparkline & Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-border/50 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-slate-400" />
          <span className="font-sans text-[10px] text-slate-400">24h activity</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkline
            data={cluster.sparkline}
            width={70}
            height={20}
            isSpike={cluster.is_spiking}
          />
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
