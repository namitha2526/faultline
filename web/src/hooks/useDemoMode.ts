import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import { feedManager } from '../lib/api/feedSocket';

export function useDemoMode() {
  const queryClient = useQueryClient();
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(true);
  const [isSpikeActive, setIsSpikeActive] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSpikeActive(apiClient.isSpikeActive());
  }, []);

  const toggleDemo = () => {
    if (isDemoRunning) {
      feedManager.pause();
      setIsDemoRunning(false);
    } else {
      feedManager.play();
      setIsDemoRunning(true);
    }
  };

  const triggerBadDeploy = (activate?: boolean) => {
    const nextState = activate !== undefined ? activate : !isSpikeActive;
    const res = apiClient.triggerBadDeploy(nextState);
    setIsSpikeActive(res.is_active);

    if (res.is_active) {
      setAlertMessage('CRITICAL ALERT: Release v2.5.0-canary triggered 48 new errors in "Payment Gateway Timeout" (RC-2)! Compression maintained at 75x.');
      feedManager.setSpeed(5);
    } else {
      setAlertMessage(null);
      feedManager.setSpeed(1);
    }

    queryClient.invalidateQueries({ queryKey: ['clusters'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
  };

  const dismissAlert = () => {
    setAlertMessage(null);
  };

  return {
    isDemoRunning,
    isSpikeActive,
    alertMessage,
    toggleDemo,
    triggerBadDeploy,
    dismissAlert,
  };
}
