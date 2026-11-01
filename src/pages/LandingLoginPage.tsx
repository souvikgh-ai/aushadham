import React, { useState } from 'react';
import {
  User,
  Building2,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  Cpu,
  Boxes,
  CheckCircle2,
  X,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { UserProfile, UserRole } from '../types/pharmacy';

interface LandingLoginPageProps {
  onLogin: (user: UserProfile) => void;
}

export const LandingLoginPage: React.FC<LandingLoginPageProps> = ({ onLogin }) => {
  const [showDemoTour, setShowDemoTour] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState<UserRole | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [activeTourTab, setActiveTourTab] = useState(0);

  // Form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [address, setAddress] = useState('');

  const handleInstantLaunch = (role: UserRole) => {
    if (role === 'customer') {
      onLogin({
        id: 'usr-patient-demo',
        name: 'Priya Sharma (Patient)',
        email: 'priya.sharma@example.com',
        phone: '+91 98860 12345',
        role: 'customer',
        address: 'Indiranagar, Bengaluru',
        coordinates: { lat: 12.9719, lng: 77.6412 }
      });
    } else {
      onLogin({
        id: 'usr-owner-demo',
        name: 'Ramesh Sharma (Pharmacy Owner)',
        email: 'ramesh.sharma@aushadham.in',
        phone: '+91 98450 12001',
        role: 'pharmacy_owner',
        pharmacyId: 'pharm_indiranagar',
        address: '100ft Road, Indiranagar, Bengaluru',
        coordinates: { lat: 12.9719, lng: 77.6412 }
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAuthForm) return;

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name || (showAuthForm === 'customer' ? 'Patient User' : 'Pharmacy Manager'),
      email: email || (showAuthForm === 'customer' ? 'patient@example.com' : 'manager@aushadham.in'),
      phone: '+91 98450 11223',
      role: showAuthForm,
      pharmacyId: showAuthForm === 'pharmacy_owner' ? 'pharm_indiranagar' : undefined,
      address: address || (showAuthForm === 'customer' ? 'Indiranagar, Bengaluru' : '100ft Rd, Indiranagar, Bengaluru'),
      coordinates: { lat: 12.9719, lng: 77.6412 }
    };

    onLogin(user);
  };

  const tourFeatures = [
    {
      title: 'Dual-Platform Real-Time Synchronization',
      icon: Layers,
      badge: 'Core Architecture',
      description: 'Pharmacy owners and customers communicate through a shared, synchronized inventory backend. When an owner records a sale at the POS, the customer discovery radar reflects the deducted stock in real time with negative inventory prevention.',
      highlights: [
        'Single source of truth across all 5 Bengaluru stores',
        'Immediate stock reflection without page reloads',
        'Transaction safety and audit logs for stock movements',
      ],
      role: 'customer' as UserRole,
      actionText: 'Experience Customer Radar'
    },
    {
      title: 'Location-Based Medicine Discovery & Haversine Radar',
      icon: Compass,
      badge: 'Customer Portal',
      description: 'Patients search for medicines by brand or generic salt name and instantly discover nearby pharmacies with verified in-stock quantities, calculated down to the decimal kilometer using the Haversine spherical formula.',
      highlights: [
        'Search by Brand, Salt, Strength, and Formulation',
        'Exact Haversine distance calculations from GPS/locality',
        'Real-time store stock availability and freshness timestamps',
        'One-click Google Maps navigation & medicine reservation',
      ],
      role: 'customer' as UserRole,
      actionText: 'Explore Medicine Search'
    },
    {
      title: 'Trained Machine Learning Demand Forecaster',
      icon: TrendingUp,
      badge: 'Trained ML Model',
      description: 'A multi-horizon Random Forest Regressor trained on 180 days of multi-pharmacy temporal sales data (10,800 records). Accurately predicts 7-day, 14-day, and 30-day medicine consumption with zero future data leakage.',
      highlights: [
        'Overall mean WAPE: 8.78% on held-out test split',
        '7-Day MAE: 16.39 units | 14-Day MAE: 27.17 units | 30-Day MAE: 42.19 units',
        'Considers 7d/14d/30d rolling velocity, lead times, and weekend factors',
      ],
      role: 'pharmacy_owner' as UserRole,
      actionText: 'View Demand Forecast Dashboard'
    },
    {
      title: 'Stockout Risk Prediction & Replenishment',
      icon: Zap,
      badge: 'Replenishment Engine',
      description: 'Predicts exact days until inventory depletion and automatically categorizes medicines into risk tiers: Critical (<= 2 days), High (3-7 days), Moderate (8-14 days), and Healthy (> 14 days).',
      highlights: [
        '99.90% classification accuracy on test evaluations',
        'Deterministic reorder point formula: Lead Time Demand + Safety Stock',
        'Recommended order quantities prevent stockouts and overstocking',
      ],
      role: 'pharmacy_owner' as UserRole,
      actionText: 'Inspect Replenishment Intel'
    },
    {
      title: 'Isolation Forest Anomaly & Surge Detection',
      icon: Cpu,
      badge: 'Anomaly Intelligence',
      description: 'An unsupervised Isolation Forest model analyzes sales velocity, rolling deviations, and inventory movements to flag viral outbreaks, sudden demand spikes, and stock discrepancies.',
      highlights: [
        'Calibrated with 4% contamination threshold',
        'Surge alerts automatically adjust safety buffers',
        'Flags abnormal dips and unusual batch movements',
      ],
      role: 'pharmacy_owner' as UserRole,
      actionText: 'View Owner Dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between relative z-10 backdrop-blur-md bg-slate-950/60 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black">
            <Boxes className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-lg tracking-tight">AUSHADHAM</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI ECOSYSTEM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Unified Pharmacy & Medicine Discovery
            </p>
          </div>
        </div>

        {/* Status Chip & Tour Action */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI Port 8001 Connected</span>
          </div>

          <button
            onClick={() => setShowDemoTour(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/40 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-spin" />
            <span>Prototype Demo Tour</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-16 flex flex-col justify-center relative z-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>Production ML Pipeline • Multi-Pharmacy Bengaluru Pilot</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Autonomous Pharmacy Intelligence Meets Real-Time Medicine Discovery
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Aushadham connects local pharmacies and patients through synchronized inventory, machine learning demand forecasting, stockout prevention, and location-based medicine discovery.
          </p>

          {/* Interactive Demo Tour CTA Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowDemoTour(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Explore Prototype Features Showcase</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dual Role Authentication Gateways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full pt-4">
          {/* Card 1: Customer / Patient Pathway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-teal-500/50 transition-all hover:shadow-xl hover:shadow-teal-900/10 group backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ROLE 1: PATIENT
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                  Customer & Patient Portal
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Discover medicines in nearby pharmacies with verified live inventory before traveling.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Search by Brand Name, Salt/Generic, Strength & Form</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Exact Haversine distance from your GPS location</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Live stock quantities & freshness timestamps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Direct phone calling & Google Maps route directions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>One-click medicine reservation for 2 hours</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 space-y-2 relative z-10">
              <button
                onClick={() => handleInstantLaunch('customer')}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/30"
              >
                <span>Enter as Patient (Instant Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowAuthForm('customer');
                  setIsRegister(false);
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign In or Register with Email
              </button>
            </div>
          </div>

          {/* Card 2: Pharmacy Owner Pathway */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-900/10 group backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ROLE 2: PHARMACY OWNER
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  Pharmacy Owner Platform
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Autonomous inventory intelligence, trained ML models, FEFO tracking, and POS billing.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Trained Random Forest 7d, 14d, 30d Demand Forecaster</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Days-to-Stockout Prediction & Risk Classification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Intelligent Replenishment (Lead Time Demand + Safety Stock)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Isolation Forest Anomaly & Prescription Surge Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time POS sale synchronization with Central Network</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 space-y-2 relative z-10">
              <button
                onClick={() => handleInstantLaunch('pharmacy_owner')}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-900/30"
              >
                <span>Enter as Pharmacy Owner (Store Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowAuthForm('pharmacy_owner');
                  setIsRegister(false);
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Sign In or Register Pharmacy
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Prototype Feature Showcase Modal */}
      {showDemoTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Interactive Prototype Showcase</h2>
                  <p className="text-xs text-slate-400">Comprehensive tour of Aushadham's verified features</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoTour(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feature Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 overflow-x-auto text-xs font-semibold p-1 gap-1">
              {tourFeatures.map((feat, idx) => (
                <button
                  key={feat.title}
                  onClick={() => setActiveTourTab(idx)}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTourTab === idx
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {feat.badge}
                </button>
              ))}
            </div>

            {/* Tour Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {(() => {
                const current = tourFeatures[activeTourTab];
                const Icon = current.icon;
                return (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                          Feature {activeTourTab + 1} of {tourFeatures.length}
                        </span>
                        <h3 className="text-xl font-black text-white">{current.title}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      {current.description}
                    </p>

                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Technical Highlights
                      </span>
                      <ul className="space-y-2 text-xs text-slate-200">
                        {current.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick Launch this Feature Demo */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                      <div className="text-xs text-slate-400">
                        Ready to test this feature in action?
                      </div>
                      <button
                        onClick={() => {
                          setShowDemoTour(false);
                          handleInstantLaunch(current.role);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all"
                      >
                        <span>{current.actionText}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <button
                disabled={activeTourTab === 0}
                onClick={() => setActiveTourTab(prev => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex gap-1.5">
                {tourFeatures.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setActiveTourTab(i)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                      activeTourTab === i ? 'bg-teal-400 w-4' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={activeTourTab === tourFeatures.length - 1}
                onClick={() => setActiveTourTab(prev => Math.min(tourFeatures.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-400 hover:text-teal-300 disabled:opacity-40"
              >
                Next Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal when clicking Sign In / Register */}
      {showAuthForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-lg font-black text-white">
                  {showAuthForm === 'customer' 
                    ? (isRegister ? 'Register Patient Account' : 'Patient Sign In')
                    : (isRegister ? 'Register Verified Pharmacy' : 'Pharmacy Owner Sign In')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {showAuthForm === 'customer' ? 'Access medicine radar' : 'Manage pharmacy operations'}
                </p>
              </div>
              <button
                onClick={() => setShowAuthForm(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-3.5 text-xs">
              {isRegister && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {showAuthForm === 'pharmacy_owner' && isRegister && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Pharmacy Name</label>
                  <input
                    type="text"
                    required
                    value={pharmacyName}
                    onChange={e => setPharmacyName(e.target.value)}
                    placeholder="e.g. Aushadham Care"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {isRegister && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Locality / Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  defaultValue="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-md mt-2"
              >
                {isRegister ? 'Complete Sign Up' : 'Authenticate & Enter'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-teal-400 hover:underline"
                >
                  {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
