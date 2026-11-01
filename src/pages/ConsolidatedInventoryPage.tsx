import React, { useState } from 'react';
import { Pill, Boxes, Clock, History } from 'lucide-react';
import { MedicinesPage } from './MedicinesPage';
import { InventoryPage } from './InventoryPage';
import { ExpiryMonitorPage } from './ExpiryMonitorPage';
import { usePharmacy } from '../context/PharmacyContext';

export const ConsolidatedInventoryPage: React.FC = () => {
  const { kpis, inventoryTransactions, medicines } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'catalogue' | 'batches' | 'expiry' | 'movements'>('catalogue');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-teal-600" />
            <span>Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Centralized medicine catalogue, batch-level stock, expiry surveillance, and audit trail.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'catalogue'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medicine Catalogue</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {kpis.totalMedicines}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'batches'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Batches & Stock</span>
            {kpis.lowStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {kpis.lowStockCount} Low
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('expiry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'expiry'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiry Monitor</span>
            {kpis.expiringSoonCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 font-bold">
                {kpis.expiringSoonCount} Risk
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'movements'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movements</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'catalogue' && <MedicinesPage />}
      {activeTab === 'batches' && <InventoryPage />}
      {activeTab === 'expiry' && <ExpiryMonitorPage />}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock Movement Audit Trail</h2>
              <p className="text-xs text-slate-500">Every inventory deduction, purchase addition, return and adjustment is logged with immutable timestamps.</p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              {inventoryTransactions.length} Total Logged Events
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Quantity Delta</th>
                  <th className="py-2.5 px-3">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryTransactions.slice(0, 50).map((tx) => {
                  const med = medicines.find(m => m.id === tx.medicineId);
                  const isPositive = tx.quantityChange > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          tx.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                          tx.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-800' :
                          tx.type === 'EXPIRY' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {med?.name || tx.medicineId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {tx.batchNumber}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono">
                        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                          {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                        {tx.notes || tx.referenceId || 'Standard operational log'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
