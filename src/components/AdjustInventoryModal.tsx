import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { Medicine } from '../types/pharmacy';

interface AdjustInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
}

export const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({
  isOpen,
  onClose,
  medicine,
}) => {
  const { batches, adjustInventory } = usePharmacy();

  const medBatches = medicine ? batches.filter(b => b.medicineId === medicine.id) : [];
  const [selectedBatchId, setSelectedBatchId] = useState(medBatches[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'DAMAGE' | 'EXPIRY' | 'RETURN'>('ADJUSTMENT');
  const [quantityDelta, setQuantityDelta] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !medicine) return null;

  const currentSelectedBatch = medBatches.find(b => b.id === (selectedBatchId || medBatches[0]?.id));

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const delta = parseInt(quantityDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setError('Please provide a non-zero quantity adjustment.');
      return;
    }

    if (!currentSelectedBatch) {
      setError('Please select a valid batch.');
      return;
    }

    if (currentSelectedBatch.quantity + delta < 0) {
      setError(`Cannot deduct ${Math.abs(delta)} units. Batch currently has only ${currentSelectedBatch.quantity} units.`);
      return;
    }

    adjustInventory(
      medicine.id,
      currentSelectedBatch.id,
      delta,
      adjustType,
      notes.trim() || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Adjust Inventory Stock</h2>
            <p className="text-xs text-slate-500">{medicine.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdjust} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Batch</label>
            <select
              value={selectedBatchId || medBatches[0]?.id}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none"
            >
              {medBatches.map(b => (
                <option key={b.id} value={b.id}>
                  Batch {b.batchNumber} (Stock: {b.quantity}, Exp: {b.expiryDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Adjustment Reason / Type</label>
            <select
              value={adjustType}
              onChange={e => setAdjustType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none"
            >
              <option value="ADJUSTMENT">Physical Audit Discrepancy (ADJUSTMENT)</option>
              <option value="DAMAGE">Damaged / Broken Packaging (DAMAGE)</option>
              <option value="EXPIRY">Quarantined / Expired Lot (EXPIRY)</option>
              <option value="RETURN">Patient Return / Restock (RETURN)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Quantity Change (e.g. -2 for damage, +10 for audit find)
            </label>
            <input
              type="number"
              required
              value={quantityDelta}
              onChange={e => setQuantityDelta(e.target.value)}
              placeholder="-2 or +5"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-base focus:bg-white focus:outline-none"
            />
            {currentSelectedBatch && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Current: {currentSelectedBatch.quantity} → Resulting: {Math.max(0, currentSelectedBatch.quantity + (parseInt(quantityDelta, 10) || 0))}
              </span>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Notes / Reference</label>
            <input
              type="text"
              placeholder="e.g. Verified during physical Sunday rack count"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              Record Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
