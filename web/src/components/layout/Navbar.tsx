import React, { useState } from 'react';
import {
  Activity,
  Search,
  Command,
  Sun,
  Moon,
  ChevronDown,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  Radio,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { ScreenId } from '../../types';

interface NavbarProps {
  activeScreen: ScreenId;
  onOpenCommandPalette: () => void;
  isDemoRunning: boolean;
  isSpikeActive: boolean;
  onToggleDemo: () => void;
  onTriggerSpike: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  onOpenCommandPalette,
  isDemoRunning,
  isSpikeActive,
  onToggleDemo,
  onTriggerSpike,
  isDark,
  onToggleTheme,
}) => {
  const [selectedProject, setSelectedProject] = useState('production-api');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const projects = [
    { id: 'production-api', name: 'production-api', env: 'Production', errors: '600 errs' },
    { id: 'web-frontend', name: 'web-frontend', env: 'Production', errors: '124 errs' },
    { id: 'payment-service', name: 'payment-service', env: 'Staging', errors: '38 errs' },
  ];

  const currentProj = projects.find((p) => p.id === selectedProject) || projects[0];

  return (
    <header className="h-14 bg-[#0B0E14] border-b border-dark-border px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand Logo + Project Switcher */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-700 flex items-center justify-center shadow-glow-violet ring-1 ring-violet-400/40">
            <Activity className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white font-sans">
                FAULTLINE
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-brand-500/20 text-brand-300 font-semibold uppercase">
                v2.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Semantic Error Intelligence
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-dark-border/80 hidden sm:block" />

        {/* Project Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0F1420] border border-dark-border hover:border-dark-borderHighlight text-xs text-slate-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono font-medium">{currentProj.name}</span>
            <span className="text-[10px] text-slate-400 font-sans hidden md:inline">
              ({currentProj.env})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#0E121A] border border-dark-border rounded-xl shadow-2xl p-1 z-40 text-xs">
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Select Project
              </div>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProject(proj.id);
                    setShowProjectMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    proj.id === selectedProject
                      ? 'bg-brand-500/15 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        proj.env === 'Production' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-mono">{proj.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{proj.errors}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search (Cmd+K) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0E131C] border border-dark-border hover:border-brand-500/50 text-xs text-slate-400 hover:text-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transition-colors" />
            <span>Search root causes, stack traces, actions...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#161B26] border border-dark-border text-[10px] font-mono text-slate-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right: Live Status + Demo Controls + Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Live Ingestion Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Ingestion Active</span>
          <span className="text-slate-500 text-[11px]">• 12 ev/s</span>
        </div>

        {/* Demo Mode Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isSpikeActive
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-glow-amber animate-pulse'
                : 'bg-brand-500/15 border border-brand-500/30 text-brand-300 hover:bg-brand-500/25'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Demo Mode</span>
            {isSpikeActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0E121A] border border-dark-border rounded-xl shadow-2xl p-2 z-40 text-xs space-y-1 font-sans">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Simulation Controls</span>
                <span className="text-emerald-400">Ready</span>
              </div>

              {/* Play / Pause Toggle */}
              <button
                onClick={() => {
                  onToggleDemo();
                  setShowDemoMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800/50 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isDemoRunning ? (
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isDemoRunning ? 'Pause Live Stream' : 'Resume Live Stream'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {isDemoRunning ? 'Streaming' : 'Paused'}
                </span>
              </button>

              {/* Bad Deploy Spike Simulation */}
              <button
                onClick={() => {
                  onTriggerSpike();
                  setShowDemoMenu(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                  isSpikeActive
                    ? 'bg-rose-500/20 text-rose-300 font-medium'
                    : 'hover:bg-slate-800/50 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame
                    className={`w-3.5 h-3.5 ${
                      isSpikeActive ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                  <span>
                    {isSpikeActive ? 'Revert Bad Deploy' : 'Simulate Bad Deploy Spike'}
                  </span>
                </div>
                {isSpikeActive && (
                  <span className="text-[10px] font-mono bg-rose-500/30 text-rose-300 px-1 rounded">
                    Active
                  </span>
                )}
              </button>

              <div className="pt-1 border-t border-dark-border/60 text-[10px] text-slate-400 px-2 leading-tight">
                Simulates real-world release anomaly on RC-2 Payment Gateway.
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-[#0F1420] border border-dark-border hover:border-dark-borderHighlight text-slate-400 hover:text-slate-200 transition-colors"
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />}
        </button>
      </div>
    </header>
  );
};
