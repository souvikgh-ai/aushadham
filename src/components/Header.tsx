import React from 'react';
import {
  ShoppingCart,
  Bell,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';

export const Header: React.FC = () => {
  const {
    settings,
    cart,
    setActivePage,
    alerts,
    recommendations,
    resetToDemoData
  } = usePharmacy();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const criticalStockout = alerts.find(a => a.type === 'STOCKOUT');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Pharmacy Details */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">AUSHADHAM</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Live Store
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate max-w-md hidden sm:block">
            {settings.pharmacyAddress} • GSTIN: {settings.pharmacyGst}
          </p>
        </div>
      </div>

      {/* Critical Stockout Alert Banner if any */}
      {criticalStockout && (
        <div
          onClick={() => setActivePage('alerts')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium cursor-pointer hover:bg-red-100 transition-colors"
        >
          <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce" />
          <span className="font-semibold">{criticalStockout.title}</span>
          <ArrowRight className="w-3.5 h-3.5 text-red-500" />
        </div>
      )}

      {/* Action shortcuts */}
      <div className="flex items-center gap-3">
        {/* Load Demo Data Button */}
        <button
          onClick={() => {
            if (confirm('Load standard pharmacy demo dataset (30+ medicines, realistic sales history, batches)?')) {
              resetToDemoData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 transition-all"
          title="Reload full test dataset"
        >
          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">Load Demo Data</span>
        </button>

        {/* AI Recommendations Shortcut */}
        <button
          onClick={() => setActivePage('recommendations')}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">AI Intel</span>
          {recommendations.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
              {recommendations.length}
            </span>
          )}
        </button>

        {/* Alerts Shortcut */}
        <button
          onClick={() => setActivePage('alerts')}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
          title="Alerts Center"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>

        {/* POS Cart Shortcut */}
        <button
          onClick={() => setActivePage('pos')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>POS Cart</span>
          {cartItemsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-teal-800 text-[10px] font-extrabold text-teal-100">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
