import React, { useState } from 'react';
import { GitCompare, Layers, ArrowRight, CheckCircle2, Split, AlignJustify } from 'lucide-react';
import { StackVariant } from '../../types';

interface TraceDiffProps {
  variants: StackVariant[];
  clusterTitle: string;
  className?: string;
}

export const TraceDiff: React.FC<TraceDiffProps> = ({ variants, clusterTitle, className = '' }) => {
  if (!variants || variants.length === 0) {
    return <div className="p-4 text-xs text-slate-500">No variant traces available for this cluster.</div>;
  }

  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, variants.length - 1));
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const varA = variants[leftIndex];
  const varB = variants[rightIndex];

  const linesA = (varA?.stack_trace || '').trim().split('\n');
  const linesB = (varB?.stack_trace || '').trim().split('\n');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Intelligence Banner */}
      <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/25 flex items-start gap-3">
        <GitCompare className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-violet-300 flex items-center gap-2">
            <span>Semantic Invariance Across Call-Stack Pathways</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-violet-500/20 rounded text-violet-300">
              Cosine Similarity: 0.92
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Exact-hash tools (like Sentry) partition these traces into separate issues because their function names and files differ completely.
            Faultline detects the identical semantic failure mechanism and unifies them into <strong>{clusterTitle}</strong>.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-dark-card rounded-xl border border-dark-border text-xs">
        <div className="flex items-center gap-3">
          {/* Left Variant Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Variant A:</span>
            <select
              value={leftIndex}
              onChange={(e) => setLeftIndex(Number(e.target.value))}
              aria-label="Variant A"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              {variants.map((v, idx) => (
                <option key={v.id} value={idx}>
                  {v.title} ({v.occurrence_count} errs)
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500" />

          {/* Right Variant Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Variant B:</span>
            <select
              value={rightIndex}
              onChange={(e) => setRightIndex(Number(e.target.value))}
              aria-label="Variant B"
              className="bg-[#0D111A] text-slate-200 border border-dark-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              {variants.map((v, idx) => (
                <option key={v.id} value={idx}>
                  {v.title} ({v.occurrence_count} errs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-dark-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'split' ? 'bg-brand-500 text-white' : 'bg-[#0E121A] text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            Split View
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'unified' ? 'bg-brand-500 text-white' : 'bg-[#0E121A] text-slate-400 hover:text-white'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            Unified View
          </button>
        </div>
      </div>

      {/* Comparison View */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {/* Left Column */}
          <div className="rounded-xl border border-dark-border bg-[#0B0E14] overflow-hidden">
            <div className="p-2.5 bg-[#0F1420] border-b border-dark-border flex items-center justify-between">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {varA?.title}
              </span>
              <span className="text-[11px] text-slate-400">{varA?.pathway}</span>
            </div>
            <div className="p-3 text-[11px] text-slate-400 italic bg-[#0E121B] border-b border-dark-border/60 font-sans">
              {varA?.diff_notes}
            </div>
            <pre className="p-3 text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
              {linesA.map((line, idx) => (
                <div key={idx} className="flex gap-2 hover:bg-slate-800/30 px-1 rounded">
                  <span className="text-slate-600 select-none w-5 text-right">{idx + 1}</span>
                  <span className={line.includes('src/') ? 'text-violet-300' : 'text-slate-400'}>
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>

          {/* Right Column */}
          <div className="rounded-xl border border-dark-border bg-[#0B0E14] overflow-hidden">
            <div className="p-2.5 bg-[#0F1420] border-b border-dark-border flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {varB?.title}
              </span>
              <span className="text-[11px] text-slate-400">{varB?.pathway}</span>
            </div>
            <div className="p-3 text-[11px] text-slate-400 italic bg-[#0E121B] border-b border-dark-border/60 font-sans">
              {varB?.diff_notes}
            </div>
            <pre className="p-3 text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
              {linesB.map((line, idx) => (
                <div key={idx} className="flex gap-2 hover:bg-slate-800/30 px-1 rounded">
                  <span className="text-slate-600 select-none w-5 text-right">{idx + 1}</span>
                  <span className={line.includes('src/') ? 'text-teal-300' : 'text-slate-400'}>
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      ) : (
        /* Unified View */
        <div className="rounded-xl border border-dark-border bg-[#0B0E14] overflow-hidden font-mono text-xs">
          <div className="p-2.5 bg-[#0F1420] border-b border-dark-border text-slate-300 font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Unified Diff Stream: {varA?.title} ⟷ {varB?.title}
          </div>
          <div className="divide-y divide-dark-border/40 text-xs">
            {linesA.map((lineA, idx) => {
              const lineB = linesB[idx];
              const isMatch = lineA.trim() === lineB?.trim();

              return (
                <div key={idx} className="flex flex-col">
                  <div className={`px-3 py-1.5 flex items-center gap-2 ${isMatch ? 'bg-[#0B0E14] text-slate-300' : 'bg-rose-950/20 text-rose-300'}`}>
                    <span className="text-[11px] text-rose-500 select-none w-4">{isMatch ? ' ' : '-'}</span>
                    <span className="flex-1 overflow-x-auto">{lineA}</span>
                  </div>
                  {!isMatch && lineB && (
                    <div className="px-3 py-1.5 flex items-center gap-2 bg-emerald-950/20 text-emerald-300">
                      <span className="text-[11px] text-emerald-500 select-none w-4">+</span>
                      <span className="flex-1 overflow-x-auto">{lineB}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
