import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { AddMedicineModal } from '../components/AddMedicineModal';
import { getDaysToExpiry } from '../services/inventoryEngine';

export const MedicinesPage: React.FC = () => {
  const { 
    medicines, 
    batches, 
    suppliers, 
    setSelectedMedicineDetail,
    quickOrderForMedicine 
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedManufacturer, setSelectedManufacturer] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'InStock' | 'Out'>('All');
  const [rxFilter, setRxFilter] = useState<'All' | 'Rx' | 'OTC'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Distinct manufacturers
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => set.add(m.manufacturer));
    return ['All', ...Array.from(set)];
  }, [medicines]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => set.add(m.category));
    return ['All', ...Array.from(set)];
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const medBatches = batches.filter(b => b.medicineId === m.id);
      const matchesBatch = medBatches.some(b => b.batchNumber.toLowerCase().includes(q));

      const matchesSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.barcode.includes(q) ||
        matchesBatch;

      const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchesMfg = selectedManufacturer === 'All' || m.manufacturer === selectedManufacturer;
      
      const matchesRx = 
        rxFilter === 'All' ||
        (rxFilter === 'Rx' && m.prescriptionRequired) ||
        (rxFilter === 'OTC' && !m.prescriptionRequired);

      let matchesStock = true;
      if (stockFilter === 'Low') matchesStock = m.currentStock <= m.minimumStock && m.currentStock > 0;
      if (stockFilter === 'InStock') matchesStock = m.currentStock > m.minimumStock;
      if (stockFilter === 'Out') matchesStock = m.currentStock <= 0;

      return matchesSearch && matchesCat && matchesMfg && matchesRx && matchesStock;
    });
  }, [medicines, batches, searchQuery, selectedCategory, selectedManufacturer, rxFilter, stockFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Primary Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Medicine Catalog & Inventory Master
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {medicines.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search, filter, inspect batch chains, and configure inventory parameters.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Medicine, Salt, Batch number, or Barcode..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div>
            <select
              value={selectedManufacturer}
              onChange={e => setSelectedManufacturer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none"
            >
              {manufacturers.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Manufacturers' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Filters:</span>
          
          {/* Stock state */}
          {(['All', 'InStock', 'Low', 'Out'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStockFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                stockFilter === s
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'All' ? 'All Stock' : s === 'InStock' ? 'Healthy Stock' : s === 'Low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Rx state */}
          {(['All', 'Rx', 'OTC'] as const).map(rx => (
            <button
              key={rx}
              onClick={() => setRxFilter(rx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                rxFilter === rx
                  ? rx === 'Rx' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rx === 'All' ? 'All Types' : rx === 'Rx' ? 'Prescription Only (Rx)' : 'OTC Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Medicine & Generic</th>
                <th className="py-3 px-3">Strength & Form</th>
                <th className="py-3 px-3">Manufacturer</th>
                <th className="py-3 px-3">Stock & Batches</th>
                <th className="py-3 px-3">Pricing (₹)</th>
                <th className="py-3 px-3">Earliest Expiry</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map(med => {
                const medBatches = batches.filter(b => b.medicineId === med.id);
                const supplier = suppliers.find(s => s.id === med.supplierId);
                
                // Earliest non-expired batch
                const validBatches = medBatches
                  .filter(b => getDaysToExpiry(b.expiryDate) > 0 && b.quantity > 0)
                  .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                const earliestBatch = validBatches[0];
                const daysRemaining = earliestBatch ? getDaysToExpiry(earliestBatch.expiryDate) : null;

                return (
                  <tr 
                    key={med.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedMedicineDetail(med)}
                  >
                    {/* Medicine Name & Generic */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {med.name}
                      </div>
                      <div className="text-[10px] text-teal-800 font-semibold truncate max-w-xs">
                        {med.genericName}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        SKU: {med.sku}
                      </div>
                    </td>

                    {/* Strength & Form */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{med.strength}</div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                        {med.dosageForm}
                      </span>
                    </td>

                    {/* Manufacturer */}
                    <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[120px]">
                      {med.manufacturer}
                    </td>

                    {/* Stock & Batches */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black ${med.currentStock <= med.safetyStock ? 'text-red-600' : 'text-slate-900'}`}>
                          {med.currentStock} units
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {medBatches.length} batch{medBatches.length !== 1 ? 'es' : ''} (Min: {med.minimumStock})
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">₹{med.sellingPrice}</div>
                      <div className="text-[10px] text-slate-400">Cost: ₹{med.purchasePrice} | MRP: ₹{med.mrp}</div>
                    </td>

                    {/* Earliest Expiry */}
                    <td className="py-3 px-3">
                      {earliestBatch ? (
                        <div>
                          <div className="font-medium text-slate-800 font-mono text-[11px]">{earliestBatch.expiryDate}</div>
                          <div className={`text-[10px] font-bold ${
                            daysRemaining! <= 30 ? 'text-red-600' : daysRemaining! <= 90 ? 'text-amber-600' : 'text-emerald-700'
                          }`}>
                            {daysRemaining} days left (B: {earliestBatch.batchNumber})
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          No Valid Lot
                        </span>
                      )}
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[110px]">
                      {supplier ? supplier.name : 'Primary Distributor'}
                    </td>

                    {/* Rx Tag */}
                    <td className="py-3 px-3">
                      {med.prescriptionRequired ? (
                        <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-max">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Rx</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 w-max block">
                          OTC
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => quickOrderForMedicine(med.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          title="Generate replenishment PO"
                        >
                          Reorder
                        </button>
                        <button
                          onClick={() => setSelectedMedicineDetail(med)}
                          className="p-1 rounded-lg text-teal-600 hover:bg-teal-50"
                          title="Inspect details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
