import React, { useState } from 'react';
import { Copy, Check, Code, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { StackFrame } from '../../types';

interface StackTraceViewerProps {
  stackTrace: string;
  frames?: StackFrame[];
  className?: string;
  maxInitialFrames?: number;
}

export const StackTraceViewer: React.FC<StackTraceViewerProps> = ({
  stackTrace,
  frames = [],
  className = '',
  maxInitialFrames = 8,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(0);

  // Parse frames from raw text if not provided
  const rawLines = (stackTrace || '').trim().split('\n');
  const displayFrames = frames.length > 0 ? frames : rawLines.map((line) => {
    const isApp = !line.includes('node_modules') && !line.includes('axios') && !line.includes('express');
    return {
      function: line.trim(),
      file: '',
      is_app: isApp,
    };
  });

  const visibleFrames = showAll ? displayFrames : displayFrames.slice(0, maxInitialFrames);
  const hiddenCount = displayFrames.length - visibleFrames.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(stackTrace);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-dark-border bg-[#0B0E14] overflow-hidden ${className}`}>
      {/* Top Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0E121A] border-b border-dark-border text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-mono font-medium text-slate-300">Stack Trace</span>
          <span className="text-[11px] text-slate-500 font-mono">
            ({displayFrames.length} frames • {displayFrames.filter((f) => f.is_app).length} in application code)
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-colors text-xs font-mono"
          title="Copy stack trace"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Stack Trace Frames List */}
      <div className="font-mono text-xs divide-y divide-dark-border/60">
        {visibleFrames.map((frame, idx) => {
          const isSelected = activeFrameIndex === idx;
          const isApp = frame.is_app ?? true;

          return (
            <div
              key={idx}
              onClick={() => setActiveFrameIndex(idx)}
              className={`flex items-start gap-3 px-3 py-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-brand-500/10 border-l-2 border-brand-500 text-white'
                  : isApp
                  ? 'bg-[#0B0E14] hover:bg-[#121620] text-slate-200'
                  : 'bg-[#090C12] hover:bg-[#10141E] text-slate-500 opacity-75'
              }`}
            >
              {/* Frame Line Number */}
              <span className="w-6 text-right text-[11px] text-slate-600 select-none pt-0.5">
                {idx + 1}
              </span>

              {/* Frame Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-semibold ${
                      isApp ? 'text-violet-300' : 'text-slate-400'
                    }`}
                  >
                    {frame.function}
                  </span>

                  {isApp && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-violet-500/20 text-violet-300 font-semibold uppercase tracking-wider">
                      app
                    </span>
                  )}
                </div>

                {frame.file && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 break-all">
                    <span>{frame.file}</span>
                  </div>
                )}
              </div>

              {isSelected && (
                <span className="text-[10px] font-sans text-brand-400 font-medium px-1.5 py-0.5 bg-brand-500/15 rounded shrink-0">
                  Focused
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse Button if many frames */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 bg-[#0E121A] hover:bg-[#141A26] border-t border-dark-border text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center justify-center gap-1 font-mono"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {hiddenCount} more framework & vendor frames
        </button>
      )}

      {showAll && displayFrames.length > maxInitialFrames && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-2 bg-[#0E121A] hover:bg-[#141A26] border-t border-dark-border text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 font-mono"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
          Collapse vendor frames
        </button>
      )}
    </div>
  );
};
