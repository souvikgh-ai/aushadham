import React from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MedicineDetailModal } from './components/MedicineDetailModal';
import { RoleLoginModal } from './components/RoleLoginModal';

// Pages
import { LandingLoginPage } from './pages/LandingLoginPage';
import { CustomerDiscoveryPage } from './pages/CustomerDiscoveryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConsolidatedInventoryPage } from './pages/ConsolidatedInventoryPage';
import { ConsolidatedPosPage } from './pages/ConsolidatedPosPage';
import { ConsolidatedAIPage } from './pages/ConsolidatedAIPage';
import { ConsolidatedProcurementPage } from './pages/ConsolidatedProcurementPage';
import { PharmacyNetworkPage } from './pages/PharmacyNetworkPage';
import { CustomerRequestsPage } from './pages/CustomerRequestsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { 
    activePage, 
    selectedMedicineDetail, 
    setSelectedMedicineDetail,
    isAuthenticated,
    login,
    userRole,
    setUserRole,
    currentUser,
    setCurrentUser,
    isAuthModalOpen,
    setIsAuthModalOpen
  } = usePharmacy();

  // Whenever user opens website or logs out, land on the Login & Demo page
  if (!isAuthenticated) {
    return <LandingLoginPage onLogin={login} />;
  }

  const renderActivePage = () => {
    // Strict RBAC: Patients access Customer Discovery
    if (userRole === 'customer') {
      return <CustomerDiscoveryPage />;
    }

    // Consolidated Pharmacy Owner Architecture (9 Parts)
    switch (activePage) {
      // 1. OVERVIEW
      case 'overview':
      case 'dashboard':
        return <DashboardPage />;

      // 2. INVENTORY (Catalogue, Batches, Expiry, Movements)
      case 'inventory':
      case 'medicines':
      case 'expiry':
        return <ConsolidatedInventoryPage />;

      // 3. POS & SALES (POS Billing, Sales History & Invoices)
      case 'pos_sales':
      case 'pos':
      case 'sales':
        return <ConsolidatedPosPage />;

      // 4. AI INTELLIGENCE (Forecast, Stockout, Replenish, XAI, Seasonal, Anomalies)
      case 'ai_intelligence':
      case 'forecast':
      case 'recommendations':
      case 'alerts':
        return <ConsolidatedAIPage />;

      // 5. PROCUREMENT (Purchase Orders, Delivery Receiving, Suppliers, Reorder)
      case 'procurement':
      case 'po':
      case 'suppliers':
        return <ConsolidatedProcurementPage />;

      // 6. PHARMACY NETWORK (Inter-Pharmacy Stock Transfers, Surplus Matchmaker)
      case 'network':
        return <PharmacyNetworkPage />;

      // 7. CUSTOMER REQUESTS (Medicine Reservations & Pickup Lifecycle)
      case 'reservations':
        return <CustomerRequestsPage />;

      // 8. REPORTS (Analytics & Reports)
      case 'reports':
        return <ReportsPage />;

      // 9. SETTINGS (Pharmacy Profile & Preferences)
      case 'settings':
        return <SettingsPage />;

      // Customer preview if accessed
      case 'discovery':
        return <CustomerDiscoveryPage />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Consolidated Sidebar */}
      <Sidebar />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Streamlined Top Header */}
        <Header />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Medicine Quick View Modal */}
      {selectedMedicineDetail && (
        <MedicineDetailModal
          medicine={selectedMedicineDetail}
          onClose={() => setSelectedMedicineDetail(null)}
        />
      )}

      {/* Role Switch & Sign In Modal */}
      <RoleLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSwitchRole={(role) => setUserRole(role)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setUserRole(user.role);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PharmacyProvider>
      <AppContent />
    </PharmacyProvider>
  );
};

export default App;
