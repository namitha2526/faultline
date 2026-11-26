import React from 'react';
import {
  Activity,
  Layers,
  Radio,
  MapPin,
  BarChart2,
  GitCommit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
} from 'lucide-react';
import { ScreenId } from '../../types';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  clusterCount: number;
  spikeCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  clusterCount,
  spikeCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'overview' as ScreenId,
      label: 'Overview',
      icon: <Activity className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'clusters' as ScreenId,
      label: 'Clusters',
      icon: <Layers className="w-4 h-4" />,
      badge: clusterCount,
      isSpike: spikeCount > 0,
    },
    {
      id: 'feed' as ScreenId,
      label: 'Live Feed',
      icon: <Radio className="w-4 h-4" />,
      badge: 'LIVE',
      isLive: true,
    },
    {
      id: 'map' as ScreenId,
      label: 'Embedding Map',
      icon: <MapPin className="w-4 h-4" />,
      badge: '2D',
    },
    {
      id: 'evaluation' as ScreenId,
      label: 'Evaluation',
      icon: <BarChart2 className="w-4 h-4" />,
      badge: 'F1 100%',
    },
    {
      id: 'releases' as ScreenId,
      label: 'Releases',
      icon: <GitCommit className="w-4 h-4" />,
      badge: null,
    },
    {
      id: 'settings' as ScreenId,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      badge: null,
    },
  ];

  return (
    <aside
      className={`h-full bg-[#0B0E14] border-r border-dark-border flex flex-col justify-between transition-all duration-300 z-20 select-none ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Navigation Section */}
      <div className="p-3 space-y-6">
        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-brand-500/15 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r-full" />
                )}

                <span
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between text-left">
                    <span className="truncate">{item.label}</span>

                    {item.isLive && (
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        LIVE
                      </span>
                    )}

                    {item.badge !== null && !item.isLive && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-mono rounded ${
                          item.isSpike
                            ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-0.5'
                            : isActive
                            ? 'bg-brand-500/25 text-brand-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.isSpike && <Flame className="w-2.5 h-2.5" />}
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-dark-border/60 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-lg bg-[#0E121A] border border-dark-border/70 text-[11px]">
            <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3" />
                Cluster Reduction
              </span>
              <span className="font-mono text-emerald-400 font-bold">75.0x</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              600 errors compressed into 8 clusters.
            </p>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors text-xs"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-mono text-slate-400">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
