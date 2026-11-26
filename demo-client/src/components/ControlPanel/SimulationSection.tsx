import React from "react";
import { useControlPanel } from "../../context/ControlPanelContext";
import { Flame, Play, Sparkles, StopCircle, Radio, Zap } from "lucide-react";
import { injectDemoException, injectSpikeErrors } from "../../bugs/injectError";

export const SimulationSection: React.FC = () => {
  const {
    startBurst,
    startBadDeployment,
    stopSimulations,
    simulationState,
    activeRelease,
  } = useControlPanel();

  const isSimulating = simulationState.isBursting || simulationState.isBadDeployActive;

  return (
    <div className="space-y-4">
      {/* Inject Single Error */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">Inject Single Runtime Error</h4>
              <p className="text-[11px] text-slate-500">Throws actual JS exception, captured by SDK & sent to backend</p>
            </div>
          </div>
          <button
            onClick={() => injectDemoException()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
          >
            Inject Error
          </button>
        </div>
      </div>

      {/* Inject Spike (5x) */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">Inject Spike (5x Threshold)</h4>
              <p className="text-[11px] text-slate-500">Fires 5 errors in same root cause to trigger cluster spike alert</p>
            </div>
          </div>
          <button
            onClick={() => injectSpikeErrors()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
          >
            Inject Spike
          </button>
        </div>
      </div>

      {/* Burst: 50 errors in 10s */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">Traffic Burst Simulation</h4>
              <p className="text-[11px] text-slate-500">50 errors across multiple bugs over 10 seconds</p>
            </div>
          </div>
          {simulationState.isBursting ? (
            <button
              onClick={stopSimulations}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={startBurst}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              Start 50-Error Burst
            </button>
          )}
        </div>

        {simulationState.isBursting && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Streaming errors...</span>
              <span className="font-mono font-medium">{simulationState.burstProgress} / {simulationState.burstTotal}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 transition-all duration-200"
                style={{
                  width: `${(simulationState.burstProgress / simulationState.burstTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bad Deployment Spike */}
      <div className="p-3.5 bg-gradient-to-br from-red-50/70 to-rose-50/30 border border-red-200 rounded-xl shadow-2xs">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-950">Simulate Bad Deployment Release</h4>
              <p className="text-[11px] text-red-700/80">
                Switches release to <strong>1.4.3</strong> & surges 20 payment timeout errors in 15s
              </p>
            </div>
          </div>
          {simulationState.isBadDeployActive ? (
            <button
              onClick={stopSimulations}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Halt Spike</span>
            </button>
          ) : (
            <button
              onClick={startBadDeployment}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              Bad Deployment (1.4.3)
            </button>
          )}
        </div>

        {simulationState.isBadDeployActive && (
          <div className="mt-3 p-2 bg-red-100/80 rounded-lg text-[11px] text-red-900 flex items-center justify-between">
            <span className="font-medium animate-pulse">Spiking Release 1.4.3 Payment Errors...</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-red-700">
              {simulationState.badDeployCountdown}s left
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

