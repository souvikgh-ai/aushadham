import React, { useState } from 'react';
import { Truck, Building2, Sparkles, PlusCircle } from 'lucide-react';
import { PurchaseOrdersPage } from './PurchaseOrdersPage';
import { SuppliersPage } from './SuppliersPage';
import { RecommendationsPage } from './RecommendationsPage';
import { usePharmacy } from '../context/PharmacyContext';

export const ConsolidatedProcurementPage: React.FC = () => {
  const { purchaseOrders, suppliers, recommendations, setQuickOrderPrefill } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'po' | 'suppliers' | 'reorder'>('po');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" />
            <span>Procurement & Supplier Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            End-to-end purchasing lifecycle: purchase order generation, supplier directories, delivery receiving, and AI replenishment.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('po')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'po'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Purchase Orders</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {purchaseOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'suppliers'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Suppliers Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {suppliers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reorder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'reorder'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Reorder Recommendations</span>
            {recommendations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white font-bold">
                {recommendations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('po');
              setQuickOrderPrefill({});
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-all ml-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New PO</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'po' && <PurchaseOrdersPage />}
      {activeTab === 'suppliers' && <SuppliersPage />}
      {activeTab === 'reorder' && <RecommendationsPage />}
    </div>
  );
};
