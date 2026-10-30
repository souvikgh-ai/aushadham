import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { AlertType } from '../types/pharmacy';

export const AlertCenterPage: React.FC = () => {
  const { alerts, resolveAlert, quickOrderForMedicine, setSelectedMedicineDetail, medicines } = usePharmacy();
  const [filterType, setFilterType] = useState<'ALL' | AlertType>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'STOCKOUT':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'EXPIRY':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'DEMAND_SPIKE':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'OVERSTOCK':
        return <Layers className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Real-Time Alert Center
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
              {alerts.length} Active Triggers
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Autonomous notifications on stockout exposure, expiring lots, and demand anomalies.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 no-scrollbar">
        {[
          { id: 'ALL', label: `All Alerts (${alerts.length})` },
          { id: 'STOCKOUT', label: '🔴 Stockout Risk' },
          { id: 'EXPIRY', label: '🟠 Expiry Risk' },
          { id: 'LOW_STOCK', label: '🟡 Low Stock' },
          { id: 'DEMAND_SPIKE', label: '🔵 Demand Spike' },
          { id: 'OVERSTOCK', label: '🟣 Overstock' },
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

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
            <h3 className="font-bold text-slate-800 text-sm">All Clear! No Active Alerts</h3>
            <p className="text-xs text-slate-500 mt-1">Inventory stock levels and expiry dates are within normal operating bounds.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const med = medicines.find(m => m.id === alert.medicineId);

            return (
              <div 
                key={alert.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  alert.severity === 'critical' ? 'border-red-300 bg-red-50/20' :
                  alert.severity === 'high' ? 'border-orange-300' :
                  'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl mt-0.5 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-100' :
                    alert.severity === 'high' ? 'bg-orange-100' :
                    'bg-slate-100'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        alert.severity === 'critical' ? 'bg-red-600 text-white' :
                        alert.severity === 'high' ? 'bg-orange-600 text-white' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                      {alert.batchNumber && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          Batch: {alert.batchNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {alert.description}
                    </p>

                    <div className="text-[11px] text-teal-800 font-semibold bg-teal-50/70 p-1.5 rounded-lg border border-teal-100 max-w-xl">
                      <strong>Recommended Action:</strong> {alert.recommendedAction}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                      Triggered: {new Date(alert.timestamp).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    onClick={() => {
                      if (med) setSelectedMedicineDetail(med);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                  >
                    View Medicine
                  </button>

                  {alert.type === 'STOCKOUT' || alert.type === 'LOW_STOCK' || alert.type === 'DEMAND_SPIKE' ? (
                    <button
                      onClick={() => quickOrderForMedicine(alert.medicineId)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Mark as resolved / Dismiss"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
