import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, User, ShieldAlert, Sparkles, LogOut, CheckCircle2, Zap, Flame, AlertCircle } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useControlPanel } from "../context/ControlPanelContext";
import { MOCK_USERS } from "../mock/users";
import { injectDemoException, injectSpikeErrors } from "../bugs/injectError";

export const Navbar: React.FC = () => {
  const { cart, currentUser, setCurrentUser } = useShop();
  const { toggleOpen, activeRelease, simulationState } = useControlPanel();
  const navigate = useNavigate();
  const location = useLocation();
  const [injectedToast, setInjectedToast] = useState<{ message: string; sub: string } | null>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleInjectError = () => {
    const res = injectDemoException();
    setInjectedToast({
      message: `${res.exceptionType}: ${res.message.slice(0, 60)}...`,
      sub: `${res.bugName} • Captured by Faultline SDK & ingested`,
    });
    setTimeout(() => setInjectedToast(null), 4000);
  };

  const handleInjectSpike = async () => {
    setInjectedToast({
      message: "Spike Triggered: 5 consecutive Payment Timeout errors",
      sub: "Exceeds 5 errors / 15m threshold -> Spiking cluster alert",
    });
    await injectSpikeErrors();
    setTimeout(() => setInjectedToast(null), 4000);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Toast Notification when error injected */}
      {injectedToast && (
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-indigo-950 text-white px-4 py-2 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 border-b border-rose-500/30">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-bold text-rose-200 font-mono text-[11px]">{injectedToast.message}</span>
              <span className="text-[10px] text-slate-300">({injectedToast.sub})</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner indicating Faultline SDK Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                simulationState.isBadDeployActive ? "bg-red-400" : "bg-emerald-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                simulationState.isBadDeployActive ? "bg-red-500" : "bg-emerald-500"
              }`}></span>
            </span>
            <span className="font-medium text-white">Faultline SDK Active</span>
            <span className="text-slate-500">•</span>
            <span>Rel: <strong className="text-indigo-300">{activeRelease}</strong></span>
            {simulationState.isBadDeployActive && (
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono text-[10px] animate-pulse">
                BAD DEPLOYMENT SPIKE
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleInjectError}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-[10px] shadow-sm transition active:scale-95"
              title="Click to inject an actual runtime exception into ShopDemo"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Inject Error</span>
            </button>
            <button
              onClick={handleInjectSpike}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[10px] font-semibold transition active:scale-95"
              title="Inject 5 errors to trigger spike detection"
            >
              <Flame className="w-2.5 h-2.5 text-rose-400" />
              <span>Inject Spike (5x)</span>
            </button>
            <button
              onClick={toggleOpen}
              className="flex items-center space-x-1 text-indigo-300 hover:text-white transition font-medium"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Open Demo Control Panel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ShopDemo</span>
            <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              Faultline Protected
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <Link
            to="/"
            className={`transition hover:text-indigo-600 ${
              location.pathname === "/" ? "text-indigo-600 font-semibold" : ""
            }`}
          >
            Store
          </Link>
          <Link
            to="/dashboard"
            className={`transition hover:text-indigo-600 ${
              location.pathname === "/dashboard" ? "text-indigo-600 font-semibold" : ""
            }`}
          >
            Orders & Tracking
          </Link>
          <Link
            to="/profile"
            className={`transition hover:text-indigo-600 ${
              location.pathname === "/profile" ? "text-indigo-600 font-semibold" : ""
            }`}
          >
            Account
          </Link>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-4">
          {/* User Profile Switcher */}
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 transition p-1.5 pr-3 rounded-full">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
              />
              <Link to="/profile" className="text-xs font-semibold text-slate-800 hover:text-indigo-600 max-w-[100px] truncate">
                {currentUser.name.split(" ")[0]}
              </Link>
              <button
                onClick={() => setCurrentUser(null)}
                title="Sign out (simulate null user bug)"
                className="text-slate-400 hover:text-red-500 ml-1 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
          )}

          {/* Inject Error Button */}
          <button
            onClick={handleInjectError}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-rose-500/20 active:scale-95 transition-all"
            title="Inject an actual runtime exception into ShopDemo"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Inject Error</span>
          </button>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

