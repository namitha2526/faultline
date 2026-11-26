import React, { useState } from "react";
import { ALL_BUGS } from "../../bugs";
import { Faultline } from "../../faultline";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

export const BugTriggerSection: React.FC = () => {
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleTrigger = (bugName: string, pathName: string, triggerFn: () => void) => {
    try {
      triggerFn();
    } catch {
      // Caught and handled by SDK
    }
    Faultline.flush().catch(() => {});
    setLastTriggered(`${bugName}: ${pathName}`);
    setTimeout(() => setLastTriggered(null), 3000);
  };

  return (
    <div className="space-y-4">
      {lastTriggered && (
        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Fired: <strong>{lastTriggered}</strong> (captured by Faultline)</span>
        </div>
      )}

      <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Faultline Semantic Advantage:</strong> Each button below throws a genuine JS error with a unique call stack (different functions, depths, and modules). Faultline clusters them by <em>underlying root cause</em> instead of splintering into dozens of hash-based issues.
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {ALL_BUGS.map((bug) => (
          <div key={bug.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-slate-900">{bug.name}</span>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                1 Root Cause
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              {bug.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {bug.paths.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleTrigger(bug.name, p.name, p.trigger)}
                  className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 hover:text-indigo-600 transition shadow-2xs group text-left"
                >
                  <Zap className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{p.actionName}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

