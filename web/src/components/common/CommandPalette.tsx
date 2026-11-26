import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  Activity,
  Layers,
  Radio,
  MapPin,
  BarChart2,
  GitCommit,
  Settings,
  AlertTriangle,
  Moon,
  Sun,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Cluster, ScreenId } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId, clusterId?: string) => void;
  clusters: Cluster[];
  onTriggerSpike: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Clusters';
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  clusters = [],
  onTriggerSpike,
  onToggleTheme,
  isDark,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText('fl_live_9f8e7d6c5b4a_demo_key');
    setCopiedKey(true);
    setTimeout(() => {
      setCopiedKey(false);
      onClose();
    }, 1200);
  };

  const baseItems: CommandItem[] = [
    {
      id: 'nav-overview',
      title: 'Overview Dashboard',
      category: 'Navigation',
      subtitle: 'KPIs, reduction ratio & top spikes',
      icon: <Activity className="w-4 h-4 text-violet-400" />,
      action: () => onNavigate('overview'),
    },
    {
      id: 'nav-clusters',
      title: 'Clusters (Root Cause Issues)',
      category: 'Navigation',
      subtitle: 'Grouped error clusters and stack traces',
      icon: <Layers className="w-4 h-4 text-brand-400" />,
      action: () => onNavigate('clusters'),
    },
    {
      id: 'nav-feed',
      title: 'Live Error Stream',
      category: 'Navigation',
      subtitle: 'Real-time snapping demo feed',
      icon: <Radio className="w-4 h-4 text-rose-400" />,
      action: () => onNavigate('feed'),
    },
    {
      id: 'nav-map',
      title: '2D Embedding Map',
      category: 'Navigation',
      subtitle: 'UMAP vector scatter plot of 600 errors',
      icon: <MapPin className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigate('map'),
    },
    {
      id: 'nav-eval',
      title: 'Clustering Evaluation Benchmarks',
      category: 'Navigation',
      subtitle: 'Empirical comparison: Sentry vs Faultline DBSCAN',
      icon: <BarChart2 className="w-4 h-4 text-cyan-400" />,
      action: () => onNavigate('evaluation'),
    },
    {
      id: 'nav-releases',
      title: 'Releases & Deploy Timeline',
      category: 'Navigation',
      subtitle: 'Correlate error spikes with code releases',
      icon: <GitCommit className="w-4 h-4 text-amber-400" />,
      action: () => onNavigate('releases'),
    },
    {
      id: 'nav-settings',
      title: 'Settings & SDK Snippets',
      category: 'Navigation',
      subtitle: 'API keys, parameters & documentation',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => onNavigate('settings'),
    },
    {
      id: 'act-spike',
      title: 'Simulate Bad Deployment Spike',
      category: 'Actions',
      subtitle: 'Trigger 48-error surge on Payment Gateway (RC-2)',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      action: () => {
        onTriggerSpike();
        onClose();
      },
    },
    {
      id: 'act-theme',
      title: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`,
      category: 'Actions',
      icon: isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'act-copy',
      title: copiedKey ? 'API Key Copied!' : 'Copy Project API Key',
      category: 'Actions',
      subtitle: 'fl_live_9f8e7d6c5b4a...',
      icon: copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />,
      action: handleCopyKey,
    },
  ];

  // Add cluster items
  const clusterItems: CommandItem[] = clusters.map((c) => ({
    id: `cluster-${c.id}`,
    title: `${c.id}: ${c.title}`,
    category: 'Clusters',
    subtitle: `${c.error_count} errors • ${c.exception_type}`,
    icon: <Layers className="w-4 h-4 text-brand-400" />,
    action: () => onNavigate('cluster-detail', c.id),
  }));

  const allItems = [...baseItems, ...clusterItems];

  const filteredItems = query
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0E121A] border border-dark-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-dark-border gap-3 bg-[#111622]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search clusters... (↑↓ to navigate, ↵ to select)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-dark-border/20">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              No matching commands or clusters found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-500/15 text-white' : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-slate-200 flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-800">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight className="w-3.5 h-3.5 text-brand-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#090C12] border-t border-dark-border flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Faultline Command Menu</span>
          </div>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
