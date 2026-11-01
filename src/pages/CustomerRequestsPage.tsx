import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Phone, 
  FileCheck, 
  RefreshCw,
  Search
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { CustomerReservation, ReservationStatus } from '../types/pharmacy';

export const CustomerRequestsPage: React.FC = () => {
  const { currentUser } = usePharmacy();
  const pharmacyId = currentUser.pharmacyId || 'pharm_indiranagar';

  const [reservations, setReservations] = useState<CustomerReservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch reservations
  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservations/pharmacy/${pharmacyId}`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [pharmacyId]);

  // Update Status
  const handleUpdateStatus = async (
    reservationId: string, 
    newStatus: ReservationStatus, 
    notes?: string,
    pickupDeadline?: string
  ) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes,
          pickup_deadline: pickupDeadline
        })
      });
      if (res.ok) {
        await loadReservations();
      }
    } catch (err) {
      console.error('Failed to update reservation status:', err);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = 
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer_phone.includes(searchQuery) ||
      r.reservation_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Customer Medicine Reservations</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Hold stock safely for patients. Prevent double deduction, verify prescriptions, and handle order pickup lifecycle.
          </p>
        </div>

        {/* Stats Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">
            Pending: {reservations.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold">
            Ready: {reservations.filter(r => r.status === 'READY_FOR_PICKUP').length}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            Collected: {reservations.filter(r => r.status === 'COLLECTED').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, phone, medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Reservations</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="COLLECTED">Collected</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <button
            onClick={loadReservations}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Reservation Code</th>
                <th className="py-2.5 px-3">Customer Info</th>
                <th className="py-2.5 px-3">Reserved Medicine</th>
                <th className="py-2.5 px-3">Qty & Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Pickup Deadline</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No customer reservations found.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.reservation_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {res.reservation_id}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {res.created_at}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{res.customer_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{res.customer_phone}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{res.medicine_name}</div>
                      {res.prescription_verified && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold inline-flex items-center gap-0.5">
                          <FileCheck className="w-2.5 h-2.5" />
                          <span>Rx Verified</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-900">{res.quantity} units</div>
                      <div className="text-[11px] font-bold text-emerald-600">₹{res.total_price.toFixed(2)}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                        res.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-800' :
                        res.status === 'READY_FOR_PICKUP' ? 'bg-teal-100 text-teal-800 animate-pulse' :
                        res.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                        res.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        res.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {res.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{res.pickup_deadline}</span>
                      </div>
                      {res.notes && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{res.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      {/* PENDING -> Accept or Reject */}
                      {res.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(res.reservation_id, 'ACCEPTED', 'Confirmed stock available')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-2xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(res.reservation_id, 'REJECTED', 'Stock unavailable or invalid Rx')}
                            className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* ACCEPTED -> Mark Ready for Pickup */}
                      {res.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(res.reservation_id, 'READY_FOR_PICKUP', 'Packaged and kept at pickup counter')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-2xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {/* READY_FOR_PICKUP -> Mark Collected */}
                      {res.status === 'READY_FOR_PICKUP' && (
                        <button
                          onClick={() => handleUpdateStatus(res.reservation_id, 'COLLECTED', 'Picked up by patient and payment settled')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Collected</span>
                        </button>
                      )}

                      {res.status === 'COLLECTED' && (
                        <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Order Complete</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
