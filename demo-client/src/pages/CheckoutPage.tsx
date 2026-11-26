import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CreditCard, Wallet, Smartphone, ShieldCheck, ArrowLeft, Zap, CheckCircle2 } from "lucide-react";
import { useShop } from "../context/ShopContext";
import {
  triggerCardPaymentTimeout,
  triggerUpiPaymentTimeout,
  triggerWalletPaymentTimeout,
} from "../bugs/bug2PaymentTimeout";
import { triggerNullUserViaCheckout } from "../bugs/bug1NullUser";
import { triggerStockMismatchViaCheckout } from "../bugs/bug5StockMismatch";

type PaymentMethod = "card" | "upi" | "wallet";

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, currentUser, placeOrder } = useShop();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const order = await placeOrder(paymentMethod);
      setCompletedOrder(order);
    } catch {
      // Handled
    } finally {
      setIsProcessing(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-6 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Thank you for your order!</h2>
        <p className="text-sm text-slate-600">
          Order <strong>{completedOrder.id}</strong> has been confirmed. Confirmation sent to {currentUser?.email || "customer@example.co.uk"}.
        </p>
        <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
          <div>Tracking Number: <strong className="font-mono text-slate-900">{completedOrder.trackingNumber}</strong></div>
          <div>Total Paid: <strong>£{completedOrder.total.toFixed(2)}</strong></div>
        </div>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
          >
            View in Dashboard
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link
        to="/cart"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Shipping & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Greeting */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">1. Customer & Delivery Address</h2>
              <button
                onClick={() => {
                  try {
                    triggerNullUserViaCheckout();
                  } catch {}
                }}
                className="text-[11px] text-amber-600 hover:text-amber-800 font-medium flex items-center space-x-1"
              >
                <Zap className="w-3 h-3" />
                <span>Simulate Null Customer Greeting</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser ? currentUser.name : "Oliver Hughes"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={currentUser ? currentUser.email : "oliver.hughes@faultlineshop.co.uk"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1 font-medium">Street Address</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser ? `14 Clink Street, ${currentUser.city}` : "14 Clink Street, London"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">2. Payment Method</h2>
              <span className="text-xs text-slate-400">256-Bit SSL Encrypted</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === "card"
                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === "upi"
                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === "wallet"
                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Wallet className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Digital Wallet</span>
              </button>
            </div>

            {/* Deliberate Payment Timeout Triggers */}
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs space-y-2">
              <div className="font-semibold text-amber-900 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate Real Gateway Timeout (Bug 2):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      triggerCardPaymentTimeout();
                    } catch {}
                  }}
                  className="bg-white hover:bg-amber-100/50 border border-amber-300 rounded-lg p-1.5 text-[11px] font-medium text-amber-800 transition"
                >
                  Card Gateway Timeout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      triggerUpiPaymentTimeout();
                    } catch {}
                  }}
                  className="bg-white hover:bg-amber-100/50 border border-amber-300 rounded-lg p-1.5 text-[11px] font-medium text-amber-800 transition"
                >
                  UPI VPA Timeout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      triggerWalletPaymentTimeout();
                    } catch {}
                  }}
                  className="bg-white hover:bg-amber-100/50 border border-amber-300 rounded-lg p-1.5 text-[11px] font-medium text-amber-800 transition"
                >
                  Wallet Provider Timeout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Checkout Summary</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-xs">
                  <span className="truncate pr-2 text-slate-600">{item.product.name} × {item.quantity}</span>
                  <span className="font-semibold text-slate-900">£{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base font-bold text-slate-900">
              <span>Total Payable</span>
              <span>£{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-emerald-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isProcessing ? "Processing..." : `Pay £${cartTotal.toFixed(2)}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

