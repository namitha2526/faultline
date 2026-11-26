import React from "react";
import { useControlPanel } from "../../context/ControlPanelContext";
import { Globe, Tag, Laptop, Server } from "lucide-react";

export const SettingsSection: React.FC = () => {
  const {
    activeRelease,
    setActiveRelease,
    simulatedDevice,
    setSimulatedDevice,
  } = useControlPanel();

  const dsn = import.meta.env.VITE_FAULTLINE_URL || "http://localhost:8000";
  const apiKey = import.meta.env.VITE_FAULTLINE_KEY || "fl_demo_key_9f8e7d6c5b4a";

  return (
    <div className="space-y-4">
      {/* Release Selector */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-semibold text-slate-900">Application Release Version</h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Updates SDK release header sent with every captured error:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {["1.4.1", "1.4.2", "1.4.3"].map((rel) => (
            <button
              key={rel}
              onClick={() => setActiveRelease(rel)}
              className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                activeRelease === rel
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              v{rel}
            </button>
          ))}
        </div>
      </div>

      {/* Browser / OS Simulator */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
        <div className="flex items-center space-x-2">
          <Laptop className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-semibold text-slate-900">Simulate Browser & OS Telemetry</h4>
        </div>
        <p className="text-[11px] text-slate-500">
          Overrides client browser metadata so Faultline receives cross-platform telemetry from one test machine:
        </p>
        <select
          value={simulatedDevice}
          onChange={(e) => setSimulatedDevice(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <option value="Auto (Real Browser)">Auto (Use Current Machine UA)</option>
          <option value="Chrome (Windows)">Chrome 122 on Windows 11</option>
          <option value="Safari (iOS / iPhone)">Mobile Safari 17 on iPhone / iOS</option>
          <option value="Firefox (Ubuntu Linux)">Firefox 123 on Linux x86_64</option>
          <option value="Edge (Windows)">Microsoft Edge 122 on Windows 11</option>
        </select>
      </div>

      {/* Faultline Server Target */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-semibold text-slate-900">Connected Faultline Gateway</h4>
        </div>
        <div className="text-[11px] space-y-1 font-mono text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Endpoint:</span>
            <span className="text-slate-800 font-medium">{dsn}/api/errors</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">API Key:</span>
            <span className="text-slate-800 font-medium">{apiKey}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Batch Interval:</span>
            <span className="text-emerald-700 font-medium">3,000ms flush</span>
          </div>
        </div>
      </div>
    </div>
  );
};

