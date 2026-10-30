import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  History 
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { Medicine, InventoryStatus } from '../types/pharmacy';
import { 
  calculateAverageDailySales, 
  calculateDaysUntilStockout, 
  getMedicineInventoryStatus, 
  calculateRecommendedOrderQuantity,
  getDaysToExpiry
} from '../services/inventoryEngine';
import { AdjustInventoryModal } from '../components/AdjustInventoryModal';

export const InventoryPage: React.FC = () => {
  const { 
    medicines, 
    batches, 
    sales, 
    suppliers, 
    settings, 
    inventoryTransactions, 
    quickOrderForMedicine,
    setSelectedMedicineDetail 
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'inventory' | 'audit'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [adjustModalMed, setAdjustModalMed] = useState<Medicine | null>(null);

  // Status mapping
  const inventoryList = useMemo(() => {
    return medicines.map(med => {
      const medBatches = batches.filter(b => b.medicineId === med.id);
      const ads = calculateAverageDailySales(med.id, sales, 30);
      const daysOfStock = calculateDaysUntilStockout(med.currentStock, ads);
      const status: InventoryStatus = getMedicineInventoryStatus(med, medBatches, ads, settings);
      const recommendedOrder = calculateRecommendedOrderQuantity(
        med.currentStock,
        ads,
        settings.forecastPeriodDays,
        med.safetyStock
      );
      const supplier = suppliers.find(s => s.id === med.supplierId);

      // Earliest active batch
      const validBatches = medBatches
        .filter(b => getDaysToExpiry(b.expiryDate) > 0 && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      const earliestBatch = validBatches[0];

      return {
        medicine: med,
        batches: medBatches,
        earliestBatch,
        ads,
        daysOfStock,
        status,
        recommendedOrder,
        supplierName: supplier?.name || 'Primary Distributor',
        leadTime: med.supplierLeadTime,
      };
    });
  }, [medicines, batches, sales, suppliers, settings]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventoryList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        item.medicine.name.toLowerCase().includes(q) ||
        item.medicine.genericName.toLowerCase().includes(q) ||
        item.batches.some(b => b.batchNumber.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inventoryList, searchQuery, statusFilter]);

  const getStatusBadge = (status: InventoryStatus) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            🟢 HEALTHY
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
            🟡 LOW STOCK
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200 animate-pulse">
            🔴 CRITICAL
          </span>
        );
      case 'EXPIRING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
            🟠 EXPIRING
          </span>
        );
      case 'OVERSTOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
            🟣 OVERSTOCK
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Pharmacy Inventory & Audit Ledger
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
              Live Auditable
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Continuous real-time tracking of medicine batches, depletion days, and auditable movement logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditable Ledger ({inventoryTransactions.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inventory by medicine name or batch..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              {['All', 'HEALTHY', 'LOW', 'CRITICAL', 'EXPIRING', 'OVERSTOCK'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'All' ? 'All Status' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-3">Earliest Batch & Expiry</th>
                    <th className="py-3 px-3">Stock Level</th>
                    <th className="py-3 px-3">Daily Velocity</th>
                    <th className="py-3 px-3">Days of Stock</th>
                    <th className="py-3 px-3">Supplier & Lead</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Target Reorder</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => (
                    <tr 
                      key={item.medicine.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedMedicineDetail(item.medicine)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700">
                          {item.medicine.name}
                        </div>
                        <div className="text-[10px] text-teal-800 font-semibold truncate max-w-xs">
                          {item.medicine.genericName}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.earliestBatch ? (
                          <div>
                            <span className="font-mono font-bold text-slate-800">
                              {item.earliestBatch.batchNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Exp: {item.earliestBatch.expiryDate} ({getDaysToExpiry(item.earliestBatch.expiryDate)}d)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-600 font-bold">No Lot</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-slate-900 text-sm">{item.medicine.currentStock}</span>
                        <span className="text-[10px] text-slate-400 block">{item.batches.length} batch(es)</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-100">
                          {item.ads} /day
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {item.daysOfStock !== null ? (
                          <div className={`font-black ${item.daysOfStock <= item.leadTime ? 'text-red-600' : 'text-slate-800'}`}>
                            ~{item.daysOfStock} days
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No sales</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div className="truncate max-w-[110px] font-medium">{item.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.leadTime} days lead</div>
                      </td>

                      <td className="py-3 px-3">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3 px-3">
                        {item.recommendedOrder > 0 ? (
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            +{item.recommendedOrder} units
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAdjustModalMed(item.medicine)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Adjust quantity (Damage, Audit discrepancy)"
                          >
                            Adjust
                          </button>

                          <button
                            onClick={() => quickOrderForMedicine(item.medicine.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                            title="Create purchase replenishment"
                          >
                            PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Section 35: Auditable Inventory Transaction System */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Auditable Inventory Movement Ledger</h2>
              <p className="text-xs text-slate-500">Immutable trace of every sale, purchase intake, damage, and adjustment</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              {inventoryTransactions.length} Audit Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Quantity Delta</th>
                  <th className="py-2.5 px-3">Stock Progression</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryTransactions.slice(0, 50).map(tx => {
                  const isNegative = tx.quantityChange < 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {tx.medicineName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {tx.batchNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          tx.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                          tx.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-800' :
                          tx.type === 'DAMAGE' ? 'bg-red-100 text-red-800' :
                          tx.type === 'EXPIRY' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-black">
                        <span className={isNegative ? 'text-red-600' : 'text-emerald-600'}>
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {tx.previousStock} → <span className="font-bold text-slate-900">{tx.newStock}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {tx.referenceId && <span className="font-bold text-slate-700 mr-1.5 font-mono">[{tx.referenceId}]</span>}
                        {tx.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      <AdjustInventoryModal
        isOpen={Boolean(adjustModalMed)}
        onClose={() => setAdjustModalMed(null)}
        medicine={adjustModalMed}
      />
    </div>
  );
};
