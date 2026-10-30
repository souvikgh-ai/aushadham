import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  TrendingUp, 
  Boxes, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { getDaysToExpiry } from '../services/inventoryEngine';

export const ReportsPage: React.FC = () => {
  const { sales, medicines, batches, recommendations, settings } = usePharmacy();
  const [reportTab, setReportTab] = useState<'sales' | 'inventory' | 'expiry' | 'ai'>('sales');

  // Sales calculations
  const salesMetrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalUnits = sales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0);
    const avgBillValue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;
    return { totalRevenue, totalUnits, totalBills: sales.length, avgBillValue };
  }, [sales]);

  // Inventory calculations
  const inventoryMetrics = useMemo(() => {
    const totalUnitsInStock = medicines.reduce((sum, m) => sum + m.currentStock, 0);
    const totalInventoryValue = batches
      .filter(b => getDaysToExpiry(b.expiryDate) > 0)
      .reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);
    const totalLots = batches.filter(b => b.quantity > 0).length;
    return { totalUnitsInStock, totalInventoryValue, totalLots };
  }, [medicines, batches]);

  // Expiry calculations
  const expiryMetrics = useMemo(() => {
    let expiredUnits = 0;
    let expiredValue = 0;
    let criticalUnits = 0;
    let criticalValue = 0;

    batches.forEach(b => {
      const days = getDaysToExpiry(b.expiryDate);
      if (days <= 0 && b.quantity > 0) {
        expiredUnits += b.quantity;
        expiredValue += b.quantity * b.purchasePrice;
      } else if (days > 0 && days <= settings.expiryCriticalDays && b.quantity > 0) {
        criticalUnits += b.quantity;
        criticalValue += b.quantity * b.purchasePrice;
      }
    });

    return { expiredUnits, expiredValue, criticalUnits, criticalValue, totalRisk: expiredValue + criticalValue };
  }, [batches, settings]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Pharmacy Operational & Intelligence Reports
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Audit Ready
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate and export comprehensive audits across revenue, inventory valuation, and expiry risks.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-teal-400" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 text-xs font-bold w-fit">
        {[
          { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory Valuation', icon: Boxes },
          { id: 'expiry', label: 'Expiry Risk & Losses', icon: Clock },
          { id: 'ai', label: 'AI Intelligence Summary', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                reportTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales Report */}
      {reportTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">₹{salesMetrics.totalRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 font-medium">Over 30 days recorded</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Units Sold</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{salesMetrics.totalUnits} units</span>
              <span className="text-[11px] text-slate-500 font-medium">Across all medicines</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoices Generated</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{salesMetrics.totalBills}</span>
              <span className="text-[11px] text-slate-500 font-medium">Customer bills</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Bill Value</span>
              <span className="text-2xl font-black text-teal-700 mt-1 block">₹{salesMetrics.avgBillValue}</span>
              <span className="text-[11px] text-slate-500 font-medium">Per patient transaction</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent High-Value Dispensing Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Medicines</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.slice(0, 10).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-800">{s.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{new Date(s.timestamp).toLocaleDateString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{s.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{s.items.map(i => i.medicineName).join(', ')}</td>
                      <td className="py-2.5 px-3">{s.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{s.grandTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Valuation */}
      {reportTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inventory Value</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">₹{inventoryMetrics.totalInventoryValue.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 font-medium">Valid purchasable stock</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Units In Stock</span>
              <span className="text-2xl font-black text-teal-700 mt-1 block">{inventoryMetrics.totalUnitsInStock} units</span>
              <span className="text-[11px] text-slate-500 font-medium">Across {medicines.length} medicines</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Batches Tracked</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{inventoryMetrics.totalLots}</span>
              <span className="text-[11px] text-slate-500 font-medium">Unique manufacturing lots</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Top Value Inventory Lines</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3">Manufacturer</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Unit Purchase Price</th>
                    <th className="py-2.5 px-3 text-right">Holding Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines
                    .map(m => ({ ...m, totalVal: m.currentStock * m.purchasePrice }))
                    .sort((a, b) => b.totalVal - a.totalVal)
                    .slice(0, 10)
                    .map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{m.manufacturer}</td>
                        <td className="py-2.5 px-3 font-bold">{m.currentStock} units</td>
                        <td className="py-2.5 px-3 text-slate-600">₹{m.purchasePrice}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{m.totalVal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expiry Risk */}
      {reportTab === 'expiry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-xs">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Expired Value (Loss)</span>
              <span className="text-2xl font-black text-red-600 mt-1 block">₹{expiryMetrics.expiredValue.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-red-700/80 font-medium">{expiryMetrics.expiredUnits} units quarantined</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-orange-200 bg-orange-50/20 shadow-xs">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Critical Expiry Value (&le;30d)</span>
              <span className="text-2xl font-black text-orange-600 mt-1 block">₹{expiryMetrics.criticalValue.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-orange-700/80 font-medium">{expiryMetrics.criticalUnits} units expiring soon</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Value At Risk</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">₹{expiryMetrics.totalRisk.toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 font-medium">Potential write-off exposure</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Recommendations Summary */}
      {reportTab === 'ai' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Active AI Recommendations Digest</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Lead Time</th>
                    <th className="py-2.5 px-3">Recommended Order</th>
                    <th className="py-2.5 px-3">Why?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          r.type === 'CRITICAL_RESTOCK' ? 'bg-red-600 text-white' :
                          r.type === 'DEMAND_SPIKE' ? 'bg-orange-500 text-white' :
                          r.type === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{r.medicineName}</td>
                      <td className="py-2.5 px-3 font-bold">{r.currentStock}</td>
                      <td className="py-2.5 px-3">{r.supplierLeadTime}d</td>
                      <td className="py-2.5 px-3 font-black text-teal-700">
                        {r.recommendedOrderQuantity > 0 ? `+${r.recommendedOrderQuantity} units` : '0'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-sm">{r.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
