import React, { useState } from 'react';
import {
  ShoppingCart,
  Bell,
  Building2,
  User,
  ArrowLeftRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';

export const Header: React.FC = () => {
  const {
    settings,
    cart,
    setActivePage,
    alerts,
    userRole,
    currentUser,
    setIsAuthModalOpen,
    logout
  } = usePharmacy();

  const [showNotifications, setShowNotifications] = useState(false);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs select-none">
      {/* Left: Pharmacy Name, Location & Live Status */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {userRole === 'customer' ? 'Aushadham Care' : (settings.pharmacyName || 'Apollo Pharmacy')}
            </h1>

            {/* Live Store Status indicator */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Store Live</span>
            </span>

            {/* Role indicator */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
              userRole === 'customer'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-teal-50 text-teal-700 border-teal-200'
            }`}>
              {userRole === 'customer' ? (
                <>
                  <User className="w-3 h-3 text-blue-600" />
                  <span>Patient</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3 h-3 text-teal-600" />
                  <span>Store Owner</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-slate-500 truncate max-w-md hidden sm:block">
            {userRole === 'customer'
              ? `${currentUser.address || 'Bengaluru Urban'}`
              : `${settings.pharmacyAddress || '100ft Road, Indiranagar, Bengaluru'}`}
          </p>
        </div>
      </div>

      {/* Right: Exactly 4 Clean Actions (Role Switch, Notifications, POS Shortcut, Exit) */}
      <div className="flex items-center gap-2.5">
        {/* 1. Single Switch Role Action */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 transition-all shadow-2xs"
          title="Switch User Role or Sign In"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">Switch Role</span>
        </button>

        {/* 2. Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900">Notifications ({alerts.length})</span>
                <span 
                  onClick={() => {
                    setShowNotifications(false);
                    setActivePage('overview');
                  }}
                  className="text-[10px] text-teal-600 font-bold cursor-pointer hover:underline"
                >
                  View Overview
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts.slice(0, 4).map((alt) => (
                  <div key={alt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>{alt.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{alt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. POS Shortcut (For Owner) */}
        {userRole === 'pharmacy_owner' && (
          <button
            onClick={() => setActivePage('pos_sales')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">POS</span>
            {cartItemsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-teal-900 text-[10px] font-extrabold text-teal-100">
                {cartItemsCount}
              </span>
            )}
          </button>
        )}

        {/* 4. Single Exit / Logout Control */}
        <button
          onClick={logout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:border-red-300 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-all shadow-2xs"
          title="Exit to Landing Gateway"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
};
