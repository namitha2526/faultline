import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Filter,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useEmbeddingMap } from '../hooks/useEvaluation';
import { useClusters } from '../hooks/useClusters';
import { EmbeddingPoint, ScreenId } from '../types';

interface EmbeddingMapPageProps {
  onSelectCluster: (id: string) => void;
}

const CLUSTER_COLORS: Record<string, string> = {
  'RC-1': '#8B5CF6', // Electric Violet
  'RC-2': '#F43F5E', // Rose
  'RC-3': '#06B6D4', // Cyan
  'RC-4': '#10B981', // Emerald
  'RC-5': '#F97316', // Orange
  'RC-6': '#EC4899', // Pink
  'RC-7': '#3B82F6', // Blue
  'RC-8': '#14B8A6', // Teal
};

export const EmbeddingMapPage: React.FC<EmbeddingMapPageProps> = ({ onSelectCluster }) => {
  const { data: points = [], isLoading } = useEmbeddingMap();
  const { data: clusters = [] } = useClusters();

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<EmbeddingPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hiddenClusters, setHiddenClusters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightTrickyOnly, setHighlightTrickyOnly] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Filter points based on hidden clusters, search, and tricky filter
  const visiblePoints = useMemo(() => {
    return points.filter((p) => {
      if (hiddenClusters.includes(p.cluster_id)) return false;
      if (highlightTrickyOnly && !p.is_tricky) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.message.toLowerCase().includes(q) ||
          p.exception_type.toLowerCase().includes(q) ||
          p.cluster_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [points, hiddenClusters, highlightTrickyOnly, searchQuery]);

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.3, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleClusterVisibility = (clusterId: string) => {
    setHiddenClusters((prev) =>
      prev.includes(clusterId) ? prev.filter((id) => id !== clusterId) : [...prev, clusterId]
    );
  };

  // Coordinate mapper from UMAP [-10, 10] space to SVG canvas [0, 800]
  const mapCoord = (val: number, isY = false) => {
    const range = 22;
    const center = 400;
    const scaled = (val / range) * 700;
    return isY ? center - scaled : center + scaled;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>2D Semantic Embedding Map</span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              UMAP Projection (384-D → 2D)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            600 errors visualized by semantic distance. Points positioned close together share underlying root-cause geometry.
          </p>
        </div>

        {/* Tricky Cases Quick Filter Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHighlightTrickyOnly(!highlightTrickyOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              highlightTrickyOnly
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-dark-card border border-dark-border text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>Isolate Tricky Edge Cases (RC-1 vs RC-7)</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas Card */}
      <div className="relative rounded-2xl bg-[#090C12] border border-dark-border overflow-hidden shadow-2xl h-[560px] flex flex-col">
        {/* Floating Controls Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          {/* Search Input */}
          <div className="pointer-events-auto w-64">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Highlight by message or exception..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0E121A]/90 backdrop-blur-md border border-dark-border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-md font-sans"
              />
            </div>
          </div>

          {/* Zoom & Pan Controls */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#0E121A]/90 backdrop-blur-md border border-dark-border rounded-lg p-1 shadow-md">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
        >
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#1E222B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <svg
            className="w-full h-full select-none"
            viewBox="0 0 800 800"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Render Error Points */}
            {visiblePoints.map((pt) => {
              const cx = mapCoord(pt.x);
              const cy = mapCoord(pt.y, true);
              const color = CLUSTER_COLORS[pt.cluster_id] || '#8B5CF6';
              const isHovered = hoveredPoint?.id === pt.id;

              return (
                <circle
                  key={pt.id}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : pt.is_tricky ? 4.5 : 3.5}
                  fill={color}
                  stroke={isHovered ? '#FFFFFF' : 'rgba(0,0,0,0.5)'}
                  strokeWidth={isHovered ? 2 : 0.8}
                  opacity={isHovered ? 1 : 0.85}
                  className="cursor-pointer transition-all duration-100"
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                    setHoveredPoint(pt);
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectCluster(pt.cluster_id)}
                />
              );
            })}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute z-30 pointer-events-none max-w-sm p-3 rounded-xl bg-[#0E121A]/95 backdrop-blur-md border border-brand-500/50 shadow-2xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${Math.min(tooltipPos.x + 15, 480)}px`,
                top: `${Math.min(tooltipPos.y + 15, 420)}px`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-white"
                  style={{ backgroundColor: CLUSTER_COLORS[hoveredPoint.cluster_id] || '#8B5CF6' }}
                >
                  {hoveredPoint.cluster_id}
                </span>
                <span className="font-mono text-[11px] text-violet-300">
                  {hoveredPoint.exception_type}
                </span>
              </div>

              <div className="font-semibold text-slate-100 line-clamp-1">
                {hoveredPoint.cluster_title}
              </div>

              <p className="text-[11px] font-mono text-slate-300 line-clamp-2 leading-relaxed bg-[#0B0E14] p-1.5 rounded border border-dark-border">
                {hoveredPoint.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>{hoveredPoint.browser}</span>
                <span className="text-brand-300">Click point to inspect</span>
              </div>
            </div>
          )}
        </div>

        {/* Cluster Legend Footer with Visibility Toggles */}
        <div className="bg-[#0B0E14] border-t border-dark-border px-4 py-2.5 flex items-center gap-4 overflow-x-auto text-xs font-mono select-none">
          <span className="text-slate-500 shrink-0 text-[11px]">Legend:</span>
          {clusters.map((c) => {
            const isHidden = hiddenClusters.includes(c.id);
            const color = CLUSTER_COLORS[c.id] || '#8B5CF6';

            return (
              <button
                key={c.id}
                onClick={() => toggleClusterVisibility(c.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors shrink-0 ${
                  isHidden ? 'opacity-40 hover:opacity-70 bg-slate-900' : 'bg-[#111520] hover:bg-slate-800'
                }`}
                title={`Toggle visibility for ${c.id}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 font-semibold">{c.id}</span>
                <span className="text-slate-500 text-[10px] hidden sm:inline truncate max-w-[100px]">
                  {c.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
