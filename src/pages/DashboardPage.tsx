import React, { useMemo } from 'react';
import { 
  Pill, 
  IndianRupee, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Wallet, 
  Sparkles, 
  ShoppingCart, 
  ArrowRight,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { calculateAverageDailySales } from '../services/inventoryEngine';

export const DashboardPage: React.FC = () => {
  const { 
    medicines, 
    batches, 
    sales, 
    kpis, 
    recommendations, 
    setActivePage,
    quickOrderForMedicine,
    purchaseOrders
  } = usePharmacy();

  // Top critical recommendations: cleanly separating STOCKOUT vs EXPIRY
  const stockoutAlerts = useMemo(() => {
    return recommendations.filter(r => r.type === 'CRITICAL_RESTOCK' || r.type === 'LOW_STOCK');
  }, [recommendations]);

  const expiryAlerts = useMemo(() => {
    return recommendations.filter(r => r.type === 'EXPIRY_RISK');
  }, [recommendations]);

  // Top selling medicines (last 30 days)
  const topFastMovers = useMemo(() => {
    const medSalesMap: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        medSalesMap[item.medicineId] = (medSalesMap[item.medicineId] || 0) + item.quantity;
      });
    });

    return Object.entries(medSalesMap)
      .map(([id, unitsSold]) => {
        const med = medicines.find(m => m.id === id);
        if (!med) return null;
        const ads = calculateAverageDailySales(med.id, sales, 30);
        return {
          medicine: med,
          unitsSold,
          ads,
          currentStock: med.currentStock,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [sales, medicines]);

  // Pending purchase orders
  const pendingOrders = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'Ordered');
  }, [purchaseOrders]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* A. Concise Greeting & Quick POS Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Store Overview & Operations
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time pharmacy status, AI replenishment signals, and priority actionable alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('pos_sales')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Billing</span>
          </button>
          <button
            onClick={() => setActivePage('ai_intelligence')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>AI Intelligence ({recommendations.length})</span>
          </button>
        </div>
      </div>

      {/* C. Compact AI Intelligence Summary Section (Replaces oversized vertical banner) */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-teal-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 mb-2">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>AI Intelligence Summary</span>
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Continuous Demand & Stockout Surveillance</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every bill processed immediately updates batch stock, recalibrates expiry risk, and predicts stockout horizons before shelves run empty.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Stockout Risks</div>
              <div className="text-lg font-black text-rose-400">{kpis.predictedStockoutCount}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Expiring (&lt;90d)</div>
              <div className="text-lg font-black text-amber-400">{kpis.expiringSoonCount}</div>
            </div>
            <button
              onClick={() => setActivePage('ai_intelligence')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>View AI Intel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* D. Exactly 6 Balanced KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Medicines */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Medicines</span>
            <Pill className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.totalMedicines}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Active catalogue</div>
        </div>

        {/* 2. Today's Sales */}
        <div 
          onClick={() => setActivePage('pos_sales')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <IndianRupee className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{kpis.todaySales.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">{kpis.todayBillsCount} bills processed</div>
        </div>

        {/* 3. Low Stock Items */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Low Stock</span>
            <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.lowStockCount}</div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">Near reorder point</div>
        </div>

        {/* 4. Expiring Medicines */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-orange-200/80 bg-orange-50/20 shadow-xs hover:border-orange-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-orange-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Expiring Soon</span>
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-orange-600">{kpis.expiringSoonCount}</div>
          <div className="text-[10px] text-orange-700 mt-1 font-medium">&lt; 90 days remaining</div>
        </div>

        {/* 5. Stockout Risks */}
        <div 
          onClick={() => setActivePage('ai_intelligence')} 
          className="bg-white p-4 rounded-xl border border-red-200/80 bg-red-50/20 shadow-xs hover:border-red-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Stockout Risk</span>
            <TrendingDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-600">{kpis.predictedStockoutCount}</div>
          <div className="text-[10px] text-red-700 mt-1 font-medium">Depletion &lt; lead time</div>
        </div>

        {/* 6. Inventory Valuation */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Valuation</span>
            <Wallet className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-slate-900 truncate">₹{kpis.inventoryValue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Non-expired purchase cost</div>
        </div>
      </div>

      {/* E & Part 8: Actionable Alerts Feed (Deduplicated & Cleanly Separated) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <span>Priority Actionable Alerts</span>
            </h2>
            <p className="text-xs text-slate-500">
              Only immediate operational alerts requiring pharmacy intervention. Stockout risks are strictly decoupled from expiry risks.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. Imminent Stockout Alert */}
          {stockoutAlerts.slice(0, 1).map((rec) => (
            <div key={rec.medicineId} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white">
                      Imminent Stockout
                    </span>
                    <span className="text-xs font-bold text-slate-900">{rec.medicineName}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{rec.why}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                    <span>Stock: <strong>{rec.currentStock} units</strong></span>
                    <span>•</span>
                    <span>Daily Velocity: <strong>{rec.averageDailySales} units/day</strong></span>
                    <span>•</span>
                    <span>Depletion: <strong>~{rec.predictedStockoutDays} days</strong></span>
                    <span>•</span>
                    <span>Lead Time: <strong>{rec.supplierLeadTime} days</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => quickOrderForMedicine(rec.medicineId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </button>
            </div>
          ))}

          {/* 2. Critical Expiry & Wastage Alert (Corrected Part 8 logic: No "Create Purchase Order") */}
          {expiryAlerts.slice(0, 1).map((rec) => (
            <div key={rec.medicineId} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-white">
                      Expiry & Wastage Risk
                    </span>
                    <span className="text-xs font-bold text-slate-900">{rec.medicineName}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{rec.why}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                    <span>Stock: <strong>{rec.currentStock} units</strong></span>
                    <span>•</span>
                    <span>Daily Sales Velocity: <strong>{rec.averageDailySales} units/day</strong></span>
                    <span>•</span>
                    <span className="text-amber-800 font-semibold">Do not restock zero-velocity medicine approaching expiry</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActivePage('inventory')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Inspect Batch & Return</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* 3. Pending Purchase Orders Arrival */}
          {pendingOrders.slice(0, 1).map((po) => (
            <div key={po.id} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                      Incoming Delivery
                    </span>
                    <span className="text-xs font-bold text-slate-900">{po.poNumber} • {po.supplierName}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {po.items.length} items ordered on {new Date(po.orderDate).toLocaleDateString()}. Expected: {po.expectedDeliveryDate}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePage('procurement')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Track in Procurement</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {stockoutAlerts.length === 0 && expiryAlerts.length === 0 && pendingOrders.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              All operational metrics are within healthy limits.
            </div>
          )}
        </div>
      </div>

      {/* F. Concise Analytics & Top Fast Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast Moving Medicines */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Fast-Moving Medicines (30-Day Velocity)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Highest daily unit turnover requiring prioritized shelf availability.</p>
            </div>
            <button
              onClick={() => setActivePage('reports')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {topFastMovers.map((item, idx) => (
              <div key={item.medicine.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{item.medicine.name}</div>
                    <div className="text-[10px] text-slate-500">{item.medicine.category}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 font-mono">{item.unitsSold} units sold</div>
                  <div className="text-[10px] text-slate-500">~{item.ads.toFixed(1)} units/day</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health Ratio */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Catalogue Health Summary</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Healthy Stock</span>
                <span className="text-emerald-700">{kpis.healthCounts.healthy} items</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${(kpis.healthCounts.healthy / Math.max(1, kpis.totalMedicines)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Low Stock</span>
                <span className="text-amber-700">{kpis.healthCounts.low} items</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full" 
                  style={{ width: `${(kpis.healthCounts.low / Math.max(1, kpis.totalMedicines)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Critical / Stockout Risk</span>
                <span className="text-rose-700">{kpis.healthCounts.critical} items</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full" 
                  style={{ width: `${(kpis.healthCounts.critical / Math.max(1, kpis.totalMedicines)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Total active batch tracking: <strong>{batches.length} registered batches</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
