import React, { useState, useEffect } from 'react';
import {
  Radio,
  Layers,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { wsClient } from '../../services/websocket';
import { ClusterListItem, LiveStreamEvent } from '../../types/api';

interface LiveFeedScreenProps {
  clusters: ClusterListItem[];
  onSelectCluster: (clusterId: string) => void;
}

export const LiveFeedScreen: React.FC<LiveFeedScreenProps> = ({
  clusters,
  onSelectCluster,
}) => {
  const [events, setEvents] = useState<LiveStreamEvent[]>([]);
  const [activeClusterSnaps, setActiveClusterSnaps] = useState<Record<string, number>>({});
  const [totalStreamed, setTotalStreamed] = useState(0);

  useEffect(() => {
    const unsubscribe = wsClient.subscribe((event) => {
      setEvents((prev) => [event, ...prev.slice(0, 49)]); // Keep last 50 events
      setTotalStreamed((prev) => prev + 1);

      // Trigger snap glow animation on the targeted cluster
      if (event.cluster?.id) {
        const cid = event.cluster.id;
        setActiveClusterSnaps((prev) => ({ ...prev, [cid]: Date.now() }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Live Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            Live Ingestion Feed & Semantic Snap
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time error stream snapping dynamically into 384-dimensional semantic clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-indigo-400 font-bold">{totalStreamed}</span> stream events received
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            WebSocket Connected
          </div>
        </div>
      </div>

      {/* Main Split Grid: Live Stream on Left, Live Clusters on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Real-Time Incoming Error Log */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" /> Incoming Stream ({events.length})
            </span>
            <span className="text-[10px] text-slate-500">Auto-scrolls latest</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="py-24 text-center text-slate-500 text-xs space-y-3">
                <Radio className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                <p>Waiting for live stream events...</p>
                <p className="text-[11px] text-slate-600">
                  Click <span className="text-indigo-400 font-semibold">"Start Replay"</span> in the navbar above to begin playback.
                </p>
              </div>
            ) : (
              events.map((ev, idx) => {
                return (
                  <div
                    key={ev.error.id + idx}
                    className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                      ev.is_spike
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-900/20'
                        : idx === 0
                        ? 'bg-indigo-950/25 border-indigo-500/40 animate-in fade-in slide-in-from-top-1'
                        : 'bg-slate-950/60 border-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-400 font-mono">
                        {ev.error.exception_type || 'Error'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-slate-300 font-mono text-[11px] line-clamp-2">
                      {ev.error.message}
                    </p>

                    {/* Snap Destination Pill */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px]">
                      <span className="text-slate-500">
                        {ev.error.browser} • {(ev.error.stack_hash || '').slice(0, 8)}...
                      </span>
                      <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                        <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                        {ev.cluster.title.slice(0, 24)}...
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Live Semantic Clusters Snapping Board */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Active Semantic Clusters
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Watch incoming errors visually match and snap into their root-cause cluster.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 font-semibold">
              8 Clusters
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {clusters.map((cluster) => {
              const lastSnapTime = activeClusterSnaps[cluster.id] || 0;
              const isSnappingNow = Date.now() - lastSnapTime < 1000;

              return (
                <div
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    cluster.is_spiking
                      ? 'bg-rose-950/20 border-rose-500/60 shadow-lg shadow-rose-950/30'
                      : isSnappingNow
                      ? 'bg-indigo-950/40 border-indigo-400 shadow-lg shadow-indigo-500/25 scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white line-clamp-2">
                      {cluster.title}
                    </span>
                    {cluster.is_spiking && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                        SPIKE
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 font-medium">Occurrences</span>
                    <span
                      className={`text-sm font-mono font-extrabold transition-all ${
                        isSnappingNow ? 'text-indigo-300 scale-110' : 'text-slate-200'
                      }`}
                    >
                      {cluster.error_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
