import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  CloudRain, 
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { DemandForecastPage } from './DemandForecastPage';
import { RecommendationsPage } from './RecommendationsPage';
import { usePharmacy } from '../context/PharmacyContext';
import type { ExplainableAIResponse, SeasonalIntelligenceResponse } from '../types/pharmacy';

export const ConsolidatedAIPage: React.FC = () => {
  const { medicines, recommendations, alerts } = usePharmacy();
  const [activeTab, setActiveTab] = useState<'forecast' | 'stockout' | 'replenish' | 'anomalies' | 'xai' | 'seasonal' | 'metrics'>('forecast');

  // Explainable AI State
  const [selectedMedId, setSelectedMedId] = useState<string>('med-azi-500');
  const [xaiData, setXaiData] = useState<ExplainableAIResponse | null>(null);
  const [isXaiLoading, setIsXaiLoading] = useState<boolean>(false);

  // Seasonal Intelligence State
  const [seasonalData, setSeasonalData] = useState<SeasonalIntelligenceResponse | null>(null);

  // Fetch XAI explanation
  const fetchXai = async (medId: string) => {
    setIsXaiLoading(true);
    try {
      const res = await fetch(`/api/ml/explain/${medId}`);
      if (res.ok) {
        const data = await res.json();
        setXaiData(data);
      }
    } catch (err) {
      console.error('Failed to load XAI explanation:', err);
    } finally {
      setIsXaiLoading(false);
    }
  };

  // Fetch Seasonal Intel
  const fetchSeasonal = async () => {
    try {
      const res = await fetch('/api/ml/seasonal-intelligence');
      if (res.ok) {
        const data = await res.json();
        setSeasonalData(data);
      }
    } catch (err) {
      console.error('Failed to load seasonal data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'xai') {
      fetchXai(selectedMedId);
    } else if (activeTab === 'seasonal') {
      fetchSeasonal();
    }
  }, [activeTab, selectedMedId]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600" />
            <span>AI Intelligence & Machine Learning</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Trained Random Forest regressors, Isolation Forest anomaly models, explainable feature attributions, and Bengaluru seasonal epidemiological intelligence.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'forecast'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Demand Forecasting</span>
          </button>

          <button
            onClick={() => setActiveTab('replenish')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'replenish'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Replenishment</span>
            {recommendations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white font-bold">
                {recommendations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('xai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'xai'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explainable AI (XAI)</span>
          </button>

          <button
            onClick={() => setActiveTab('seasonal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'seasonal'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            <span>Seasonal Demand</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'anomalies'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Anomaly Radar</span>
            {alerts.filter(a => a.type === 'DEMAND_SPIKE').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {alerts.filter(a => a.type === 'DEMAND_SPIKE').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Demand Forecasting Page */}
      {activeTab === 'forecast' && <DemandForecastPage />}

      {/* Tab 2: Smart Replenishment Page */}
      {activeTab === 'replenish' && <RecommendationsPage />}

      {/* Tab 3: Explainable AI (XAI) */}
      {activeTab === 'xai' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Transparent Machine Learning</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Why did the ML model generate this prediction?</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Inspect the exact feature weights, velocity ratios, lead-time differentials, and seasonal factors contributing to inventory risk predictions.
                </p>
              </div>

              {/* Medicine Selector */}
              <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-medium pl-2">Medicine:</span>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-400"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.strength})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchXai(selectedMedId)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                  title="Refresh XAI"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isXaiLoading ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* XAI Factors Card */}
          {xaiData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Inference Verdict</span>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-sm font-black text-indigo-950">{xaiData.medicine_name}</div>
                  <div className="text-xs font-bold text-indigo-700 mt-1">{xaiData.primary_recommendation}</div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-indigo-200/60 text-xs">
                    <span className="text-slate-600">Model Confidence:</span>
                    <span className="font-extrabold text-emerald-600">{(xaiData.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Methodology:</strong> {xaiData.methodology}
                </div>
              </div>

              {/* Attribution Breakdown */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Feature Attribution & Impact Drivers</span>
                </h3>

                <div className="space-y-3">
                  {xaiData.contributing_factors.map((factor, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">{factor.factor_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                            factor.impact.startsWith('+') ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {factor.impact}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {factor.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 flex-shrink-0">
                        {factor.direction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Seasonal Demand Intelligence */}
      {activeTab === 'seasonal' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-900/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30 mb-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span>Epidemiological & Meteorological Trends</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Bengaluru Regional Seasonal Intelligence</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Historical seasonal patterns, monsoon/winter respiratory surges, and weekday/weekend refill rhythms observed across city pharmacies.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-right">
                <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Active Season</span>
                <div className="text-sm font-extrabold text-white mt-0.5">Winter / Post-Monsoon</div>
                <div className="text-[10px] text-slate-300">Bengaluru Urban</div>
              </div>
            </div>
          </div>

          {seasonalData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Surges */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Active Category Seasonal Multipliers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seasonalData.active_demand_trends.map((trend, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{trend.category}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {trend.surge_percentage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        <strong>Peak Window:</strong> {trend.peak_months}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {trend.driver}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trend.key_medicines.map((m, mIdx) => (
                          <span key={mIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar & Weekend Effects */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Calendar & Refill Effects</h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Weekend Multiplier</span>
                    <span className="text-xs font-black text-teal-700">+{((seasonalData.calendar_effects.weekend_multiplier - 1) * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {seasonalData.calendar_effects.weekend_explanation}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Month-End Refill Surge</span>
                    <span className="text-xs font-black text-teal-700">+{((seasonalData.calendar_effects.month_end_multiplier - 1) * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {seasonalData.calendar_effects.month_end_explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Anomaly Radar */}
      {activeTab === 'anomalies' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>Isolation Forest Inventory Anomaly Radar</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detects sudden sales velocity spikes, off-hours batch deductions, or sudden physical stock divergence.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.filter(a => a.type === 'DEMAND_SPIKE').length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">No anomalous patterns detected</div>
                <p className="text-xs text-slate-500 mt-1">All sales velocities and batch deductions are tracking within the 96% confidence interval.</p>
              </div>
            ) : (
              alerts.filter(a => a.type === 'DEMAND_SPIKE').map((alt) => (
                <div key={alt.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-extrabold text-amber-900">{alt.title}</div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alt.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
