import React from "react";
import { Package, Truck, CheckCircle2, Clock, Zap } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { triggerJsonParseViaOrders } from "../bugs/bug4JsonParse";
import { triggerMissingPriceViaOrderSummary } from "../bugs/bug3MissingField";

export const DashboardPage: React.FC = () => {
  const { orders } = useShop();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case "In Transit":
        return (
          <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <Truck className="w-3 h-3" />
            <span>In Transit</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order History & Tracking</h1>
          <p className="text-xs text-slate-500">Live order status and dispatch information</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              try {
                triggerJsonParseViaOrders();
              } catch {}
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition"
          >
            <Zap className="w-3 h-3 text-red-600" />
            <span>Corrupt Order JSON (Bug 4)</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                <span className="text-[11px] text-slate-400 block">{order.date}</span>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(order.status)}
                <span className="font-bold text-sm text-slate-900">£{order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 text-xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-800 block truncate">{item.name}</span>
                    <span className="text-slate-400">Qty: {item.quantity} × £{item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">Tracking: {order.trackingNumber}</span>
              <button
                onClick={() => {
                  try {
                    triggerMissingPriceViaOrderSummary();
                  } catch {}
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800"
              >
                Inspect Invoice Breakdown
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

