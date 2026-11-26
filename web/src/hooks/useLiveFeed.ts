import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LiveStreamEvent } from '../types';
import { feedManager, SpeedMultiplier } from '../lib/api/feedSocket';

export function useLiveFeed(bufferSize: number = 40) {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<LiveStreamEvent[]>([]);
  const [status, setStatus] = useState<'connected' | 'simulating' | 'paused' | 'disconnected'>('simulating');
  const [isPlaying, setIsPlaying] = useState<boolean>(feedManager.getIsPlaying());
  const [speed, setSpeedState] = useState<SpeedMultiplier>(feedManager.getSpeed());
  const [activeSnappedClusterId, setActiveSnappedClusterId] = useState<string | null>(null);
  const [totalStreamedCount, setTotalStreamedCount] = useState<number>(0);

  useEffect(() => {
    const unsubFeed = feedManager.subscribe((event) => {
      setEvents((prev) => [event, ...prev.slice(0, bufferSize - 1)]);
      setActiveSnappedClusterId(event.target_cluster_id);
      setTotalStreamedCount((c) => c + 1);

      // Invalidate queries so right-hand cluster grid updates immediately
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });

      // Reset snap highlight after 900ms
      setTimeout(() => {
        setActiveSnappedClusterId((current) => (current === event.target_cluster_id ? null : current));
      }, 900);
    });

    const unsubStatus = feedManager.onStatus((st) => {
      setStatus(st);
      setIsPlaying(st !== 'paused');
    });

    return () => {
      unsubFeed();
      unsubStatus();
    };
  }, [bufferSize]);

  const togglePlay = () => {
    if (isPlaying) {
      feedManager.pause();
      setIsPlaying(false);
    } else {
      feedManager.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = (s: SpeedMultiplier) => {
    feedManager.setSpeed(s);
    setSpeedState(s);
  };

  const injectError = (targetClusterId?: string) => {
    return feedManager.injectError(targetClusterId);
  };

  return {
    events,
    status,
    isPlaying,
    speed,
    activeSnappedClusterId,
    totalStreamedCount,
    togglePlay,
    changeSpeed,
    injectError,
  };
}
