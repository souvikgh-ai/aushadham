import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ShieldCheck, 
  X,
  Layers
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { Medicine, SaleTransaction } from '../types/pharmacy';
import { getDaysToExpiry, getPreferredBatchForSale } from '../services/inventoryEngine';

export const PosBillingPage: React.FC = () => {
  const { 
    medicines, 
    batches, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    completeSale, 
    settings
  } = usePharmacy();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterRxOnly, setFilterRxOnly] = useState<boolean>(false);
  const [activeBatchModalMed, setActiveBatchModalMed] = useState<Medicine | null>(null);

  // Customer & Payment state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [prescriptionConfirmed, setPrescriptionConfirmed] = useState(false);
  
  // Feedback & Receipt Modal
  const [lastSaleReceipt, setLastSaleReceipt] = useState<SaleTransaction | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach(m => set.add(m.category));
    return ['All', ...Array.from(set)];
  }, [medicines]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.barcode.includes(q);

      const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchesRx = !filterRxOnly || m.prescriptionRequired;

      return matchesSearch && matchesCat && matchesRx;
    });
  }, [medicines, searchQuery, selectedCategory, filterRxOnly]);

  // Calculations for Cart
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const linePrice = item.medicine.sellingPrice * (1 - (item.discountPercent / 100));
      return sum + (linePrice * item.quantity);
    }, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return Math.round(cartSubtotal * (settings.taxRatePercent / 100));
  }, [cartSubtotal, settings.taxRatePercent]);

  const cartGrandTotal = cartSubtotal + cartTax;

  // Check if any cart item requires prescription
  const hasPrescriptionItems = useMemo(() => {
    return cart.some(i => i.medicine.prescriptionRequired);
  }, [cart]);

  // Handle Complete Sale
  const handleCompleteSale = () => {
    setPosError(null);
    setPosSuccessMsg(null);

    if (cart.length === 0) {
      setPosError('Cart is empty. Add medicines before completing sale.');
      return;
    }

    if (hasPrescriptionItems && !prescriptionConfirmed) {
      setPosError('Prescription required: Please verify and confirm the doctor prescription before billing.');
      return;
    }

    const result = completeSale({
      name: customerName.trim() || 'Walk-in Customer',
      phone: customerPhone.trim() || undefined,
      doctor: doctorName.trim() || undefined,
      paymentMethod,
      prescriptionVerified: hasPrescriptionItems ? prescriptionConfirmed : false,
    });

    if (!result.success || !result.sale) {
      setPosError(result.error || 'Failed to complete sale.');
      return;
    }

    // Success
    setLastSaleReceipt(result.sale);
    setPosSuccessMsg('Sale completed successfully. Inventory automatically updated.');
    setCustomerName('');
    setCustomerPhone('');
    setDoctorName('');
    setPrescriptionConfirmed(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Pharmacy POS & FEFO Billing
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              FEFO Priority Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search medicine, auto-allocate earliest non-expired batch, verify prescription, and bill.
          </p>
        </div>

        {posSuccessMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{posSuccessMsg}</span>
          </div>
        )}
      </div>

      {posError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{posError}</span>
          </div>
          <button onClick={() => setPosError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: Left Search/Catalog + Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Catalog & Medicine Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Box */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Medicine, Salt / Generic, Brand, SKU, Barcode (e.g. Paracetamol)..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex-shrink-0 transition-all text-[11px] ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => setFilterRxOnly(!filterRxOnly)}
                className={`px-2.5 py-1 rounded-lg font-bold flex-shrink-0 transition-all text-[11px] border ${
                  filterRxOnly
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                }`}
              >
                Rx Required Only
              </button>
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredMedicines.map(med => {
              const medBatches = batches.filter(b => b.medicineId === med.id);
              const preferredResult = getPreferredBatchForSale(medBatches);
              const targetBatch = preferredResult.batch;
              const hasExpiredBatches = medBatches.some(b => getDaysToExpiry(b.expiryDate) <= 0 && b.quantity > 0);
              const daysRemaining = targetBatch ? getDaysToExpiry(targetBatch.expiryDate) : 0;

              return (
                <div 
                  key={med.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header line with Rx/OTC badge */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-bold text-sm text-slate-900 leading-tight">
                        {med.name}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {med.prescriptionRequired ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                            Rx
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            OTC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Generic / Salt name */}
                    <div className="text-[11px] text-teal-700 font-semibold mb-1 truncate">
                      {med.genericName}
                    </div>

                    {/* Manufacturer & Pack Size */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                      <span className="truncate">{med.manufacturer}</span>
                      <span className="font-medium text-slate-400">{med.packSize}</span>
                    </div>

                    {/* FEFO Batch Badge Details */}
                    {targetBatch ? (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Batch: {targetBatch.batchNumber}
                          </span>
                          <span className="font-bold text-slate-900">
                            Stock: {targetBatch.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>Exp: {targetBatch.expiryDate}</span>
                          <span className={daysRemaining <= 30 ? 'text-red-600 font-bold' : daysRemaining <= 90 ? 'text-amber-600 font-bold' : 'text-emerald-700'}>
                            ({daysRemaining}d left)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-700 font-medium mb-3">
                        {hasExpiredBatches 
                          ? 'This batch has expired and cannot be sold.' 
                          : 'No stock available for this medicine.'}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-slate-900">₹{med.sellingPrice}</span>
                        {med.mrp > med.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through">₹{med.mrp}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Total Stock: {med.currentStock}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {medBatches.length > 1 && (
                        <button
                          onClick={() => setActiveBatchModalMed(med)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold flex items-center gap-1"
                          title="View all batches"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Batches</span>
                        </button>
                      )}

                      <button
                        disabled={!targetBatch || targetBatch.quantity === 0}
                        onClick={() => {
                          const res = addToCart(med);
                          if (!res.success) setPosError(res.error || 'Failed to add item');
                          else setPosError(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          targetBatch && targetBatch.quantity > 0
                            ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Billing Cart & Checkout Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-4 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Current Billing Cart</h2>
                <p className="text-[11px] text-slate-500 font-medium">{cart.length} unique medicines added</p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Cart is currently empty.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Select medicines from the left to start billing.</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const lineTotal = Math.round(item.quantity * item.medicine.sellingPrice * (1 - (item.discountPercent / 100)));
                const daysRemaining = getDaysToExpiry(item.selectedBatch.expiryDate);

                return (
                  <div 
                    key={`${item.medicine.id}-${item.selectedBatch.id}`}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                          <span>{item.medicine.name}</span>
                          {item.medicine.prescriptionRequired && (
                            <span className="text-[9px] font-black px-1 rounded bg-red-100 text-red-700">Rx</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Batch: <span className="font-bold text-slate-700">{item.selectedBatch.batchNumber}</span> (Exp: {item.selectedBatch.expiryDate}, {daysRemaining}d left)
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3 text-slate-700" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const res = updateCartQuantity(idx, item.quantity + 1);
                            if (!res.success) setPosError(res.error || 'Max stock reached');
                          }}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3 text-slate-700" />
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <span className="font-black text-slate-900">₹{lineTotal}</span>
                        <span className="text-[10px] text-slate-400 block">@ ₹{item.medicine.sellingPrice}/unit</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Customer & Prescription Form */}
          {cart.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Patient Details</div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Mobile No."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {hasPrescriptionItems && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>Prescription Verification Required</span>
                  </div>
                  <p className="text-[10px] text-red-700 leading-tight">
                    One or more items in the cart are Schedule H / Rx medicines requiring a registered practitioner's prescription.
                  </p>
                  <input
                    type="text"
                    placeholder="Prescribing Doctor Name (e.g. Dr. A. Sen, MBBS)"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-xs focus:outline-none"
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={prescriptionConfirmed}
                      onChange={e => setPrescriptionConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="text-[11px] font-bold text-red-900">
                      I have verified the physical/digital prescription
                    </span>
                  </label>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payment Method</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          paymentMethod === m.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bill Calculation Summary */}
          {cart.length > 0 && (
            <div className="pt-2 space-y-1.5 text-xs text-slate-600 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST {settings.taxRatePercent}%)</span>
                <span className="font-semibold text-slate-900">₹{cartTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-teal-700">₹{cartGrandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Checkout Actions */}
          <div className="pt-2 space-y-2">
            <button
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                cart.length > 0
                  ? 'bg-teal-600 hover:bg-teal-700 text-white active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Sale & Deduct Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALL BATCHES MODAL (for viewing and picking an alternate batch) */}
      {activeBatchModalMed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">{activeBatchModalMed.name}</h3>
                <p className="text-xs text-slate-500">Select batch to dispense (FEFO prioritized)</p>
              </div>
              <button 
                onClick={() => setActiveBatchModalMed(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {batches
                .filter(b => b.medicineId === activeBatchModalMed.id)
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map((batch, index) => {
                  const days = getDaysToExpiry(batch.expiryDate);
                  const isExpired = days <= 0;
                  const isRecommendedFEFO = index === 0 && !isExpired;

                  return (
                    <div 
                      key={batch.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isExpired 
                          ? 'bg-red-50/50 border-red-200 text-slate-400' 
                          : isRecommendedFEFO
                            ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">Batch {batch.batchNumber}</span>
                          {isRecommendedFEFO && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-600 text-white">
                              FEFO RECOMMENDED
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Mfg: {batch.manufacturingDate} • Exp: {batch.expiryDate} ({days}d remaining)
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700 mt-1">
                          Available: {batch.quantity} units • Price: ₹{batch.sellingPrice}
                        </div>
                      </div>

                      <div>
                        <button
                          disabled={isExpired || batch.quantity === 0}
                          onClick={() => {
                            const res = addToCart(activeBatchModalMed, batch);
                            if (res.success) {
                              setActiveBatchModalMed(null);
                              setPosError(null);
                            } else {
                              setPosError(res.error || 'Failed to add batch');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            !isExpired && batch.quantity > 0
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* POST-SALE RECEIPT MODAL */}
      {lastSaleReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-black text-sm uppercase tracking-wider text-slate-900">Sale Receipt</span>
              </div>
              <button 
                onClick={() => setLastSaleReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-extrabold text-base text-slate-900">{settings.pharmacyName}</div>
                <div className="text-[10px] text-slate-500">{settings.pharmacyAddress}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">GSTIN: {settings.pharmacyGst}</div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <div>
                  <span>Invoice: <strong>{lastSaleReceipt.invoiceNumber}</strong></span>
                  <div className="text-[10px] text-slate-500">{new Date(lastSaleReceipt.timestamp).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <span>Customer: <strong>{lastSaleReceipt.customerName}</strong></span>
                  <div className="text-[10px] text-slate-500">Pay: {lastSaleReceipt.paymentMethod}</div>
                </div>
              </div>

              {lastSaleReceipt.doctorName && (
                <div className="text-[11px] text-slate-600 bg-red-50/50 p-1.5 rounded border border-red-100">
                  Doctor: <strong>{lastSaleReceipt.doctorName}</strong> (Rx Verified)
                </div>
              )}

              {/* Items Table */}
              <div className="pt-2 border-t border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px]">
                      <th className="pb-1">Item (Batch)</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lastSaleReceipt.items.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 font-semibold text-slate-800">
                          {item.medicineName}
                          <span className="block text-[9px] text-slate-400 font-normal">
                            B: {item.batchNumber} (Exp {item.expiryDate})
                          </span>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right text-slate-600">₹{item.unitPrice}</td>
                        <td className="py-1 text-right font-bold text-slate-900">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{lastSaleReceipt.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (5% GST)</span>
                  <span>₹{lastSaleReceipt.tax}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-teal-700">₹{lastSaleReceipt.grandTotal}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                Medicines sold under FEFO batch compliance. Keep out of reach of children.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setLastSaleReceipt(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>New Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
