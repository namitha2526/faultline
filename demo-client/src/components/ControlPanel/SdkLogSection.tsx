import React, { useState, useEffect } from "react";
import { sdkLogger, SdkEventLog } from "../../faultline";
import { Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

export const SdkLogSection: React.FC = () => {
  const [logs, setLogs] = useState<SdkEventLog[]>(sdkLogger.getLogs());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = sdkLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">sent</span>;
      case "queued":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase animate-pulse">queued</span>;
      case "failed":
        return <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">failed</span>;
      case "dropped":
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">dropped</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Counters Bar */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Captured</div>
          <div className="text-base font-bold text-slate-900">{sdkLogger.capturedCount}</div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded-xl">
          <div className="text-[10px] font-medium text-emerald-600 uppercase">Sent</div>
          <div className="text-base font-bold text-emerald-700">{sdkLogger.sentCount}</div>
        </div>
        <div className="bg-red-50/70 border border-red-200 p-2 rounded-xl">
          <div className="text-[10px] font-medium text-red-600 uppercase">Failed</div>
          <div className="text-base font-bold text-red-700">{sdkLogger.failedCount}</div>
        </div>
        <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Dropped</div>
          <div className="text-base font-bold text-slate-700">{sdkLogger.droppedCount}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Live Events Log ({logs.length})</span>
        {logs.length > 0 && (
          <button
            onClick={() => sdkLogger.clearLogs()}
            className="flex items-center space-x-1 text-slate-400 hover:text-red-600 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Log Feed */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No errors captured yet. Trigger a bug above to see live SDK logs!
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusBadge(log.status)}
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      <span className="text-[11px] font-medium text-indigo-600 truncate">
                        {log.exception_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-mono line-clamp-1 break-all">
                      {log.message}
                    </p>
                    {log.reason && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Note: {log.reason}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Payload View */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Event ID: {log.event_id}</span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(log.payload, null, 2), log.id)}
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedId === log.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === log.id ? "Copied" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto text-[10px] leading-relaxed max-h-48">
                      <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

