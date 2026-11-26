import React from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { MOCK_USERS } from "../mock/users";
import { triggerNullUserViaAuth } from "../bugs/bug1NullUser";

export const LoginPage: React.FC = () => {
  const { currentUser, setCurrentUser } = useShop();
  const navigate = useNavigate();

  const handleSelectUser = (user: any) => {
    setCurrentUser(user);
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Select British Demo Persona</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Switching personas demonstrates how Faultline hashes user IDs via SHA-256 for privacy while retaining user impact counts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MOCK_USERS.map((user) => {
          const isSelected = currentUser?.id === user.id;
          return (
            <div
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={`cursor-pointer bg-white rounded-2xl p-5 border text-center transition flex flex-col items-center justify-between space-y-3 ${
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-600 shadow-md"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                <p className="text-[11px] text-slate-500">{user.role}</p>
                <p className="text-[10px] text-indigo-600 font-medium">{user.city}, UK</p>
              </div>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {user.tier} Tier
              </span>
            </div>
          );
        })}
      </div>

      {/* Deliberate Auth Bug Trigger */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Deliberate Bug 1 Path A (Null User in Auth Callback):</span>
          </div>
          <button
            onClick={() => {
              try {
                triggerNullUserViaAuth();
              } catch {}
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Trigger Null User via Auth</span>
          </button>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Throws <code>TypeError: Cannot read properties of null (reading 'name')</code> inside <code>handleAuthCallback()</code>.
        </p>
      </div>
    </div>
  );
};

