import React from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Truck, 
  Star
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';

export const SuppliersPage: React.FC = () => {
  const { suppliers, medicines, purchaseOrders, setActivePage, setQuickOrderPrefill } = usePharmacy();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Pharma Distributors & Suppliers
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
              {suppliers.length} Verified Distributors
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Authorized pharmaceutical supply network with lead time tracking and order history.
          </p>
        </div>

        <button
          onClick={() => alert('Supplier onboarding form can be customized via API or settings.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Distributor</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map(sup => {
          const suppliedMeds = medicines.filter(m => m.supplierId === sup.id);
          const openPOs = purchaseOrders.filter(po => po.supplierId === sup.id && po.status === 'Ordered');

          return (
            <div 
              key={sup.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center border border-teal-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{sup.name}</h3>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <span>Contact: <strong>{sup.contactPerson}</strong></span>
                      </div>
                    </div>
                  </div>

                  {sup.rating && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                      <span>{sup.rating}</span>
                    </span>
                  )}
                </div>

                {/* Contact info list */}
                <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Lead Time</span>
                    <span className="font-bold text-slate-900">{sup.averageLeadTime} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Catalog Items</span>
                    <span className="font-bold text-teal-800">{suppliedMeds.length} meds</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">In Transit</span>
                    <span className={`font-bold ${openPOs.length > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                      {openPOs.length} POs
                    </span>
                  </div>
                </div>

                {/* Medicines Supplied Preview */}
                {suppliedMeds.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Key Supplies:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {suppliedMeds.slice(0, 3).map(m => (
                        <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {m.name}
                        </span>
                      ))}
                      {suppliedMeds.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-400 font-bold">
                          +{suppliedMeds.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 mt-4">
                <button
                  onClick={() => {
                    setQuickOrderPrefill({
                      supplierId: sup.id,
                      medicineId: suppliedMeds[0]?.id,
                      quantity: 50,
                    });
                    setActivePage('po');
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Truck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Issue Purchase Order</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
