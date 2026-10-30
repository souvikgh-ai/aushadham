import React from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MedicineDetailModal } from './components/MedicineDetailModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PosBillingPage } from './pages/PosBillingPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { InventoryPage } from './pages/InventoryPage';
import { ExpiryMonitorPage } from './pages/ExpiryMonitorPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { DemandForecastPage } from './pages/DemandForecastPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activePage, selectedMedicineDetail, setSelectedMedicineDetail } = usePharmacy();

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pos':
        return <PosBillingPage />;
      case 'medicines':
        return <MedicinesPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'expiry':
        return <ExpiryMonitorPage />;
      case 'recommendations':
        return <RecommendationsPage />;
      case 'forecast':
        return <DemandForecastPage />;
      case 'sales':
        return <SalesHistoryPage />;
      case 'po':
        return <PurchaseOrdersPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'alerts':
        return <AlertCenterPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* 13-item Sidebar */}
      <Sidebar />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Medicine Detail Modal */}
      <MedicineDetailModal
        medicine={selectedMedicineDetail}
        onClose={() => setSelectedMedicineDetail(null)}
      />
    </div>
  );
};

export function App() {
  return (
    <PharmacyProvider>
      <AppContent />
    </PharmacyProvider>
  );
}

export default App;
