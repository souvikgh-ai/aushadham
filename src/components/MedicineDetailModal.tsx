import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  Plus, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { usePharmacy } from '../context/PharmacyContext';
import type { Medicine } from '../types/pharmacy';
import { 
  calculateAverageDailySales, 
  calculateDaysUntilStockout, 
  getDaysToExpiry
} from '../services/inventoryEngine';

interface MedicineDetailModalProps {
  medicine: Medicine | null;
  onClose: () => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({ medicine, onClose }) => {
  const { batches, sales, recommendations, suppliers, addBatch, quickOrderForMedicine } = usePharmacy();
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // New batch form state
  const [newBatchNumber, setNewBatchNumber] = useState(`BAT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newMfgDate, setNewMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpDate, setNewExpDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newQty, setNewQty] = useState('50');

  // Historical Sales Graph Data (last 14 days)
  const salesTrend = useMemo(() => {
    if (!medicine) return [];
    const days = 14;
    const now = new Date();
    const map: { [dateStr: string]: { date: string; displayDate: string; units: number } } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      map[iso] = { date: iso, displayDate, units: 0 };
    }

    sales.forEach(sale => {
      const sDate = sale.timestamp.split('T')[0];
      if (map[sDate]) {
        sale.items.forEach(item => {
          if (item.medicineId === medicine.id) {
            map[sDate].units += item.quantity;
          }
        });
      }
    });

    return Object.values(map);
  }, [sales, medicine]);

  if (!medicine) return null;

  const medBatches = batches.filter(b => b.medicineId === medicine.id);
  const ads = calculateAverageDailySales(medicine.id, sales, 30);
  const daysToStockout = calculateDaysUntilStockout(medicine.currentStock, ads);
  const recommendation = recommendations.find(r => r.medicineId === medicine.id);
  const supplier = suppliers.find(s => s.id === medicine.supplierId);
  const inventoryValue = medBatches
    .filter(b => getDaysToExpiry(b.expiryDate) > 0)
    .reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(newQty, 10);
    if (!newBatchNumber || isNaN(qty) || qty <= 0) return;

    addBatch({
      medicineId: medicine.id,
      batchNumber: newBatchNumber.trim(),
      manufacturingDate: newMfgDate,
      expiryDate: newExpDate,
      quantity: qty,
      purchasePrice: medicine.purchasePrice,
      sellingPrice: medicine.sellingPrice,
      mrp: medicine.mrp,
      supplierId: medicine.supplierId,
    });

    setIsAddingBatch(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{medicine.name}</h2>
              {medicine.prescriptionRequired ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                  Rx Required
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  OTC
                </span>
              )}
            </div>
            <p className="text-xs text-teal-800 font-bold mt-0.5">{medicine.genericName}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {medicine.manufacturer} • {medicine.strength} • {medicine.dosageForm} • {medicine.packSize}
            </p>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-medium">Current Stock</span>
            <span className={`text-base font-black ${medicine.currentStock <= medicine.safetyStock ? 'text-red-600' : 'text-slate-900'}`}>
              {medicine.currentStock}
            </span>
            <span className="text-[9px] text-slate-400 block">units</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-medium">Daily Velocity</span>
            <span className="text-base font-black text-teal-800">{ads}</span>
            <span className="text-[9px] text-teal-600 block">units/day</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-medium">Stockout Est.</span>
            <span className={`text-base font-black ${daysToStockout !== null && daysToStockout <= medicine.supplierLeadTime ? 'text-red-600' : 'text-slate-800'}`}>
              {daysToStockout !== null ? `~${daysToStockout}d` : 'N/A'}
            </span>
            <span className="text-[9px] text-slate-400 block">to depletion</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-medium">Lead Time</span>
            <span className="text-base font-black text-slate-900">{medicine.supplierLeadTime}d</span>
            <span className="text-[9px] text-slate-400 block truncate" title={supplier?.name}>{supplier?.name || 'distributor'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-medium">Holding Value</span>
            <span className="text-base font-black text-slate-900 truncate">₹{inventoryValue.toLocaleString('en-IN')}</span>
            <span className="text-[9px] text-slate-400 block">purchase cost</span>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100">
            <span className="text-[10px] text-teal-700 block font-medium">Safety Stock</span>
            <span className="text-base font-black text-teal-800">{medicine.safetyStock}</span>
            <span className="text-[9px] text-teal-600 block">minimum buffer</span>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        {recommendation ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-teal-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Recommendation: {recommendation.what}</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-600 text-white">
                {recommendation.type}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {recommendation.why}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-teal-800">
                Action: {recommendation.howMuch} • {recommendation.when}
              </span>
              {recommendation.recommendedOrderQuantity > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    quickOrderForMedicine(medicine.id);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Create Reorder PO
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AI Status: Normal stock level. No emergency replenishment required currently.</span>
          </div>
        )}

        {/* 14-Day Sales Velocity Chart */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs text-slate-800">14-Day Dispensing History</span>
            <span className="text-[11px] text-slate-500 font-medium">Units sold per day</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="medSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="units" stroke="#0d9488" strokeWidth={2} fill="url(#medSalesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Tracking & Expiry Timeline Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Batch Chain & FEFO Priority</span>
            </span>

            <button
              onClick={() => setIsAddingBatch(!isAddingBatch)}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingBatch ? 'Cancel' : 'Add New Lot Batch'}</span>
            </button>
          </div>

          {/* Add Batch Inline Form */}
          {isAddingBatch && (
            <form onSubmit={handleSaveBatch} className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 grid grid-cols-5 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Batch #</label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={e => setNewBatchNumber(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white border border-teal-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Quantity</label>
                <input
                  type="number"
                  required
                  value={newQty}
                  onChange={e => setNewQty(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white border border-teal-200 font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mfg Date</label>
                <input
                  type="date"
                  value={newMfgDate}
                  onChange={e => setNewMfgDate(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white border border-teal-200 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Expiry Date</label>
                <input
                  type="date"
                  value={newExpDate}
                  onChange={e => setNewExpDate(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white border border-teal-200 text-[10px]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs text-xs"
                >
                  Save Lot
                </button>
              </div>
            </form>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] font-bold">
                <tr>
                  <th className="py-2 px-3">Batch Number</th>
                  <th className="py-2 px-3">Quantity</th>
                  <th className="py-2 px-3">Mfg Date</th>
                  <th className="py-2 px-3">Expiry Date</th>
                  <th className="py-2 px-3">Days Left</th>
                  <th className="py-2 px-3">FEFO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medBatches
                  .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                  .map((b, index) => {
                    const days = getDaysToExpiry(b.expiryDate);
                    const isExpired = days <= 0;
                    const isFirstOut = index === 0 && !isExpired && b.quantity > 0;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                        <td className="py-2 px-3 font-black text-slate-800">{b.quantity}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] font-mono">{b.manufacturingDate}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{b.expiryDate}</td>
                        <td className="py-2 px-3">
                          <span className={`font-bold ${days <= 0 ? 'text-red-600' : days <= 30 ? 'text-red-500' : days <= 90 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {days <= 0 ? `Expired (${Math.abs(days)}d)` : `${days} days`}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {isExpired ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white">
                              LOCKED (EXPIRED)
                            </span>
                          ) : isFirstOut ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-teal-600 text-white">
                              DISPENSE FIRST (FEFO)
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-500">
                              Secondary Batch
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-[11px] text-slate-400 font-mono">
            Barcode: {medicine.barcode} • SKU: {medicine.sku}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
