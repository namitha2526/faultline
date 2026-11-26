import React, { useState } from 'react';
import {
  Settings,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Code,
  Sliders,
  Cpu,
  Moon,
  Sun,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface SettingsPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ isDark, onToggleTheme }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [selectedSdkTab, setSelectedSdkTab] = useState<'js' | 'python'>('js');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // ML Clustering Parameters state
  const [eps, setEps] = useState<number>(0.22);
  const [minSamples, setMinSamples] = useState<number>(2);
  const [model, setModel] = useState<string>('all-MiniLM-L6-v2');
  const [savedSettings, setSavedSettings] = useState(false);

  const apiKey = 'fl_live_9f8e7d6c5b4a_demo_key_77a';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const jsSnippet = `// Install via: npm install @faultline/browser
import { initFaultline } from '@faultline/browser';

initFaultline({
  dsn: 'https://${apiKey}@ingest.faultline.io/600',
  environment: 'production',
  release: 'v2.5.0',
  tracesSampleRate: 1.0,
});`;

  const pythonSnippet = `# Install via: pip install faultline-python
import faultline

faultline.init(
    dsn="https://${apiKey}@ingest.faultline.io/600",
    environment="production",
    release="v2.5.0",
    cluster_threshold_eps=0.22,
)`;

  const activeSnippet = selectedSdkTab === 'js' ? jsSnippet : pythonSnippet;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleSaveParams = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Project Settings & Integration</span>
          <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
            production-api
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage API keys, client SDK setup snippets, and vector clustering hyperparameters.
        </p>
      </div>

      {/* Section 1: Project API Key */}
      <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Project Ingestion API Key</h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Active • Ingestion Rate 500 req/s
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Authenticate client SDKs and REST ingestion endpoints with this project key.
        </p>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0E14] border border-dark-border font-mono text-xs">
          <span className="flex-1 text-slate-300 tracking-wider">
            {showKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
          </span>

          <button
            onClick={() => setShowKey(!showKey)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
          >
            {copiedKey ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Key</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 2: SDK Installation & Snippet */}
      <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-white">SDK Quickstart Installation</h2>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center bg-[#090C12] border border-dark-border rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setSelectedSdkTab('js')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedSdkTab === 'js'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              JavaScript / TypeScript
            </button>
            <button
              onClick={() => setSelectedSdkTab('python')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedSdkTab === 'python'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
          </div>
        </div>

        {/* Code Snippet Block */}
        <div className="relative rounded-xl bg-[#090C12] border border-dark-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#0E121A] border-b border-dark-border text-[11px] font-mono text-slate-400">
            <span>{selectedSdkTab === 'js' ? 'index.ts' : 'main.py'}</span>
            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-mono"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
            {activeSnippet}
          </pre>
        </div>
      </div>

      {/* Section 3: Machine Learning Clustering Hyperparameters */}
      <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Vector Clustering Parameters</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">DBSCAN + Centroid Matching</span>
        </div>
        <p className="text-xs text-slate-400">
          Fine-tune the distance threshold (eps) and transformer embedding model. Changes take effect on next incremental match.
        </p>

        <div className="space-y-4 pt-1">
          {/* Distance Threshold (eps) Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Distance Threshold (eps):</span>
              <span className="text-brand-400 font-bold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                {eps.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.01"
              value={eps}
              onChange={(e) => setEps(parseFloat(e.target.value))}
              aria-label="Distance Threshold"
              className="w-full accent-brand-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.10 (Stricter, more clusters)</span>
              <span>0.22 (Empirical Optimum)</span>
              <span>0.40 (Looser, merges issues)</span>
            </div>
          </div>

          {/* Model Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-mono block">
              Sentence Transformer Model:
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Sentence Transformer Model"
              className="w-full bg-[#0D111A] text-slate-200 border border-dark-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="all-MiniLM-L6-v2">
                all-MiniLM-L6-v2 (Recommended: 384-D, 18ms latency, 100% F1)
              </option>
              <option value="bge-small-en-v1.5">
                bge-small-en-v1.5 (HuggingFace: 384-D, 24ms latency)
              </option>
              <option value="text-embedding-3-small">
                text-embedding-3-small (OpenAI Cloud API: 1536-D, 85ms latency)
              </option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-between">
            {savedSettings ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Parameters updated and centroids recalibrated!
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={handleSaveParams}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Clustering Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Theme Settings */}
      <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-3 shadow-md">
        <h2 className="text-sm font-semibold text-white">Appearance & Display</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-200">Theme Mode</div>
            <div className="text-[11px] text-slate-400">
              Toggle between high-contrast Dark mode and Clean Slate Light mode
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E121A] border border-dark-border hover:border-dark-borderHighlight text-xs text-slate-200 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-400" />}
            <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
