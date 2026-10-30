import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Boxes, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  History, 
  Truck, 
  Building2, 
  Bell, 
  FileText, 
  Settings, 
  RotateCcw
} from 'lucide-react';
import { usePharmacy, type NavigationPage } from '../context/PharmacyContext';

export const Sidebar: React.FC = () => {
  const { 
    activePage, 
    setActivePage, 
    kpis, 
    alerts, 
    recommendations, 
    resetToDemoData 
  } = usePharmacy();

  const navItems: { id: NavigationPage; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Pharmacy POS / Billing', icon: ShoppingCart },
    { id: 'medicines', label: 'Medicines', icon: Pill, badge: kpis.totalMedicines, badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'expiry', label: 'Expiry Monitor', icon: Clock, badge: kpis.expiringSoonCount, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badge: recommendations.length, badgeColor: 'bg-teal-500 text-white animate-pulse' },
    { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'sales', label: 'Sales History', icon: History },
    { id: 'po', label: 'Purchase Orders', icon: Truck },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alerts.length, badgeColor: 'bg-red-500 text-white' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-900/30 text-white">
            <Pill className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">AUSHADHAM</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Autonomous Inventory</p>
          </div>
        </div>

        <div className="mt-3 px-2 py-1.5 rounded-lg bg-teal-950/40 border border-teal-800/40 flex items-center gap-2 text-[11px] text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>Real-time FEFO Engine Active</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Action & Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <button
          onClick={() => {
            if (confirm('Reload the full 30+ medicines, 30 days of sales history, batches and AI test scenarios?')) {
              resetToDemoData();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700/60 transition-all hover:border-teal-500/40"
          title="Reset to fresh demo dataset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Load Pharmacy Demo Data</span>
        </button>

        <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Pharmacist Online
          </span>
          <span className="text-[10px] text-slate-500">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
