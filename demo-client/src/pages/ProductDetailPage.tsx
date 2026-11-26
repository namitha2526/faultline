import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Check, ShoppingBag, ArrowLeft, ShieldCheck, Truck, Zap } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { triggerMissingPriceViaCard } from "../bugs/bug3MissingField";
import { triggerStockMismatchViaAdd } from "../bugs/bug5StockMismatch";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart } = useShop();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id) || products[0];
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
        {/* Product Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-sm">
              {product.category}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">{product.rating}</span>
              <span className="text-xs text-slate-400">({product.reviewsCount} customer reviews)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>

            <div className="text-2xl font-bold text-slate-900">
              £{product.price.toFixed(2)}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Specifications</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {product.specs.map((spec, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-bold font-mono text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${
                  added
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 hover:bg-indigo-600 text-white"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag (£{(product.price * quantity).toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>

            {/* Deliberate Bug Triggers for Demo */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">Faultline Demo Triggers:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    try {
                      triggerMissingPriceViaCard();
                    } catch {
                      // Handled
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-600 transition"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Undefined Price</span>
                </button>
                <button
                  onClick={() => {
                    try {
                      triggerStockMismatchViaAdd();
                    } catch {
                      // Handled
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-600 transition"
                >
                  <Zap className="w-3 h-3 text-red-500" />
                  <span>Out of Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

