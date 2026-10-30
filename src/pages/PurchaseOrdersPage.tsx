import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  PackageCheck
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { CreatePOModal } from '../components/CreatePOModal';
import type { PurchaseOrderStatus } from '../types/pharmacy';

export const PurchaseOrdersPage: React.FC = () => {
  const { 
    purchaseOrders, 
    receivePurchaseOrder, 
    quickOrderPrefill, 
    setQuickOrderPrefill 
  } = usePharmacy();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(quickOrderPrefill));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseOrderStatus>('All');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredPOs = purchaseOrders.filter(po => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      po.poNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.items.some(i => i.medicineName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReceive = (poId: string) => {
    const result = receivePurchaseOrder(poId);
    if (result.success) {
      setSuccessMsg('Stock intake processed successfully! Batches created and inventory incremented.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(result.error || 'Failed to receive purchase order.');
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'Ordered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Ordered (In Transit)</span>
          </span>
        );
      case 'Received':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Stock Received</span>
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
            Cancelled
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Supplier Purchase Orders
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Procurement Desk
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage distributor orders, track shipping lead time, and receive lots into active stock.
          </p>
        </div>

        <button
          onClick={() => {
            setQuickOrderPrefill(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by PO #, supplier, or ordered medicine..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['All', 'Ordered', 'Received', 'Draft', 'Cancelled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Est. Delivery</th>
                <th className="py-3 px-3">Items & Quantity</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map(po => {
                const totalUnits = po.items.reduce((sum, i) => sum + i.orderedQuantity, 0);
                return (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {po.poNumber}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {po.supplierName}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {po.orderDate}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                      {po.expectedDeliveryDate}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{totalUnits} units total</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {po.items.map(i => `${i.medicineName} (${i.orderedQuantity})`).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-black text-slate-900 text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(po.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {po.status === 'Ordered' ? (
                        <button
                          onClick={() => handleReceive(po.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Order</span>
                        </button>
                      ) : po.status === 'Received' ? (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Received ({po.receivedDate})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePOModal
        isOpen={isCreateModalOpen || Boolean(quickOrderPrefill)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setQuickOrderPrefill(null);
        }}
        initialMedicineId={quickOrderPrefill?.medicineId}
        initialSupplierId={quickOrderPrefill?.supplierId}
        initialQuantity={quickOrderPrefill?.quantity}
      />
    </div>
  );
};
