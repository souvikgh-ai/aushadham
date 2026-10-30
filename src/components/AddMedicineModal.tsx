import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { DosageForm } from '../types/pharmacy';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOSAGE_FORMS: DosageForm[] = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Suspension'
];

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ isOpen, onClose }) => {
  const { suppliers, addMedicine } = usePharmacy();

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState<DosageForm>('Tablet');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState('Analgesics / Antipyretics');
  const [packSize, setPackSize] = useState('10 tablets / strip');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState('30');
  const [sellingPrice, setSellingPrice] = useState('25');
  const [purchasePrice, setPurchasePrice] = useState('15');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'sup-1');
  const [supplierLeadTime, setSupplierLeadTime] = useState('4');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [minimumStock, setMinimumStock] = useState('30');
  const [safetyStock, setSafetyStock] = useState('15');

  // Initial batch
  const [initialBatchNumber, setInitialBatchNumber] = useState(`BAT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [initialMfgDate, setInitialMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialExpiryDate, setInitialExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [initialQty, setInitialQty] = useState('50');

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !genericName.trim() || !strength.trim()) {
      setFormError('Please fill in Medicine Name, Generic/Salt, and Strength.');
      return;
    }

    const mrpNum = parseFloat(mrp);
    const sellNum = parseFloat(sellingPrice);
    const purNum = parseFloat(purchasePrice);

    if (sellNum > mrpNum) {
      setFormError('Selling price cannot exceed Maximum Retail Price (MRP).');
      return;
    }

    addMedicine({
      name: name.trim(),
      genericName: genericName.trim(),
      strength: strength.trim(),
      dosageForm,
      manufacturer: manufacturer.trim() || 'Generic Healthcare Ltd',
      category,
      packSize,
      barcode: barcode.trim(),
      sku: sku.trim(),
      mrp: mrpNum,
      sellingPrice: sellNum,
      purchasePrice: purNum,
      supplierId,
      supplierLeadTime: parseInt(supplierLeadTime, 10) || 3,
      prescriptionRequired,
      minimumStock: parseInt(minimumStock, 10) || 20,
      safetyStock: parseInt(safetyStock, 10) || 15,
      initialBatch: parseInt(initialQty, 10) > 0 ? {
        batchNumber: initialBatchNumber.trim(),
        manufacturingDate: initialMfgDate,
        expiryDate: initialExpiryDate,
        quantity: parseInt(initialQty, 10),
      } : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900">Add New Medicine to Catalog</h2>
            <p className="text-xs text-slate-500">Configure medicine master details and register opening batch</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Name & Generic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Generic / Salt Name *</label>
              <input
                type="text"
                required
                value={genericName}
                onChange={e => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol / Acetaminophen"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          {/* Row 2: Strength, Form, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Strength *</label>
              <input
                type="text"
                required
                value={strength}
                onChange={e => setStrength(e.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dosage Form</label>
              <select
                value={dosageForm}
                onChange={e => setDosageForm(e.target.value as DosageForm)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              >
                {DOSAGE_FORMS.map(df => (
                  <option key={df} value={df}>{df}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Analgesics"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          {/* Row 3: Manufacturer, Pack Size, Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="e.g. Cipla Ltd"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pack Size</label>
              <input
                type="text"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
                placeholder="e.g. 10 tablets / strip"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Supplier</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.averageLeadTime}d lead)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barcode & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Barcode / EAN</label>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="e.g. 8901234567890"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. MED-CIP-500"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 4: Pricing (Purchase, Selling, MRP) */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-teal-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={mrp}
                onChange={e => setMrp(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold"
              />
            </div>
          </div>

          {/* Row 5: Stock Buffer & Lead Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lead Time (Days)</label>
              <input
                type="number"
                value={supplierLeadTime}
                onChange={e => setSupplierLeadTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Minimum Stock</label>
              <input
                type="number"
                value={minimumStock}
                onChange={e => setMinimumStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Safety Stock</label>
              <input
                type="number"
                value={safetyStock}
                onChange={e => setSafetyStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          {/* Row 6: Prescription Checkbox */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="prescriptionRequired"
              checked={prescriptionRequired}
              onChange={e => setPrescriptionRequired(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="prescriptionRequired" className="font-bold text-slate-800 cursor-pointer">
              Schedule H / Prescription Required (Rx)
            </label>
          </div>

          {/* Opening Batch Registration */}
          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <div className="font-black text-teal-900 flex items-center justify-between">
              <span>Opening Stock Batch (Optional)</span>
              <span className="text-[10px] font-normal text-teal-700">Registers initial inventory lot</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Batch Number</label>
                <input
                  type="text"
                  value={initialBatchNumber}
                  onChange={e => setInitialBatchNumber(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-teal-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Quantity</label>
                <input
                  type="number"
                  value={initialQty}
                  onChange={e => setInitialQty(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-teal-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mfg Date</label>
                <input
                  type="date"
                  value={initialMfgDate}
                  onChange={e => setInitialMfgDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-teal-200 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Expiry Date</label>
                <input
                  type="date"
                  value={initialExpiryDate}
                  onChange={e => setInitialExpiryDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-teal-200 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Medicine</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
