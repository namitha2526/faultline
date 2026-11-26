import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DemoBanner } from './DemoBanner';
import { CommandPalette } from '../common/CommandPalette';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useClusters } from '../../hooks/useClusters';
import { ScreenId } from '../../types';

interface AppLayoutProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId, clusterId?: string) => void;
  selectedClusterId: string | null;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentScreen,
  onSelectScreen,
  selectedClusterId,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const {
    isDemoRunning,
    isSpikeActive,
    alertMessage,
    toggleDemo,
    triggerBadDeploy,
    dismissAlert,
  } = useDemoMode();

  const { data: clusters = [] } = useClusters();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const spikingCount = clusters.filter((c) => c.is_spiking).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDark ? 'dark bg-[#0B0D12] text-slate-100' : 'light bg-slate-50 text-slate-900'}`}>
      {/* Top Navbar */}
      <Navbar
        activeScreen={currentScreen}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isDemoRunning={isDemoRunning}
        isSpikeActive={isSpikeActive}
        onToggleDemo={toggleDemo}
        onTriggerSpike={() => triggerBadDeploy()}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Bad Deployment Simulation Alert Banner */}
      <DemoBanner
        message={alertMessage}
        onDismiss={dismissAlert}
        onRevert={() => triggerBadDeploy(false)}
        onNavigateToSpike={() => onSelectScreen('cluster-detail', 'RC-2')}
      />

      {/* Main Content Viewport + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onSelectScreen={(s) => onSelectScreen(s)}
          clusterCount={clusters.length}
          spikeCount={spikingCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(screen, cId) => {
          onSelectScreen(screen, cId);
          setIsCommandPaletteOpen(false);
        }}
        clusters={clusters}
        onTriggerSpike={() => triggerBadDeploy()}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />
    </div>
  );
};
