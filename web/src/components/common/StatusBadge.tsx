import React from 'react';
import { ClusterStatus } from '../../types';

interface StatusBadgeProps {
  status: ClusterStatus;
  isSpiking?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isSpiking, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'new':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'ongoing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ignored':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyles()} capitalize inline-flex items-center gap-1`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'resolved'
              ? 'bg-emerald-400'
              : status === 'new'
              ? 'bg-violet-400'
              : 'bg-amber-400'
          }`}
        />
        {status}
      </span>

      {isSpiking && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Spiking
        </span>
      )}
    </div>
  );
};
