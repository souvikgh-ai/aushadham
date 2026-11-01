import React, { useState } from 'react';
import { ShoppingCart, History, Receipt } from 'lucide-react';
import { PosBillingPage } from './PosBillingPage';
import { SalesHistoryPage } from './SalesHistoryPage';
import { usePharmacy } from '../context/PharmacyContext';

export const ConsolidatedPosPage: React.FC = () => {
  const { kpis, cart } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');
  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-teal-600" />
            <span>POS & Sales Operations</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rapid barcode billing with FEFO batch allocation, GST invoices, and historical sales audit.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'billing'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Pharmacy POS Billing</span>
            {cartUnits > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white font-bold">
                {cartUnits} in cart
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sales History & Invoices</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
              ₹{kpis.todaySales.toLocaleString('en-IN')} today
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'billing' && <PosBillingPage />}
      {activeTab === 'history' && <SalesHistoryPage />}
    </div>
  );
};
