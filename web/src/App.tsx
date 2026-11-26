import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ClustersPage } from './pages/ClustersPage';
import { ClusterDetailPage } from './pages/ClusterDetailPage';
import { LiveFeedPage } from './pages/LiveFeedPage';
import { EmbeddingMapPage } from './pages/EmbeddingMapPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ScreenId } from './types';
import { feedManager } from './lib/api/feedSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const qc = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Global live updates: invalidate queries in real-time when WebSocket events arrive
  useEffect(() => {
    const unsub = feedManager.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ['clusters'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      if (event.target_cluster_id) {
        qc.invalidateQueries({ queryKey: ['cluster', event.target_cluster_id] });
      }
    });
    return () => unsub();
  }, [qc]);

  const handleSelectScreen = (screen: ScreenId, clusterId?: string) => {
    if (clusterId) {
      setSelectedClusterId(clusterId);
      setCurrentScreen('cluster-detail');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleOpenClusterDetail = (id: string) => {
    setSelectedClusterId(id);
    setCurrentScreen('cluster-detail');
  };

  return (
    <AppLayout
      currentScreen={currentScreen}
      onSelectScreen={handleSelectScreen}
      selectedClusterId={selectedClusterId}
    >
      {currentScreen === 'overview' && (
        <OverviewPage
          onNavigate={handleSelectScreen}
          onTriggerSpike={() => {}}
          isSpikeActive={false}
        />
      )}

      {currentScreen === 'clusters' && (
        <ClustersPage onSelectCluster={handleOpenClusterDetail} />
      )}

      {currentScreen === 'cluster-detail' && selectedClusterId && (
        <ClusterDetailPage
          clusterId={selectedClusterId}
          onBack={() => setCurrentScreen('clusters')}
          onSelectCluster={handleOpenClusterDetail}
        />
      )}

      {currentScreen === 'feed' && (
        <LiveFeedPage
          onSelectCluster={handleOpenClusterDetail}
          onTriggerSpike={() => {}}
          isSpikeActive={false}
        />
      )}

      {currentScreen === 'map' && (
        <EmbeddingMapPage onSelectCluster={handleOpenClusterDetail} />
      )}

      {currentScreen === 'evaluation' && <EvaluationPage />}

      {currentScreen === 'releases' && (
        <ReleasesPage
          onNavigate={handleSelectScreen}
          onTriggerSpike={() => {}}
          isSpikeActive={false}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsPage isDark={true} onToggleTheme={() => {}} />
      )}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
