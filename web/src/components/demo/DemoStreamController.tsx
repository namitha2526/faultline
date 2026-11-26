import React, { useState, useEffect } from 'react';
import { Play, Square, Zap, Gauge, Radio } from 'lucide-react';
import { api } from '../../services/api';
import { DemoStatus } from '../../types/api';

interface DemoStreamControllerProps {
  onEventIngested?: () => void;
}

export const DemoStreamController: React.FC<DemoStreamControllerProps> = () => {
  const [status, setStatus] = useState<DemoStatus>({
    is_running: false,
    speed: 2.0,
    spike_active: false,
    spike_root_cause: 'RC-2',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getDemoStatus();
      setStatus(data);
    } catch (e) {
      // Backend maybe initializing
    }
  };

  const handleTogglePlay = async () => {
    setLoading(true);
    try {
      if (status.is_running) {
        await api.stopDemo();
      } else {
        await api.startDemo(status.speed, status.spike_active);
      }
      await loadStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    try {
      await api.setDemoSpeed(newSpeed);
      setStatus((prev) => ({ ...prev, speed: newSpeed }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerSpike = async () => {
    setLoading(true);
    try {
      if (!status.is_running) {
        await api.startDemo(status.speed, true);
      } else {
        await api.triggerDemoSpike('RC-2');
      }
      setStatus((prev) => ({ ...prev, spike_active: true, is_running: true }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md">
      {/* Live Stream Indicator */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
        <span className="relative flex h-2.5 w-2.5">
          {status.is_running && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.spike_active ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.is_running ? (status.spike_active ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-600'}`} />
        </span>
        <span className="text-xs font-semibold text-slate-300">
          {status.is_running ? (status.spike_active ? 'SPIKE REPLAY' : 'STREAMING') : 'STANDBY'}
        </span>
      </div>

      {/* Start / Stop Button */}
      <button
        onClick={handleTogglePlay}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
          status.is_running
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
        }`}
      >
        {status.is_running ? (
          <>
            <Square className="w-3 h-3 fill-current" /> Stop Stream
          </>
        ) : (
          <>
            <Play className="w-3 h-3 fill-current" /> Start Replay
          </>
        )}
      </button>

      {/* Speed Selector */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80 text-xs text-slate-400">
        <Gauge className="w-3 h-3 ml-1.5 text-slate-500" />
        {[1, 2, 5, 10].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
            className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              Math.round(status.speed) === s
                ? 'bg-indigo-600 text-white font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Trigger Bad Deployment Spike Button */}
      <button
        onClick={handleTriggerSpike}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          status.spike_active
            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
        }`}
        title="Simulate a broken production release causing a rapid surge in Gateway Timeouts"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        Bad Deploy Spike
      </button>
    </div>
  );
};
