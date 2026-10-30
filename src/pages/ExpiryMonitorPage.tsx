import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Search, 
  ShieldAlert, 
  ArrowRight
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { getDaysToExpiry, getExpiryStatus } from '../services/inventoryEngine';
import type { ExpiryStatus } from '../types/pharmacy';

export const ExpiryMonitorPage: React.FC = () => {
  const { medicines, batches, settings, setSelectedMedicineDetail } = usePharmacy();
  const [filterTier, setFilterTier] = useState<'ALL' | ExpiryStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Enriched batch expiry records
  const expiryRecords = useMemo(() => {
    return batches
      .filter(b => b.quantity > 0)
      .map(batch => {
        const med = medicines.find(m => m.id === batch.medicineId);
        const daysLeft = getDaysToExpiry(batch.expiryDate);
        const status = getExpiryStatus(batch.expiryDate, settings);
        const inventoryValue = batch.quantity * batch.purchasePrice;

        // Dynamic explainable recommendation
        let actionRecommendation = '';
        if (daysLeft <= 0) {
          actionRecommendation = 'DO NOT DISPENSE: Quarantined by FEFO lock. Place in pharmacy red bin & claim supplier credit note.';
        } else if (daysLeft <= 30) {
          actionRecommendation = 'CRITICAL: Prioritize this batch for sale via FEFO where clinically appropriate, or initiate distributor return exchange.';
        } else if (daysLeft <= 90) {
          actionRecommendation = 'EXPIRING SOON: FEFO will automatically dispense this batch first. Monitor sales burn rate.';
        } else {
          actionRecommendation = 'SAFE: Normal inventory holding. Standard stock monitoring.';
        }

        return {
          batch,
          medicine: med,
          daysLeft,
          status,
          inventoryValue,
          actionRecommendation,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [batches, medicines, settings]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let expiredCount = 0;
    let expiredValue = 0;
    let criticalCount = 0;
    let criticalValue = 0;
    let soonCount = 0;
    let soonValue = 0;
    let safeCount = 0;

    expiryRecords.forEach(r => {
      if (r.status === 'EXPIRED') {
        expiredCount++;
        expiredValue += r.inventoryValue;
      } else if (r.status === 'CRITICAL') {
        criticalCount++;
        criticalValue += r.inventoryValue;
      } else if (r.status === 'EXPIRING_SOON') {
        soonCount++;
        soonValue += r.inventoryValue;
      } else {
        safeCount++;
      }
    });

    const totalAtRiskValue = expiredValue + criticalValue + soonValue;

    return {
      expiredCount,
      expiredValue,
      criticalCount,
      criticalValue,
      soonCount,
      soonValue,
      safeCount,
      totalAtRiskValue,
    };
  }, [expiryRecords]);

  // Filtered view
  const filteredRecords = useMemo(() => {
    return expiryRecords.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        r.medicine?.name.toLowerCase().includes(q) ||
        r.batch.batchNumber.toLowerCase().includes(q) ||
        r.medicine?.genericName.toLowerCase().includes(q);

      const matchesTier = filterTier === 'ALL' || r.status === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [expiryRecords, searchQuery, filterTier]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Medicine Expiry Monitor
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Real-time Risk Tracking
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Proactively protect patients from expired drugs and eliminate pharmacy inventory write-offs.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Expired */}
        <div 
          onClick={() => setFilterTier(filterTier === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterTier === 'EXPIRED' ? 'ring-2 ring-red-500 bg-red-50/50' : 'bg-white hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Expired Batches</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-700">{metrics.expiredCount}</div>
          <div className="text-[11px] text-red-600/80 font-medium mt-1">
            Loss: ₹{metrics.expiredValue.toLocaleString('en-IN')} (Quarantined)
          </div>
        </div>

        {/* Critical */}
        <div 
          onClick={() => setFilterTier(filterTier === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterTier === 'CRITICAL' ? 'ring-2 ring-red-400 bg-red-50/30' : 'bg-white hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Critical (&le; 30 Days)</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600">{metrics.criticalCount}</div>
          <div className="text-[11px] text-red-600/80 font-medium mt-1">
            Value at risk: ₹{metrics.criticalValue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Expiring Soon */}
        <div 
          onClick={() => setFilterTier(filterTier === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterTier === 'EXPIRING_SOON' ? 'ring-2 ring-amber-400 bg-amber-50/40' : 'bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Expiring Soon (31-90 Days)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.soonCount}</div>
          <div className="text-[11px] text-amber-700/80 font-medium mt-1">
            Exposure: ₹{metrics.soonValue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Safe */}
        <div 
          onClick={() => setFilterTier(filterTier === 'SAFE' ? 'ALL' : 'SAFE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterTier === 'SAFE' ? 'ring-2 ring-emerald-500 bg-emerald-50/30' : 'bg-white hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Safe (&gt; 90 Days)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.safeCount}</div>
          <div className="text-[11px] text-emerald-700/80 font-medium mt-1">
            Healthy shelf lifetime
          </div>
        </div>
      </div>

      {/* Amoxicillin 500mg Highlight Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-200 text-amber-800 mt-0.5 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Amoxicillin 500mg (Batch AMX2408)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-red-600 text-white">
                18 DAYS REMAINING
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              Stock: <strong>24 units</strong> • Inventory Value: <strong>₹1,920</strong> • Expiry Date: <strong>{new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</strong>
            </p>
            <p className="text-slate-700 font-semibold mt-1">
              Recommendation: “Prioritize this batch for sale where legally and clinically appropriate, or review procurement/stock handling with distributor.”
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const med = medicines.find(m => m.id === 'med-amx-500');
            if (med) setSelectedMedicineDetail(med);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs self-start md:self-auto flex items-center gap-1.5"
        >
          <span>Inspect Batch</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by medicine or batch number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {(['ALL', 'EXPIRED', 'CRITICAL', 'EXPIRING_SOON', 'SAFE'] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] flex-shrink-0 ${
                filterTier === tier
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier === 'ALL' ? 'All Batches' : tier.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Expiry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-3">Batch Number</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Days Remaining</th>
                <th className="py-3 px-3">Inventory Value</th>
                <th className="py-3 px-4">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(item => (
                <tr 
                  key={item.batch.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => item.medicine && setSelectedMedicineDetail(item.medicine)}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.medicine?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-teal-800 font-semibold">{item.medicine?.genericName}</div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-700">
                    {item.batch.batchNumber}
                  </td>

                  <td className="py-3 px-3 font-black text-slate-900">
                    {item.batch.quantity} units
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.batch.expiryDate}
                  </td>

                  <td className="py-3 px-3">
                    {item.daysLeft <= 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                        EXPIRED ({Math.abs(item.daysLeft)}d ago)
                      </span>
                    ) : item.daysLeft <= 30 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                        {item.daysLeft} days (CRITICAL)
                      </span>
                    ) : item.daysLeft <= 90 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                        {item.daysLeft} days (EXPIRING)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.daysLeft} days (SAFE)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-800">
                    ₹{item.inventoryValue.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-4 max-w-md">
                    <div className="text-[11px] text-slate-700 leading-snug font-medium">
                      {item.actionRecommendation}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
