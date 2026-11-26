import React, { useEffect, useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Zap,
  Code,
  Hash,
  Clock,
  Compass,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { ClusterDetail } from '../../types/api';

interface ClusterDetailModalProps {
  clusterId: string | null;
  onClose: () => void;
}

export const ClusterDetailModal: React.FC<ClusterDetailModalProps> = ({
  clusterId,
  onClose,
}) => {
  const [detail, setDetail] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (!clusterId) return;
    loadDetail(clusterId);
  }, [clusterId]);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getClusterDetail(id);
      setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!clusterId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Semantic Cluster
              </span>
              {detail?.is_spiking && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Active Spike
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {detail ? detail.title : 'Loading Cluster Details...'}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
              <span>{detail?.error_count || 0} occurrences</span>
              <span>•</span>
              <span>Last seen {detail ? new Date(detail.last_seen).toLocaleTimeString() : '...'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !detail ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3" />
              Loading cluster intelligence...
            </div>
          ) : (
            <>
              {/* "Why These Are The Same Bug" Explanation Box */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-4 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Semantic Root Cause Analysis
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {detail.explanation}
                </p>
                {detail.shared_functions.length > 0 && (
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Shared Call Chain:</span>
                    {detail.shared_functions.map((fn) => (
                      <span
                        key={fn}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300"
                      >
                        {fn}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Representative Error (Cluster Medoid) */}
              {detail.representative_error && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Representative Error (Centroid Medoid)
                  </h3>
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-slate-200 space-y-3">
                    <div className="text-rose-400 font-semibold">
                      {detail.representative_error.message}
                    </div>
                    {detail.representative_error.stack_trace && (
                      <pre className="text-[11px] text-slate-400 overflow-x-auto p-3 rounded-lg bg-slate-900/80 leading-relaxed max-h-48">
                        {detail.representative_error.stack_trace}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Member Occurrences Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recent Member Events ({detail.members.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Similarity evaluated against cluster centroid vector
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Message</th>
                        <th className="py-2.5 px-3">Browser / OS</th>
                        <th className="py-2.5 px-3">Legacy Stack Hash</th>
                        <th className="py-2.5 px-3 text-right">Similarity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {detail.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 max-w-xs truncate font-sans">
                            {member.message}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {member.browser} • {member.os}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span>{(member.stack_hash || '').slice(0, 10)}...</span>
                              <button
                                onClick={() => handleCopy(member.stack_hash || '')}
                                className="text-slate-500 hover:text-slate-300"
                                title="Copy full hash"
                              >
                                {copiedHash === member.stack_hash ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                            {(member.similarity_score * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
