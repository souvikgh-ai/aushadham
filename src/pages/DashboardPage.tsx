import React, { useState, useMemo } from 'react';
import { 
  Pill, 
  IndianRupee, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Wallet, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Zap, 
  Package, 
  ShoppingCart, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { usePharmacy } from '../context/PharmacyContext';
import { calculateAverageDailySales } from '../services/inventoryEngine';

export const DashboardPage: React.FC = () => {
  const { 
    medicines, 
    sales, 
    kpis, 
    recommendations, 
    setActivePage, 
    setSelectedMedicineDetail,
    quickOrderForMedicine
  } = usePharmacy();

  const [salesTimeframe, setSalesTimeframe] = useState<'7' | '30' | '90'>('7');

  // Chart data for Sales Overview
  const salesChartData = useMemo(() => {
    const days = parseInt(salesTimeframe, 10);
    const now = new Date();
    const dataMap: { [dateStr: string]: { date: string; displayDate: string; revenue: number; bills: number; units: number } } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dataMap[isoDate] = { date: isoDate, displayDate, revenue: 0, bills: 0, units: 0 };
    }

    sales.forEach(s => {
      const sDate = s.timestamp.split('T')[0];
      if (dataMap[sDate]) {
        dataMap[sDate].revenue += s.grandTotal;
        dataMap[sDate].bills += 1;
        const totalItemsInSale = s.items.reduce((sum, item) => sum + item.quantity, 0);
        dataMap[sDate].units += totalItemsInSale;
      }
    });

    return Object.values(dataMap);
  }, [sales, salesTimeframe]);

  // Aggregate totals for the selected timeframe
  const timeframeTotals = useMemo(() => {
    return salesChartData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      bills: acc.bills + curr.bills,
      units: acc.units + curr.units,
    }), { revenue: 0, bills: 0, units: 0 });
  }, [salesChartData]);

  // Donut chart data for Pharmacy Health
  const healthData = useMemo(() => {
    return [
      { name: 'Healthy', value: kpis.healthCounts.healthy, color: '#10b981' },
      { name: 'Low Stock', value: kpis.healthCounts.low, color: '#f59e0b' },
      { name: 'Critical', value: kpis.healthCounts.critical, color: '#ef4444' },
      { name: 'Expiring Soon', value: kpis.healthCounts.expiring, color: '#f97316' },
      { name: 'Overstock', value: kpis.healthCounts.overstock, color: '#8b5cf6' },
    ].filter(item => item.value > 0);
  }, [kpis.healthCounts]);

  // Top Most Sold Medicines
  const topMedicines = useMemo(() => {
    const medSalesMap: { [medId: string]: number } = {};

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

  // Top critical recommendation for immediate attention
  const criticalRec = recommendations.find(r => r.type === 'CRITICAL_RESTOCK') || recommendations[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Good Morning, Pharmacist
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Here’s what your pharmacy inventory needs today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('pos')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open Pharmacy POS</span>
          </button>
          <button
            onClick={() => setActivePage('recommendations')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>AI Actions ({recommendations.length})</span>
          </button>
        </div>
      </div>

      {/* Section 41: Dashboard Hero Workflow Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-teal-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 mb-2">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Inventory Intelligence</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Your pharmacy inventory, continuously analyzed.</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every bill processed immediately updates batch stock, recalibrates expiry risks, and predicts stockout timing before you run dry.
            </p>
          </div>

          {/* Visual Workflow Steps */}
          <div className="flex-1 max-w-xl">
            <div className="grid grid-cols-5 gap-1.5 items-center">
              {[
                { step: '1', title: 'BILLING', sub: 'FEFO checkout', icon: ShoppingCart },
                { step: '2', title: 'INVENTORY', sub: 'Auto deducted', icon: Package },
                { step: '3', title: 'AI ANALYSIS', sub: 'Burn velocity', icon: Activity },
                { step: '4', title: 'FORECAST', sub: 'WMA projection', icon: TrendingUp },
                { step: '5', title: 'ACTION', sub: 'Reorder PO', icon: CheckCircle2 },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center">
                    <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 text-center transition-all hover:bg-white/10">
                      <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] font-black text-white tracking-wide">{item.title}</div>
                      <div className="text-[9px] text-slate-300 truncate">{item.sub}</div>
                    </div>
                    {idx < 4 && (
                      <div className="mx-1 text-teal-400 font-bold text-xs opacity-60 hidden sm:block">→</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 7 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total Medicines */}
        <div 
          onClick={() => setActivePage('medicines')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Medicines</span>
            <Pill className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.totalMedicines}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Active catalog</div>
        </div>

        {/* 2. Today's Sales */}
        <div 
          onClick={() => setActivePage('sales')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <IndianRupee className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{kpis.todaySales.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">{kpis.todayBillsCount} bills today</div>
        </div>

        {/* 3. Low Stock */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Low Stock</span>
            <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.lowStockCount}</div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">Near reorder point</div>
        </div>

        {/* 4. Expiring Soon */}
        <div 
          onClick={() => setActivePage('expiry')} 
          className="bg-white p-4 rounded-xl border border-orange-200/80 bg-orange-50/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-orange-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Expiring Soon</span>
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-orange-600">{kpis.expiringSoonCount}</div>
          <div className="text-[10px] text-orange-700 mt-1 font-medium">&lt; 90 days remaining</div>
        </div>

        {/* 5. Predicted Stockouts */}
        <div 
          onClick={() => setActivePage('recommendations')} 
          className="bg-white p-4 rounded-xl border border-red-200/80 bg-red-50/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Stockouts</span>
            <TrendingDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-600">{kpis.predictedStockoutCount}</div>
          <div className="text-[10px] text-red-700 mt-1 font-medium">Within lead time</div>
        </div>

        {/* 6. Inventory Value */}
        <div 
          onClick={() => setActivePage('inventory')} 
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inventory Value</span>
            <Wallet className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-slate-900 truncate">₹{kpis.inventoryValue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Valid purchase cost</div>
        </div>

        {/* 7. AI Recommendations */}
        <div 
          onClick={() => setActivePage('recommendations')} 
          className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-teal-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Intel</span>
            <Sparkles className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-teal-700">{kpis.recommendationsCount}</div>
          <div className="text-[10px] text-teal-800 mt-1 font-semibold">Actionable insights</div>
        </div>
      </div>

      {/* Critical Spotlight Alert Banner */}
      {criticalRec && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-700 mt-0.5 flex-shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                  Critical Restock Required
                </span>
                <span className="text-xs font-bold text-slate-700">{criticalRec.medicineName}</span>
              </div>
              <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                {criticalRec.why}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-600">
                <span>Stock: <strong>{criticalRec.currentStock} units</strong></span>
                <span>•</span>
                <span>Velocity: <strong>{criticalRec.averageDailySales} units/day</strong></span>
                <span>•</span>
                <span>Depletion: <strong>~{criticalRec.predictedStockoutDays} days</strong></span>
                <span>•</span>
                <span>Supplier Lead Time: <strong>{criticalRec.supplierLeadTime} days</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => quickOrderForMedicine(criticalRec.medicineId)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Create Purchase Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const med = medicines.find(m => m.id === criticalRec.medicineId);
                if (med) setSelectedMedicineDetail(med);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all"
            >
              View Medicine
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Health Donut & Sales Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 7: Pharmacy Health Donut Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pharmacy Health</h2>
                <p className="text-xs text-slate-500 font-medium">Inventory segmentation status</p>
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Live Audit
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} Medicines`, name]} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-medium">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50/60 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>🟢 Healthy ({kpis.healthCounts.healthy})</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50/60 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>🟡 Low Stock ({kpis.healthCounts.low})</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-red-50/60 text-red-800">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>🔴 Critical ({kpis.healthCounts.critical})</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-orange-50/60 text-orange-800">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>🟠 Expiring ({kpis.healthCounts.expiring})</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 p-1.5 rounded-lg bg-purple-50/60 text-purple-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>🟣 Overstock ({kpis.healthCounts.overstock})</span>
            </div>
          </div>
        </div>

        {/* Section 8: Sales Analytics with 7/30/90 days toggle */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pharmacy Sales Overview</h2>
                <p className="text-xs text-slate-500 font-medium">Daily transaction revenue and volume trends</p>
              </div>

              {/* Timeframe Pill Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                {(['7', '30', '90'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSalesTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      salesTimeframe === tf 
                        ? 'bg-white text-slate-900 shadow-xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Summary Figures */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Period Revenue</span>
                <span className="text-base font-black text-slate-900">₹{timeframeTotals.revenue.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Bills Generated</span>
                <span className="text-base font-black text-slate-900">{timeframeTotals.bills}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Units Dispensed</span>
                <span className="text-base font-black text-teal-600">{timeframeTotals.units}</span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [
                      name === 'revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : val,
                      name === 'revenue' ? 'Revenue' : name === 'bills' ? 'Bills' : 'Units Sold'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#revenueGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Section 9: Top Medicines (Most Sold) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Most Sold Medicines</h2>
            <p className="text-xs text-slate-500 font-medium">Top high-velocity products in your dispensary</p>
          </div>
          <button
            onClick={() => setActivePage('forecast')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View Full Demand Forecast</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="pb-2.5">Medicine</th>
                <th className="pb-2.5">Units Sold (30d)</th>
                <th className="pb-2.5">Daily Sales Velocity</th>
                <th className="pb-2.5">Current Stock</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topMedicines.map((item, idx) => {
                const stockDays = item.ads > 0 ? Math.round(item.currentStock / item.ads) : 999;
                return (
                  <tr key={item.medicine.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div>{item.medicine.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{item.medicine.genericName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-slate-700">{item.unitsSold} units</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-100">
                        {item.ads} units/day
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-900">{item.currentStock} units</span>
                      <span className="text-[10px] text-slate-400 block">~{stockDays} days supply</span>
                    </td>
                    <td className="py-3">
                      {item.currentStock <= item.medicine.safetyStock ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[10px]">
                          LOW BUFFER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedMedicineDetail(item.medicine)}
                        className="text-teal-600 hover:text-teal-800 font-bold hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
