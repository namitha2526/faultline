import React from "react";
import { User, MapPin, Mail, Award, Zap, ShieldAlert } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { triggerNullUserViaProfile } from "../bugs/bug1NullUser";

export const ProfilePage: React.FC = () => {
  const { currentUser } = useShop();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Not Signed In</h2>
        <p className="text-xs text-slate-500">Sign in as a demo user to view account details.</p>
        <button
          onClick={() => {
            try {
              triggerNullUserViaProfile();
            } catch {}
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulate Unauthenticated Profile Crash</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-50"
          />
          <div className="text-center sm:text-left flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                {currentUser.tier} Member
              </span>
            </div>
            <p className="text-xs text-slate-500">{currentUser.role}</p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.city}, {currentUser.postcode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliberate Profile Bug Trigger */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Simulate Bug 1 Path B (Null User in Profile Header)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Calls <code>buildUserGreeting()</code> with null user, testing Faultline's semantic clustering.
            </p>
          </div>
          <button
            onClick={() => {
              try {
                triggerNullUserViaProfile();
              } catch {}
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition shadow-2xs whitespace-nowrap"
          >
            Trigger Profile Bug
          </button>
        </div>
      </div>
    </div>
  );
};

