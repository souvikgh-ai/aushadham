import React, { useState } from 'react';
import {
  User,
  Building2,
  Lock,
  Mail,
  MapPin,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import type { UserProfile, UserRole } from '../types/pharmacy';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onSwitchRole: (role: UserRole) => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('customer');
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name || (activeTab === 'customer' ? 'Patient User' : 'Store Manager'),
      email: email || (activeTab === 'customer' ? 'patient@example.com' : 'manager@aushadham.in'),
      phone: '+91 98450 11000',
      role: activeTab,
      pharmacyId: activeTab === 'pharmacy_owner' ? 'pharm_indiranagar' : undefined,
      address: address || (activeTab === 'customer' ? 'Indiranagar, Bengaluru' : '100ft Rd, Indiranagar, Bengaluru'),
      coordinates: { lat: 12.9719, lng: 77.6412 }
    };

    onLoginSuccess(newUser);
    onClose();
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    if (role === 'customer') {
      const demoCustomer: UserProfile = {
        id: 'usr-cust-demo',
        name: 'Priya Sharma (Patient)',
        email: 'priya.sharma@gmail.com',
        phone: '+91 98860 12345',
        role: 'customer',
        address: 'Indiranagar, Bengaluru',
        coordinates: { lat: 12.9719, lng: 77.6412 }
      };
      onLoginSuccess(demoCustomer);
    } else {
      const demoOwner: UserProfile = {
        id: 'usr-owner-demo',
        name: 'Ramesh Sharma (Pharmacy Owner)',
        email: 'owner@aushadham.in',
        phone: '+91 98450 12001',
        role: 'pharmacy_owner',
        pharmacyId: 'pharm_indiranagar',
        address: '100ft Road, Indiranagar, Bengaluru',
        coordinates: { lat: 12.9719, lng: 77.6412 }
      };
      onLoginSuccess(demoOwner);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
              Aushadham Unified Portal
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Select Authentication Pathway</h2>
          <p className="text-xs text-teal-100 mt-1">
            Role-Based Access Control: Choose your role to access your personalized experience.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('customer')}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'customer'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-teal-600" />
            <span>Customer / Patient</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacy_owner')}
            className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pharmacy_owner'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Pharmacy Owner</span>
          </button>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Quick Test Sign-In:</span>
          </div>
          <button
            onClick={() => handleQuickDemoLogin(activeTab)}
            className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            One-Click Login as {activeTab === 'customer' ? 'Patient' : 'Store Owner'}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center pb-2">
            <p className="text-sm font-extrabold text-slate-800">
              {activeTab === 'customer' 
                ? (isRegister ? 'Create Patient Account' : 'Sign in as Patient / Customer')
                : (isRegister ? 'Register Verified Pharmacy' : 'Sign in to Pharmacy Operations')}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'customer'
                ? 'Search nearby medicines, check live inventory, and reserve items.'
                : 'Manage inventory, record sales, review ML forecasts and restock alerts.'}
            </p>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'pharmacy_owner' && isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacy Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="e.g. Aushadham Care Pharmacy"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacy Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full street address & locality"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                defaultValue="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md mt-2"
          >
            <span>{isRegister ? 'Complete Registration' : `Log In as ${activeTab === 'customer' ? 'Patient' : 'Store Owner'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-teal-700 hover:underline font-semibold"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
