import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { ProductCard } from "../components/ProductCard";
import { useControlPanel } from "../context/ControlPanelContext";
import { triggerJsonParseViaProducts } from "../bugs/bug4JsonParse";

export const HomePage: React.FC = () => {
  const { products } = useShop();
  const { toggleOpen } = useControlPanel();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Audio", "Workspace", "Wearables", "Accessories"];

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Demo Storefront</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Curated workspace gear, instrumented with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300">
              Faultline Intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Explore 12 studio-grade audio and desk essentials. Behind this shop, the embedded Faultline SDK captures errors, flushes telemetry, and groups disjoint stack traces by <strong>semantic meaning</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={toggleOpen}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              <Zap className="w-4 h-4" />
              <span>Open Demo Control Panel</span>
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
            >
              <span>View Orders & Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative Grid Glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 top-12 opacity-10 hidden lg:block">
          <Shield className="w-72 h-72 text-indigo-400" />
        </div>
      </section>

      {/* Category Pills & Quick Bug Test */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Quick Test:</span>
          <button
            onClick={() => {
              try {
                triggerJsonParseViaProducts();
              } catch {
                // Caught
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium transition"
          >
            <Zap className="w-3 h-3 text-red-600" />
            <span>Simulate 502 HTML Error</span>
          </button>
        </div>
      </section>

      {/* Product Grid (12 Items) */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

