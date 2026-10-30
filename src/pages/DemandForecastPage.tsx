import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Zap, 
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { usePharmacy } from '../context/PharmacyContext';

export const DemandForecastPage: React.FC = () => {
  const { demandForecasts, medicines, setSelectedMedicineDetail, quickOrderForMedicine } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedId, setSelectedMedId] = useState<string>(demandForecasts[0]?.medicineId || '');

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return demandForecasts.filter(df => {
      const q = searchQuery.toLowerCase().trim();
      return !q || df.medicineName.toLowerCase().includes(q) || df.category.toLowerCase().includes(q);
    });
  }, [demandForecasts, searchQuery]);

  // Active selected forecast for the detailed comparison chart
  const activeForecast = demandForecasts.find(df => df.medicineId === selectedMedId) || demandForecasts[0];
  const activeMed = medicines.find(m => m.id === activeForecast?.medicineId);

  // Demand Spike items
  const demandSpikeItems = useMemo(() => {
    return demandForecasts.filter(df => df.isDemandSpike);
  }, [demandForecasts]);

  // Chart comparison data for active medicine
  const chartData = useMemo(() => {
    if (!activeForecast) return [];
    return [
      { name: '7 Days', Forecast: activeForecast.forecast7Day, Historical: Math.round(activeForecast.averageDailySales * 7) },
      { name: '14 Days', Forecast: activeForecast.forecast14Day, Historical: Math.round(activeForecast.averageDailySales * 14) },
      { name: '30 Days', Forecast: activeForecast.forecast30Day, Historical: Math.round(activeForecast.averageDailySales * 30) },
    ];
  }, [activeForecast]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Demand Forecast & Trend Intelligence
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
              WMA Model
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Predict patient demand across 7, 14, and 30-day horizons with sudden surge detection.
          </p>
        </div>

        <div className="p-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto border border-slate-200">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Forecast method: Weighted Moving Average</span>
        </div>
      </div>

      {/* Demand Spike Notice if any */}
      {demandSpikeItems.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
            <Zap className="w-5 h-5 text-orange-600 animate-pulse" />
            <span>Demand Spike Detected ({demandSpikeItems.length} Medicines surging)</span>
          </div>
          <p className="text-xs text-slate-700">
            Recent prescription velocity has increased significantly above historical baseline. Procurement safety buffers have been dynamically adjusted.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {demandSpikeItems.map(item => (
              <div key={item.medicineId} className="p-2.5 rounded-xl bg-white/90 border border-orange-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{item.medicineName}</div>
                  <div className="text-[10px] text-orange-700 font-bold">
                    +{item.spikePercentage}% Surge vs 30d baseline
                  </div>
                </div>
                <button
                  onClick={() => quickOrderForMedicine(item.medicineId)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Adjust PO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Interactive Detail Card */}
      {activeForecast && activeMed && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Selected Medicine Projection
            </div>
            <h2 className="text-xl font-black text-slate-900">{activeForecast.medicineName}</h2>
            <p className="text-xs text-teal-800 font-semibold">{activeMed.genericName}</p>

            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Daily Velocity</span>
                <span className="text-base font-black text-slate-900">{activeForecast.averageDailySales}</span>
                <span className="text-[9px] text-slate-400 block">units / day</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-center">
                <span className="text-[10px] text-teal-700 block font-medium">14d Projected</span>
                <span className="text-base font-black text-teal-800">{activeForecast.forecast14Day}</span>
                <span className="text-[9px] text-teal-600 block">units</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">30d Projected</span>
                <span className="text-base font-black text-slate-900">{activeForecast.forecast30Day}</span>
                <span className="text-[9px] text-slate-400 block">units</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setSelectedMedicineDetail(activeMed)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Inspect All Batches
              </button>
              <button
                onClick={() => quickOrderForMedicine(activeMed.id)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              >
                Create Reorder PO
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Historical" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Forecast" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Forecast Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search demand forecast by medicine..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredForecasts.length} medicine forecasts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Avg Daily Sales</th>
                <th className="py-3 px-3">7-Day Forecast</th>
                <th className="py-3 px-3">14-Day Forecast</th>
                <th className="py-3 px-3">30-Day Forecast</th>
                <th className="py-3 px-3">Surge Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForecasts.map(df => {
                const isSelected = df.medicineId === activeForecast?.medicineId;
                return (
                  <tr 
                    key={df.medicineId}
                    onClick={() => setSelectedMedId(df.medicineId)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{df.medicineName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{df.category}</div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800">
                      {df.currentStock} units
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {df.averageDailySales}/d
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      ~{df.forecast7Day} units
                    </td>

                    <td className="py-3 px-3 font-bold text-teal-800">
                      ~{df.forecast14Day} units
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      ~{df.forecast30Day} units
                    </td>

                    <td className="py-3 px-3">
                      {df.isDemandSpike ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                          Surge (+{df.spikePercentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Normal</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedMedId(df.medicineId)}
                        className="text-teal-600 hover:text-teal-800 font-bold hover:underline"
                      >
                        Compare
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
