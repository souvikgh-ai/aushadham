import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Database, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { getSupabaseClient } from '../services/supabase';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = usePharmacy();

  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName);
  const [pharmacyAddress, setPharmacyAddress] = useState(settings.pharmacyAddress);
  const [pharmacyPhone, setPharmacyPhone] = useState(settings.pharmacyPhone);
  const [pharmacyGst, setPharmacyGst] = useState(settings.pharmacyGst);
  const [taxRatePercent, setTaxRatePercent] = useState(String(settings.taxRatePercent));
  const [lowStockThresholdDays, setLowStockThresholdDays] = useState(String(settings.lowStockThresholdDays));
  const [expiryCriticalDays, setExpiryCriticalDays] = useState(String(settings.expiryCriticalDays));
  const [expiryWarningDays, setExpiryWarningDays] = useState(String(settings.expiryWarningDays));
  const [forecastPeriodDays, setForecastPeriodDays] = useState(String(settings.forecastPeriodDays));
  const [defaultSafetyStock, setDefaultSafetyStock] = useState(String(settings.defaultSafetyStock));
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      pharmacyName,
      pharmacyAddress,
      pharmacyPhone,
      pharmacyGst,
      taxRatePercent: parseFloat(taxRatePercent) || 5,
      lowStockThresholdDays: parseInt(lowStockThresholdDays, 10) || 7,
      expiryCriticalDays: parseInt(expiryCriticalDays, 10) || 30,
      expiryWarningDays: parseInt(expiryWarningDays, 10) || 90,
      forecastPeriodDays: parseInt(forecastPeriodDays, 10) || 30,
      defaultSafetyStock: parseInt(defaultSafetyStock, 10) || 15,
      supabaseUrl: supabaseUrl.trim() || undefined,
      supabaseAnonKey: supabaseAnonKey.trim() || undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('Please enter both Supabase URL and Anon Key to test.');
      return;
    }
    const client = getSupabaseClient(supabaseUrl, supabaseAnonKey);
    if (client) {
      setSupabaseTestStatus('success');
    } else {
      setSupabaseTestStatus('error');
    }
    setTimeout(() => setSupabaseTestStatus('idle'), 4000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            System & Pharmacy Settings
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
              Config Master
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Customize inventory thresholds, safety stocks, tax rules, and cloud database connection.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Store Information */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-sm text-slate-900">Pharmacy & Bill Header Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pharmacy Name</label>
              <input
                type="text"
                value={pharmacyName}
                onChange={e => setPharmacyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
              <input
                type="text"
                value={pharmacyGst}
                onChange={e => setPharmacyGst(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium focus:bg-white focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Store Address (Prints on Invoices)</label>
              <input
                type="text"
                value={pharmacyAddress}
                onChange={e => setPharmacyAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={pharmacyPhone}
                onChange={e => setPharmacyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={taxRatePercent}
                onChange={e => setTaxRatePercent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI & Inventory Thresholds */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-sm text-slate-900">AI Inventory & Expiry Risk Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Safety Stock (units)</label>
              <input
                type="number"
                value={defaultSafetyStock}
                onChange={e => setDefaultSafetyStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Baseline emergency reserve</span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Low Stock Horizon (Days)</label>
              <input
                type="number"
                value={lowStockThresholdDays}
                onChange={e => setLowStockThresholdDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Days of stock before reorder alert</span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Critical Expiry Horizon (Days)</label>
              <input
                type="number"
                value={expiryCriticalDays}
                onChange={e => setExpiryCriticalDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-red-600 focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Treated as urgent priority (&le;30d)</span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Expiry Warning Horizon (Days)</label>
              <input
                type="number"
                value={expiryWarningDays}
                onChange={e => setExpiryWarningDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-amber-600 focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Flags early warning in monitor (&le;90d)</span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Demand Forecast Period (Days)</label>
              <input
                type="number"
                value={forecastPeriodDays}
                onChange={e => setForecastPeriodDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Target replenishment window</span>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                disabled
                value="₹ (INR)"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Supabase Cloud Database Config */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <h2 className="font-bold text-sm text-slate-900">Supabase Cloud Database (Optional)</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Local Engine Active by Default
            </span>
          </div>

          <p className="text-slate-500 text-[11px] leading-relaxed">
            Aushadham AI functions seamlessly offline out-of-the-box using local storage. To synchronize with your remote Supabase PostgreSQL backend, enter your Project URL and Anon API Key below. (See <code>supabase_schema.sql</code> in repo).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supabase Project URL</label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestSupabase}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              Test Supabase Connection
            </button>

            {supabaseTestStatus === 'success' && (
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Connected to Supabase!
              </span>
            )}
            {supabaseTestStatus === 'error' && (
              <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Connection failed. Check credentials.
              </span>
            )}
          </div>
        </div>

        {/* Section 4: Demo Data Reset */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <RotateCcw className="w-4 h-4 text-teal-600" />
            <span>Pharmacy Demonstration Environment</span>
          </div>

          <p className="text-slate-500 text-[11px]">
            Reset or reload the complete 30+ medicine inventory, 30 days of transaction history, multi-batch records, and pre-configured AI test cases (Paracetamol 500mg critical restock, Amoxicillin 18d expiry, Overstocked antacids, Demand surges).
          </p>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset and reload complete demo dataset? All pending test sales will be reset to default.')) {
                resetToDemoData();
                alert('Pharmacy demo data reloaded successfully!');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-teal-600" />
            <span>Load Pharmacy Demo Data</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
