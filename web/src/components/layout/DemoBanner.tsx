import React from 'react';
import { AlertTriangle, Flame, ArrowRight, X, RotateCcw } from 'lucide-react';

interface DemoBannerProps {
  message: string | null;
  onDismiss: () => void;
  onRevert: () => void;
  onNavigateToSpike: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message,
  onDismiss,
  onRevert,
  onNavigateToSpike,
}) => {
  if (!message) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950/90 via-red-900/80 to-amber-950/90 border-b border-rose-500/40 px-4 py-2 text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200 z-20">
      <div className="flex items-center gap-3">
        <span className="p-1 rounded bg-rose-500/20 text-rose-300">
          <Flame className="w-4 h-4 animate-bounce text-rose-400" />
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-rose-200">{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNavigateToSpike}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/30 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 text-xs font-medium transition-colors"
        >
          <span>Inspect Cluster</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={onRevert}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Revert Spike</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-rose-500/20 text-rose-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
