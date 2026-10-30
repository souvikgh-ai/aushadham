import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  X, 
  Eye
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { SaleTransaction } from '../types/pharmacy';

export const SalesHistoryPage: React.FC = () => {
  const { sales, settings } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<SaleTransaction | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('All');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q)) ||
        s.items.some(i => i.medicineName.toLowerCase().includes(q) || i.batchNumber.toLowerCase().includes(q));

      const matchesMethod = filterMethod === 'All' || s.paymentMethod === filterMethod;
      return matchesSearch && matchesMethod;
    });
  }, [sales, searchQuery, filterMethod]);

  // Aggregate stats
  const totalVolume = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [filteredSales]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Sales & Dispensing History
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
              {sales.length} Transactions
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Search invoices, review batch allocation per bill, and re-print receipts.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4 text-xs font-bold self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-slate-400 block font-normal uppercase">Filtered Revenue</span>
            <span className="text-base font-black text-emerald-600">₹{totalVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-400 block font-normal uppercase">Bills Count</span>
            <span className="text-base font-black text-slate-900">{filteredSales.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, phone, or medicine..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>

        {/* Method filter */}
        <div className="flex items-center gap-1.5 text-xs">
          {['All', 'UPI', 'CASH', 'CARD'].map(m => (
            <button
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                filterMethod === m
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'All' ? 'All Payments' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Patient / Customer</th>
                <th className="py-3 px-3">Items Dispensed</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(tx => {
                const totalUnits = tx.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {tx.invoiceNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(tx.timestamp).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {tx.customerName || 'Walk-in'}
                      {tx.prescriptionVerified && (
                        <span className="ml-1 text-[9px] font-bold px-1 rounded bg-red-100 text-red-700">
                          Rx
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{totalUnits} units</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {tx.items.map(i => i.medicineName).join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-black text-slate-900 text-sm">
                      ₹{tx.grandTotal.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-black text-sm uppercase tracking-wider text-slate-900">
                Tax Invoice Receipt
              </span>
              <button onClick={() => setSelectedTx(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt" className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-extrabold text-base text-slate-900">{settings.pharmacyName}</div>
                <div className="text-[10px] text-slate-500">{settings.pharmacyAddress}</div>
                <div className="text-[10px] text-slate-500 font-mono">GSTIN: {settings.pharmacyGst}</div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <div>
                  <span>Invoice: <strong>{selectedTx.invoiceNumber}</strong></span>
                  <div className="text-[10px] text-slate-500">{new Date(selectedTx.timestamp).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <span>Customer: <strong>{selectedTx.customerName || 'Walk-in'}</strong></span>
                  <div className="text-[10px] text-slate-500">Pay: {selectedTx.paymentMethod}</div>
                </div>
              </div>

              {selectedTx.doctorName && (
                <div className="text-[11px] text-slate-600 bg-red-50/50 p-1.5 rounded border border-red-100">
                  Doctor: <strong>{selectedTx.doctorName}</strong> (Rx Verified)
                </div>
              )}

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
                    {selectedTx.items.map((item, idx) => (
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
                  <span>₹{selectedTx.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (5% GST)</span>
                  <span>₹{selectedTx.tax}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-teal-700">₹{selectedTx.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
