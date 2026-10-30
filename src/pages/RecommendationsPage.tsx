import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Truck, 
  Eye
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { RecommendationType } from '../types/pharmacy';

export const RecommendationsPage: React.FC = () => {
  const { 
    recommendations, 
    medicines, 
    quickOrderForMedicine, 
    setSelectedMedicineDetail 
  } = usePharmacy();

  const [filterType, setFilterType] = useState<'ALL' | RecommendationType>('ALL');

  const filteredRecs = useMemo(() => {
    if (filterType === 'ALL') return recommendations;
    return recommendations.filter(r => r.type === filterType);
  }, [recommendations, filterType]);

  const getTypeBadge = (type: RecommendationType) => {
    switch (type) {
      case 'CRITICAL_RESTOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center gap-1 shadow-xs">
            <AlertOctagon className="w-3 h-3" />
            <span>CRITICAL RESTOCK</span>
          </span>
        );
      case 'DEMAND_SPIKE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white flex items-center gap-1 shadow-xs">
            <TrendingUp className="w-3 h-3" />
            <span>DEMAND SPIKE</span>
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>LOW STOCK</span>
          </span>
        );
      case 'EXPIRY_RISK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>EXPIRY RISK</span>
          </span>
        );
      case 'OVERSTOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>OVERSTOCK</span>
          </span>
        );
      case 'SLOW_MOVING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>SLOW MOVING</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            AI Inventory Intelligence & Reorder Engine
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              Autonomous Assistant
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Explainable pharmacy procurement guidance: exactly WHAT, WHY, WHEN, and HOW MUCH to purchase.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'ALL', label: `All Recommendations (${recommendations.length})` },
          { id: 'CRITICAL_RESTOCK', label: 'Critical Restock' },
          { id: 'DEMAND_SPIKE', label: 'Demand Surge' },
          { id: 'LOW_STOCK', label: 'Low Stock' },
          { id: 'EXPIRY_RISK', label: 'Expiry Risk' },
          { id: 'OVERSTOCK', label: 'Overstock' },
          { id: 'SLOW_MOVING', label: 'Slow Moving' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] flex-shrink-0 ${
              filterType === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecs.map(rec => {
          const med = medicines.find(m => m.id === rec.medicineId);

          return (
            <div 
              key={rec.id}
              className={`rounded-2xl p-5 border bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                rec.priority === 'critical' ? 'border-red-300 ring-1 ring-red-500/10' :
                rec.priority === 'high' ? 'border-amber-300' :
                'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(rec.type)}
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        From {rec.supplierName}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {rec.what}
                    </h3>
                    <p className="text-[11px] text-teal-800 font-semibold">{rec.genericName}</p>
                  </div>
                </div>

                {/* Key Metrics Pill Grid */}
                <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Current Stock</span>
                    <span className={`font-black ${rec.currentStock <= rec.safetyStock ? 'text-red-600' : 'text-slate-800'}`}>
                      {rec.currentStock}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Daily Velocity</span>
                    <span className="font-bold text-slate-800">{rec.averageDailySales}/d</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Stockout Est.</span>
                    <span className={`font-bold ${rec.predictedStockoutDays !== null && rec.predictedStockoutDays <= rec.supplierLeadTime ? 'text-red-600' : 'text-slate-800'}`}>
                      {rec.predictedStockoutDays !== null ? `~${rec.predictedStockoutDays}d` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Lead Time</span>
                    <span className="font-bold text-slate-800">{rec.supplierLeadTime}d</span>
                  </div>
                </div>

                {/* The 4 Core Answers: WHAT, WHY, WHEN, HOW MUCH */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="font-black text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5">
                      Why?
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {rec.why}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                      <span className="font-black text-amber-900 block text-[10px] uppercase tracking-wider">
                        When?
                      </span>
                      <p className="text-amber-800 font-semibold text-[11px] leading-tight mt-0.5">
                        {rec.when}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-teal-50/60 border border-teal-100">
                      <span className="font-black text-teal-900 block text-[10px] uppercase tracking-wider">
                        How Much?
                      </span>
                      <p className="text-teal-800 font-bold text-[11px] leading-tight mt-0.5">
                        {rec.howMuch}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                <button
                  onClick={() => {
                    if (med) setSelectedMedicineDetail(med);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Medicine</span>
                </button>

                {rec.recommendedOrderQuantity > 0 ? (
                  <button
                    onClick={() => quickOrderForMedicine(rec.medicineId)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Create Purchase Order</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium italic">
                    No PO Required
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
