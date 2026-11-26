import React from 'react';
import {
  GitCommit,
  GitBranch,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useReleases } from '../hooks/useEvaluation';
import { useOverview } from '../hooks/useOverview';
import { ScreenId } from '../types';

interface ReleasesPageProps {
  onNavigate: (screen: ScreenId, clusterId?: string) => void;
  onTriggerSpike: () => void;
  isSpikeActive: boolean;
}

export const ReleasesPage: React.FC<ReleasesPageProps> = ({
  onNavigate,
  onTriggerSpike,
  isSpikeActive,
}) => {
  const { data: releases = [] } = useReleases();
  const { data: metrics } = useOverview();

  const deployChartData = [
    { time: '10-21 00:00', errors: 22, deploy: 'v2.4.0' },
    { time: '10-21 12:00', errors: 26 },
    { time: '10-22 00:00', errors: 20 },
    { time: '10-22 12:00', errors: 24 },
    { time: '10-23 00:00', errors: 21 },
    { time: '10-23 16:00', errors: 23, deploy: 'v2.4.1' },
    { time: '10-24 04:00', errors: 25 },
    { time: '10-24 07:15', errors: isSpikeActive ? 142 : 34, deploy: 'v2.5.0-canary' },
    { time: 'Now', errors: isSpikeActive ? 184 : 32 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Releases & Deploy Velocity</span>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              production-api
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Correlate code deployments directly with error surges and newly emerging root cause clusters.
          </p>
        </div>

        {/* Quick action: simulate or revert canary spike */}
        <button
          onClick={onTriggerSpike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isSpikeActive
              ? 'bg-rose-500 text-white shadow-glow-amber'
              : 'bg-dark-card border border-dark-border text-slate-300 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>{isSpikeActive ? 'Rollback Canary Deploy' : 'Simulate Bad Canary Deploy'}</span>
        </button>
      </div>

      {/* Release Error Chart with Deploy Markers */}
      <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Error Frequency with Release Deploy Markers
            </h3>
            <p className="text-xs text-slate-400">
              Vertical reference lines denote automated CD deployments.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-0.5 bg-brand-500" />
              Total Errors
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Deploy Event
            </span>
          </div>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deployChartData} margin={{ top: 20, right: 20, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E222B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E121A',
                  borderColor: '#1E222B',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F1F5F9',
                }}
              />
              <ReferenceLine
                x="10-24 07:15"
                stroke="#F43F5E"
                strokeDasharray="4 4"
                label={{
                  value: 'v2.5.0-canary (Spike!)',
                  fill: '#F43F5E',
                  fontSize: 11,
                  position: 'top',
                }}
              />
              <ReferenceLine
                x="10-23 16:00"
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: 'v2.4.1 (Healthy)',
                  fill: '#10B981',
                  fontSize: 11,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5CF6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deployments Timeline List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Deployment History & Incident Correlation</span>
        </h3>

        <div className="space-y-3">
          {releases.map((rel) => {
            const isSpiking = rel.status === 'spiking';

            return (
              <div
                key={rel.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSpiking
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-glow-amber'
                    : 'bg-dark-card border-dark-border hover:border-dark-borderHighlight'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-2 rounded-lg font-mono text-xs font-bold ${
                        isSpiking
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <GitCommit className="w-4 h-4" />
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {rel.version}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          {rel.commit}
                        </span>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-mono rounded-full uppercase font-bold ${
                            isSpiking
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{rel.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <div>
                      <div>Deployed by {rel.author}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(rel.deployed_at).toLocaleString()}
                      </div>
                    </div>

                    {isSpiking && (
                      <button
                        onClick={() => onNavigate('cluster-detail', rel.spiking_cluster_id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>View Spiking RC-2</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
