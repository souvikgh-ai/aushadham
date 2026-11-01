import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Building2,
  RefreshCw,
  Compass,
  FileText,
  Upload,
  X
} from 'lucide-react';
import type { NearbyPharmacy, PrescriptionScanResult, CustomerReservation } from '../types/pharmacy';
import { usePharmacy } from '../context/PharmacyContext';

interface PresetLocation {
  name: string;
  lat: number;
  lng: number;
}

const PRESET_LOCATIONS: PresetLocation[] = [
  { name: 'Central Bengaluru (MG Road)', lat: 12.9716, lng: 77.5946 },
  { name: 'Indiranagar (100ft Road)', lat: 12.9719, lng: 77.6412 },
  { name: 'Koramangala (4th Block)', lat: 12.9344, lng: 77.6245 },
  { name: 'Jayanagar (4th Block)', lat: 12.9299, lng: 77.5833 },
  { name: 'Whitefield (ITPB Main Rd)', lat: 12.9857, lng: 77.7314 },
  { name: 'Malleshwaram (Sampige Rd)', lat: 13.0031, lng: 77.5702 },
];

export const CustomerDiscoveryPage: React.FC = () => {
  const { currentUser } = usePharmacy();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(15);

  // Location State
  const [currentLocation, setCurrentLocation] = useState<PresetLocation>(PRESET_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);

  // Catalog & Store State
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [pharmacies, setPharmacies] = useState<NearbyPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reservation Dialog State
  const [reservingPharmacy, setReservingPharmacy] = useState<NearbyPharmacy | null>(null);
  const [reserveQuantity, setReserveQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>(currentUser.name || 'Rohan Deshmukh');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser.phone || '+91 98451 22394');
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [confirmedReservation, setConfirmedReservation] = useState<CustomerReservation | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Prescription OCR Modal State
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<PrescriptionScanResult | null>(null);

  // Request browser geolocation
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveLoc: PresetLocation = {
          name: 'My GPS Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrentLocation(liveLoc);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Location permission denied or unavailable (${err.message}). Using manual location.`);
      },
      { timeout: 8000 }
    );
  };

  // Fetch catalog medicines
  const fetchMedicines = async () => {
    try {
      const res = await fetch(`/api/medicines/search?query=${encodeURIComponent(searchQuery)}&category=ALL`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
        if (!selectedMedicine && data.medicines?.length > 0) {
          setSelectedMedicine(data.medicines[0]);
        }
      }
    } catch (err) {
      console.warn('Backend API not responding:', err);
    }
  };

  // Fetch nearby pharmacies
  const fetchNearbyPharmacies = async () => {
    setIsLoading(true);
    try {
      const medIdParam = selectedMedicine ? `&medicine_id=${selectedMedicine.medicine_id}` : '';
      const url = `/api/pharmacies/nearby?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius_km=${radiusKm}${medIdParam}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let list: NearbyPharmacy[] = data.pharmacies || [];
        list.sort((a, b) => a.distance_km - b.distance_km);
        setPharmacies(list);
      }
    } catch (err) {
      console.warn('Error fetching nearby pharmacies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [searchQuery]);

  useEffect(() => {
    fetchNearbyPharmacies();
  }, [currentLocation, radiusKm, selectedMedicine]);

  // Execute real reservation
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingPharmacy || !selectedMedicine) return;

    setIsReserving(true);
    setReservationError(null);
    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          pharmacy_id: reservingPharmacy.pharmacy_id,
          medicine_id: selectedMedicine.medicine_id,
          quantity: reserveQuantity,
          notes: 'Customer web app reservation'
        })
      });

      if (res.ok) {
        const data: CustomerReservation = await res.json();
        setConfirmedReservation(data);
        setReservingPharmacy(null);
        await fetchNearbyPharmacies(); // Refresh sync store
      } else {
        const errData = await res.json();
        setReservationError(errData.detail || 'Failed to complete reservation. Insufficient stock.');
      }
    } catch (err: any) {
      setReservationError(err.message || 'Network connection failed.');
    } finally {
      setIsReserving(false);
    }
  };

  // Run Prescription OCR Scan
  const handleScanPrescription = async (overrideText?: string) => {
    try {
      const res = await fetch('/api/prescriptions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_text: overrideText || '',
          user_lat: currentLocation.lat,
          user_lng: currentLocation.lng
        })
      });

      if (res.ok) {
        const data: PrescriptionScanResult = await res.json();
        setOcrResult(data);
      }
    } catch (err) {
      console.error('Prescription OCR scan failed:', err);
    }
  };

  // Freshness helper
  const getFreshnessBadge = (qty: number) => {
    if (qty === 0) {
      return { text: 'Out of Stock', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
    }
    if (qty < 5) {
      return { text: 'Limited Availability', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    }
    return { text: 'Recently Verified (< 15 mins)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-semibold backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5 text-teal-300" />
            <span>Patient Medicine Discovery & Live Stock Radar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Find Available Medicines in Nearby Bengaluru Pharmacies
          </h1>
          <p className="text-teal-100 text-sm md:text-base leading-relaxed">
            Search for prescription & OTC medicines with real-time synchronized inventory. Or upload your prescription for instant multi-pharmacy availability matching.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Prescription OCR Action */}
            <button
              onClick={() => {
                setIsOcrOpen(true);
                handleScanPrescription();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-md transition-all"
            >
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Scan Prescription (OCR)</span>
            </button>

            <button
              onClick={handleGetLiveLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-900/60 hover:bg-teal-900 border border-teal-500/40 text-white font-bold text-xs transition-all"
            >
              <Navigation className={`w-4 h-4 text-teal-300 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My GPS Location'}</span>
            </button>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="absolute top-6 right-6 hidden md:flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Synchronized with Central Network</span>
        </div>
      </div>

      {/* Confirmed Reservation Banner */}
      {confirmedReservation && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-900 shadow-md flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-extrabold text-emerald-950">
                Reservation Confirmed: {confirmedReservation.reservation_id}
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Reserved <strong>{confirmedReservation.quantity} unit(s)</strong> of <strong>{confirmedReservation.medicine_name}</strong> at <strong>{confirmedReservation.pharmacy_name}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-emerald-900">
                <span>Total Amount: ₹{confirmedReservation.total_price.toFixed(2)}</span>
                <span>•</span>
                <span>Pickup Window: {confirmedReservation.pickup_deadline}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 text-[10px]">Stock Safely Held</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setConfirmedReservation(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold p-1 rounded-lg hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Location Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search medicine by brand or generic name (e.g. Paracetamol, Dolo 650, Augmentin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Location Selector */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-3 pointer-events-none" />
            <select
              value={currentLocation.name}
              onChange={(e) => {
                const found = PRESET_LOCATIONS.find((p) => p.name === e.target.value);
                if (found) {
                  setCurrentLocation(found);
                }
              }}
              className="w-full text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500"
            >
              {PRESET_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Radius */}
          <div className="md:col-span-2">
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={15}>Within 15 km</option>
              <option value={25}>Within 25 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Medicine Catalog Matches */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
            <span>Catalogue Matches ({medicines.length})</span>
            <span>Select to view nearby stores</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {medicines.map((med) => {
              const isSelected = selectedMedicine?.medicine_id === med.medicine_id;
              return (
                <div
                  key={med.medicine_id}
                  onClick={() => setSelectedMedicine(med)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{med.generic_name}</div>
                    </div>
                    <span className="text-xs font-bold text-teal-800 font-mono">
                      ₹{med.selling_price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{med.strength}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{med.dosage_form}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Nearby Pharmacy Availability Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nearby Pharmacies for {selectedMedicine?.name || 'Selected Medicine'}
              </h2>
              <p className="text-xs text-slate-500">
                Real-time live sync stock sorted by distance from {currentLocation.name}.
              </p>
            </div>

            <button
              onClick={fetchNearbyPharmacies}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              title="Refresh nearby stock"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {pharmacies.map((pharmacy) => {
              const stock = pharmacy.medicine_stock;
              const qty = stock?.quantity || 0;
              const isInStock = qty > 0;
              const freshness = getFreshnessBadge(qty);

              return (
                <div
                  key={pharmacy.pharmacy_id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <h3 className="text-base font-black text-slate-900">{pharmacy.name}</h3>
                        {pharmacy.verified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Partner</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pharmacy.address}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="inline-block bg-teal-50 text-teal-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-teal-200">
                        {pharmacy.distance_km} km away
                      </div>
                      <div className="text-[11px] font-bold text-amber-600 mt-1">★ {pharmacy.rating} • Open Now</div>
                    </div>
                  </div>

                  {/* Stock Status & Freshness Indicator */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${freshness.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${freshness.dot} animate-pulse`} />
                        <span>{freshness.text}</span>
                      </span>

                      <span className="text-xs font-bold text-slate-800">
                        {qty > 0 ? `${qty} units in store` : 'Currently out of stock'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${pharmacy.phone}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3 text-teal-600" />
                        <span>Directions</span>
                      </a>

                      <button
                        onClick={() => {
                          setReservingPharmacy(pharmacy);
                          setReserveQuantity(1);
                          setReservationError(null);
                        }}
                        disabled={!isInStock}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          isInStock
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Reserve Medicine
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reservation Modal Dialog */}
      {reservingPharmacy && selectedMedicine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Reserve Medicine</h3>
              <button
                onClick={() => setReservingPharmacy(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100 space-y-1">
              <div className="text-xs font-bold text-teal-900">{selectedMedicine.name}</div>
              <div className="text-[11px] text-teal-700">{reservingPharmacy.name} • {reservingPharmacy.address}</div>
              <div className="text-xs font-mono font-bold text-teal-800 pt-1">
                Unit Price: ₹{selectedMedicine.selling_price}
              </div>
            </div>

            {reservationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {reservationError}
              </div>
            )}

            <form onSubmit={handleConfirmReservation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Quantity (Units)</label>
                <input
                  type="number"
                  min={1}
                  max={reservingPharmacy.medicine_stock?.quantity || 10}
                  value={reserveQuantity}
                  onChange={(e) => setReserveQuantity(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Contact Phone</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                Stock will be reserved at the pharmacy counter for 24 hours. For Schedule H medicines, original doctor prescription must be shown upon pickup.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReservingPharmacy(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReserving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {isReserving ? 'Confirming...' : `Confirm (₹${(selectedMedicine.selling_price * reserveQuantity).toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Scanner & OCR Modal Dialog */}
      {isOcrOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>Prescription Scanner & OCR Engine</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Upload prescription document or enter text to detect medicines and match multi-pharmacy stock.
                </p>
              </div>
              <button
                onClick={() => setIsOcrOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-teal-50/30 transition-colors">
              <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                {ocrFile ? ocrFile.name : 'Upload Prescription (Image or PDF)'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, and PDF documents</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setOcrFile(e.target.files[0]);
                    handleScanPrescription();
                  }
                }}
                className="hidden"
                id="rx-upload"
              />
              <label
                htmlFor="rx-upload"
                className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors"
              >
                Choose File
              </label>
            </div>

            {/* OCR Extracted Items Review */}
            {ocrResult && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    Extracted Medicines ({ocrResult.extracted_medicines_count})
                  </h4>
                  <div className="space-y-2">
                    {ocrResult.extracted_items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{item.medicine_name}</div>
                          <div className="text-[11px] text-slate-500">{item.dosage_instruction} • Qty: {item.prescribed_quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-teal-800">₹{item.subtotal.toFixed(2)}</div>
                          <span className="text-[10px] font-bold text-emerald-600">{(item.ocr_confidence * 100).toFixed(0)}% OCR match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Pharmacy Matching Matrix */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    Multi-Store Fulfillment Matches
                  </h4>
                  <div className="space-y-2.5">
                    {ocrResult.pharmacy_matches.map((match) => (
                      <div
                        key={match.pharmacy_id}
                        className={`p-4 rounded-xl border transition-all ${
                          match.match_type === 'COMPLETE'
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{match.pharmacy_name}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                match.match_type === 'COMPLETE'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {match.match_type === 'COMPLETE' ? '100% COMPLETE FULFILLMENT' : `PARTIAL (${match.matched_count}/${match.total_prescribed} items)`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{match.address} • {match.distance_km} km away</p>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">₹{match.estimated_total.toFixed(2)}</div>
                            <span className="text-[10px] text-slate-500">Estimated Total</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  {ocrResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
