import React, { useState } from "react";
import { Bug, X, Zap, Radio, Terminal, Settings } from "lucide-react";
import { useControlPanel } from "../../context/ControlPanelContext";
import { BugTriggerSection } from "./BugTriggerSection";
import { SimulationSection } from "./SimulationSection";
import { SdkLogSection } from "./SdkLogSection";
import { SettingsSection } from "./SettingsSection";
import { sdkLogger } from "../../faultline";
import { injectDemoException } from "../../bugs/injectError";

type Tab = "bugs" | "simulate" | "logs" | "settings";

export const ControlPanel: React.FC = () => {
  const { isOpen, toggleOpen } = useControlPanel();
  const [activeTab, setActiveTab] = useState<Tab>("bugs");

  return (
    <>
      {/* Floating Action Button Bottom-Right */}
      <button
        onClick={toggleOpen}
        aria-label="Toggle Faultline Demo Control Panel"
        className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-200 group"
      >
        <Bug className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold tracking-wide uppercase pr-1">Demo Panel</span>
        {sdkLogger.capturedCount > 0 && (
          <span className="bg-white text-indigo-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-2xs">
            {sdkLogger.capturedCount}
          </span>
        )}
      </button>

      {/* Popover / Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[580px] animate-scale-up">
          {/* Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">Faultline Demo Console</h3>
                <p className="text-[10px] text-slate-400">Real-time error injection & SDK telemetry</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => injectDemoException()}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold transition shadow-xs active:scale-95"
                title="Inject actual error"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Inject Error</span>
              </button>
              <button
                onClick={toggleOpen}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setActiveTab("bugs")}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
                activeTab === "bugs"
                  ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Bugs</span>
            </button>

            <button
              onClick={() => setActiveTab("simulate")}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
                activeTab === "simulate"
                  ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Spike & Burst</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
                activeTab === "logs"
                  ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>SDK Log</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition ${
                activeTab === "settings"
                  ? "border-indigo-600 text-indigo-600 bg-white font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === "bugs" && <BugTriggerSection />}
            {activeTab === "simulate" && <SimulationSection />}
            {activeTab === "logs" && <SdkLogSection />}
            {activeTab === "settings" && <SettingsSection />}
          </div>
        </div>
      )}
    </>
  );
};

