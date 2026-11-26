import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Zap,
  Flame,
  PlusCircle,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Globe,
  Sliders,
} from 'lucide-react';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { useClusters } from '../hooks/useClusters';
import { ClusterCard } from '../components/common/ClusterCard';
import { SpeedMultiplier } from '../lib/api/feedSocket';
import { ScreenId } from '../types';

interface LiveFeedPageProps {
  onSelectCluster: (id: string) => void;
  onTriggerSpike: () => void;
  isSpikeActive: boolean;
}

export const LiveFeedPage: React.FC<LiveFeedPageProps> = ({
  onSelectCluster,
  onTriggerSpike,
  isSpikeActive,
}) => {
  const {
    events,
    isPlaying,
    speed,
    activeSnappedClusterId,
    totalStreamedCount,
    togglePlay,
    changeSpeed,
    injectError,
  } = useLiveFeed();

  const { data: clusters = [] } = useClusters();
  const [selectedTargetCluster, setSelectedTargetCluster] = useState<string>('');

  const speeds: SpeedMultiplier[] = [1, 5, 20];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header: Live Counters & Stream Controls */}
      <div className="p-5 rounded-2xl bg-[#0E121A] border border-dark-border shadow-xl space-y-4">
        {/* Status Line + Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Real-Time Error Stream & Semantic Snapping</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  LIVE DEMO
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Incoming production errors are embedded on-the-fly and matched to cluster centroids in &lt;40ms.
              </p>
            </div>
          </div>

          {/* Interactive Player Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Feed</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Feed</span>
                </>
              )}
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center bg-[#090C12] border border-dark-border rounded-lg p-0.5 text-xs font-mono">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`px-2 py-1 rounded transition-colors ${
                    speed === s
                      ? 'bg-brand-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Inject Single Error */}
            <button
              onClick={() => injectError()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Inject a single error right now"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-400" />
              <span>Inject Error</span>
            </button>

            {/* Bad Deploy Spike */}
            <button
              onClick={onTriggerSpike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSpikeActive
                  ? 'bg-rose-500 text-white shadow-glow-amber'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isSpikeActive ? 'Revert Spike' : 'Spike Bad Deploy'}</span>
            </button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-dark-border/60">
          <div className="p-3 rounded-xl bg-[#090C12] border border-dark-border">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Streamed Errors</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">
              {(600 + totalStreamedCount).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">+{totalStreamedCount} during demo session</div>
          </div>

          <div className="p-3 rounded-xl bg-[#090C12] border border-dark-border">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Clusters Formed</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {clusters.length}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">0 false-positive splits</div>
          </div>

          <div className="p-3 rounded-xl bg-[#090C12] border border-dark-border">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Compression Ratio</div>
            <div className="text-xl font-bold font-mono text-violet-300 mt-0.5 tabular-nums">
              {((600 + totalStreamedCount) / clusters.length).toFixed(1)}x
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Raw alerts eliminated</div>
          </div>

          <div className="p-3 rounded-xl bg-[#090C12] border border-dark-border">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Match Latency</div>
            <div className="text-xl font-bold font-mono text-teal-400 mt-0.5">
              28 ms
            </div>
            <div className="text-[10px] text-slate-500 font-mono">In-memory centroid cache</div>
          </div>
        </div>
      </div>

      {/* Main Split: Left Stream (Incoming) | Right (Active Clusters) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Incoming Error Stream */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Incoming Stream</span>
              <span className="text-[10px] text-slate-500 font-mono">({events.length} in buffer)</span>
            </h3>

            <div className="text-[11px] font-mono text-slate-500">
              {isPlaying ? 'Streaming real-time' : 'Paused'}
            </div>
          </div>

          {/* Stream Buffer Scroll Container */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-dark-border rounded-xl">
                Waiting for incoming events... Click "Inject Error" or click Play.
              </div>
            ) : (
              events.map((evt, idx) => {
                const isFresh = idx === 0;

                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-xl border transition-all duration-300 space-y-1.5 ${
                      isFresh
                        ? 'bg-brand-950/40 border-brand-500 shadow-glow-violet scale-[1.01]'
                        : 'bg-[#0E121A] border-dark-border text-slate-300 hover:border-dark-borderHighlight'
                    }`}
                  >
                    {/* Event Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-violet-300 font-semibold bg-violet-500/10 px-1 rounded">
                          {evt.error.exception_type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Snap Indicator Arrow */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        <span>Snapping to</span>
                        <span className="font-bold">{evt.target_cluster_id}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>

                    {/* Error Message */}
                    <p className="text-xs font-mono text-slate-200 line-clamp-2 leading-relaxed">
                      {evt.error.message}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono flex-wrap">
                      <span>User: {evt.error.user_id}</span>
                      <span>•</span>
                      <span>{evt.error.browser.split(' ')[0]}</span>
                      <span>•</span>
                      <span>{evt.error.release}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Active Clusters Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>Semantic Root Cause Clusters</span>
              <span className="text-[10px] text-slate-500 font-mono">
                (Visual Snapping Destination)
              </span>
            </h3>

            <span className="text-[11px] text-slate-400 font-mono">
              Click cluster to inspect
            </span>
          </div>

          {/* Cluster Cards 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {clusters.map((cluster) => {
              const isSnapped = activeSnappedClusterId === cluster.id;

              return (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSnapped={isSnapped}
                  onSelect={onSelectCluster}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
