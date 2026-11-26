import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, RefreshCw, Github } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="text-lg font-bold text-white tracking-tight">ShopDemo</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Believable UK mock e-commerce storefront instrumented with the <strong>Faultline SDK</strong>. Demonstrates clustering errors by root cause rather than brittle stack hashes.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Faultline Resilient SDK 1.4.x</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Shop Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-white transition">Product Catalog (12 items)</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Shopping Cart & Coupons</Link></li>
              <li><Link to="/checkout" className="hover:text-white transition">Checkout & Payments</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition">Order History</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Faultline Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300">Semantic Clustering:</span> pgvector 384-D</li>
              <li><span className="text-slate-300">Hash Baseline:</span> Sentry-style frames</li>
              <li><span className="text-slate-300">Telemetry:</span> 3s Batch Flush</li>
              <li><span className="text-slate-300">Privacy:</span> SHA-256 ID + PII Scrubbing</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Demo Controls</h4>
            <p className="text-xs text-slate-400 mb-3">
              Click the floating bug icon on the bottom right to trigger deliberate errors across 6 real root causes.
            </p>
            <div className="inline-flex items-center text-xs font-medium text-indigo-400 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-800/60">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              6 Root Causes • 16 Call Paths
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 ShopDemo for Faultline. Designed for high-fidelity error intelligence demos.</p>
          <p className="mt-2 sm:mt-0">British Demo Personas: Oliver Hughes, Charlotte Reed, Harry Bennett</p>
        </div>
      </div>
    </footer>
  );
};

