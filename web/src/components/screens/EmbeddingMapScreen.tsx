import React, { useEffect, useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RefreshCw, Search, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { EmbeddingMapPoint } from '../../types/api';

const CLUSTER_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#84cc16', // Lime
];

interface EmbeddingMapScreenProps {
  onSelectCluster?: (clusterId: string) => void;
}

export const EmbeddingMapScreen: React.FC<EmbeddingMapScreenProps> = () => {
  const [points, setPoints] = useState<EmbeddingMapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async (force: boolean = false) => {
    setLoading(true);
    try {
      const data = await api.getEmbeddingMap(force);
      setPoints(data.points || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Map distinct clusters to deterministic colors
  const clusterColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const titles = Array.from(new Set(points.map((p) => p.cluster_title))).sort();
    titles.forEach((title, idx) => {
      map.set(title, CLUSTER_COLORS[idx % CLUSTER_COLORS.length]);
    });
    return map;
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (!search) return points;
    const q = search.toLowerCase();
    return points.filter(
      (p) =>
        p.message.toLowerCase().includes(q) ||
        p.cluster_title.toLowerCase().includes(q) ||
        p.exception_type.toLowerCase().includes(q)
    );
  }, [points, search]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: EmbeddingMapPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl max-w-sm text-xs space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-[11px] font-mono">
              {data.exception_type}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({data.x}, {data.y})
            </span>
          </div>
          <p className="text-slate-300 font-mono text-[11px] line-clamp-3">
            {data.message}
          </p>
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-indigo-400 font-semibold">{data.cluster_title}</span>
            <span className="text-slate-500">{data.browser}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            2D Semantic Embedding Projection (UMAP)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing semantic vector manifolds: points closer together represent identical root causes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search points..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 transition-all"
            />
          </div>

          <button
            onClick={() => loadMap(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
            title="Recompute 2D projection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recompute UMAP
          </button>
        </div>
      </div>

      {/* Main Plot Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="h-[520px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-2" />
              Computing 2D UMAP projection from 384-D vectors...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  stroke="#475569"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  stroke="#475569"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <ZAxis range={[50, 50]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={filteredPoints} animationDuration={600}>
                  {filteredPoints.map((entry, index) => {
                    const color = clusterColorMap.get(entry.cluster_title) || '#6366f1';
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-4 flex-wrap text-xs">
          {Array.from(clusterColorMap.entries()).map(([title, color]) => (
            <div key={title} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-300 font-medium text-[11px] truncate max-w-[200px]">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
