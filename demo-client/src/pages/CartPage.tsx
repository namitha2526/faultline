import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, Tag, Zap, AlertCircle } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { triggerMissingPriceViaCart } from "../bugs/bug3MissingField";
import { triggerStockMismatchViaQty } from "../bugs/bug5StockMismatch";
import { triggerCouponUnreachableViaApply, triggerCouponUnreachableViaRemove } from "../bugs/bug6CouponService";

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotal,
    couponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
  } = useShop();

  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    setIsApplying(true);
    setCouponMessage(null);

    // If user enters "ERROR" or "CRASH", trigger the real Third-Party Coupon Bug!
    if (couponInput.toUpperCase() === "CRASH" || couponInput.toUpperCase() === "FAIL") {
      try {
        triggerCouponUnreachableViaApply();
      } catch {
        // Logged
      }
      setIsApplying(false);
      setCouponMessage("Promotions RPC service unreachable (error logged in Faultline)");
      return;
    }

    const success = await applyCoupon(couponInput);
    setIsApplying(false);
    if (success) {
      setCouponMessage("Coupon applied successfully!");
      setCouponInput("");
    } else {
      setCouponMessage("Invalid coupon code. Try FAULTLINE10 or SUMMER25");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your bag is empty</h2>
        <p className="text-sm text-slate-500">
          Discover our curated collection of workspace audio and accessories.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping Bag</h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-slate-400 hover:text-red-600 transition"
        >
          Clear Bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center space-x-4"
            >
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.product.category}
                </span>
                <Link
                  to={`/product/${item.product.id}`}
                  className="block font-semibold text-sm text-slate-900 hover:text-indigo-600 transition truncate"
                >
                  {item.product.name}
                </Link>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  £{item.product.price.toFixed(2)}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
                >
                  -
                </button>
                <span className="px-2 py-1 text-xs font-mono font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold text-xs"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Bug Trigger Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">Cart Deliberate Triggers:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  try {
                    triggerMissingPriceViaCart();
                  } catch {}
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-600 transition"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Undefined Price in Cart</span>
              </button>
              <button
                onClick={() => {
                  try {
                    triggerStockMismatchViaQty();
                  } catch {}
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-600 transition"
              >
                <Zap className="w-3 h-3 text-red-500" />
                <span>Qty Stock Mismatch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Order Summary</h3>

            {/* Coupon Code Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">Promo Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. FAULTLINE10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono uppercase"
                />
                <button
                  type="submit"
                  disabled={isApplying}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-medium transition"
                >
                  {isApplying ? "..." : "Apply"}
                </button>
              </div>
              {couponMessage && (
                <p className="text-[11px] text-slate-500">{couponMessage}</p>
              )}
            </form>

            {couponCode && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono font-bold">{couponCode}</span>
                  <span>(-£{couponDiscount.toFixed(2)})</span>
                </div>
                <button
                  onClick={async () => {
                    await removeCoupon();
                  }}
                  className="text-emerald-700 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>£{cartSubtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-£{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping (Royal Mail Tracked 24)</span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>£{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-indigo-600/20"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

