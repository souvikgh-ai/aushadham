import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  Sparkles, 
  Truck, 
  Network, 
  Users, 
  FileText, 
  Settings, 
  Pill, 
  ArrowLeftRight,
  LogOut,
  Compass
} from 'lucide-react';
import { usePharmacy, type NavigationPage } from '../context/PharmacyContext';

interface SidebarNavItem {
  id: NavigationPage;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { 
    activePage, 
    setActivePage, 
    kpis, 
    recommendations,
    userRole,
    currentUser,
    setIsAuthModalOpen,
    logout
  } = usePharmacy();

  // Part 1: Exactly 9 Consolidated Navigation Sections for Pharmacy Owner
  const ownerNavItems: SidebarNavItem[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: LayoutDashboard 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Boxes,
      badge: kpis.lowStockCount > 0 ? kpis.lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    { 
      id: 'pos_sales', 
      label: 'POS & Sales', 
      icon: ShoppingCart 
    },
    { 
      id: 'ai_intelligence', 
      label: 'AI Intelligence', 
      icon: Sparkles,
      badge: recommendations.length > 0 ? recommendations.length : undefined,
      badgeColor: 'bg-teal-500 text-white font-black animate-pulse'
    },
    { 
      id: 'procurement', 
      label: 'Procurement', 
      icon: Truck 
    },
    { 
      id: 'network', 
      label: 'Pharmacy Network', 
      icon: Network 
    },
    { 
      id: 'reservations', 
      label: 'Customer Requests', 
      icon: Users 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileText 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings 
    },
  ];

  // Navigation Items for Customer / Patient View
  const customerNavItems: SidebarNavItem[] = [
    { id: 'discovery', label: 'Medicine Discovery & Radar', icon: Compass },
  ];

  const currentNav = userRole === 'customer' ? customerNavItems : ownerNavItems;

  // Active check helper supporting legacy aliases
  const isItemActive = (itemId: NavigationPage) => {
    if (activePage === itemId) return true;
    if (itemId === 'overview' && activePage === 'dashboard') return true;
    if (itemId === 'inventory' && (activePage === 'medicines' || activePage === 'expiry')) return true;
    if (itemId === 'pos_sales' && (activePage === 'pos' || activePage === 'sales')) return true;
    if (itemId === 'ai_intelligence' && (activePage === 'forecast' || activePage === 'recommendations' || activePage === 'alerts')) return true;
    if (itemId === 'procurement' && (activePage === 'po' || activePage === 'suppliers')) return true;
    return false;
  };

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
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              {userRole === 'customer' ? 'Patient Portal' : 'Pharmacy OS'}
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <div className="mt-3 px-2 py-1.5 rounded-lg bg-teal-950/40 border border-teal-800/40 flex items-center gap-2 text-[11px] text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>
            {userRole === 'customer' ? 'Live Pharmacy Stock Radar' : 'Sync Active • Bengaluru Store'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          {userRole === 'customer' ? 'Patient Navigation' : 'Pharmacy Management'}
        </div>

        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.id);
          const hasBadge = typeof item.badge === 'number' && item.badge > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {hasBadge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account Section & Single Switch/Logout Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {/* User Profile Card */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Account</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
              userRole === 'customer' ? 'bg-blue-900/60 text-blue-300' : 'bg-emerald-900/60 text-emerald-300'
            }`}>
              {userRole === 'customer' ? 'Patient' : 'Pharmacy Owner'}
            </span>
          </div>
          <div className="font-bold text-slate-200 mt-1 truncate">{currentUser.name}</div>
          <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
        </div>

        {/* Single Switch Role Action */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Switch User Role</span>
        </button>

        {/* Single Exit / Logout Control */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit to Gateway</span>
        </button>
      </div>
    </aside>
  );
};
