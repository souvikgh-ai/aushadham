import React, { useState, useEffect } from 'react';
import { 
  Network, 
  ArrowRightLeft, 
  Send, 
  CheckCircle2, 
  Truck, 
  Package, 
  RefreshCw
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import type { StockTransfer, SurplusDeficitProposal, StockTransferStatus } from '../types/pharmacy';

export const PharmacyNetworkPage: React.FC = () => {
  const { currentUser, medicines } = usePharmacy();
  const currentPharmacyId = currentUser.pharmacyId || 'pharm_indiranagar';

  const [activeTab, setActiveTab] = useState<'transfers' | 'opportunities' | 'new_request'>('transfers');
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [opportunities, setOpportunities] = useState<SurplusDeficitProposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Request Form State
  const [newFromPharm, setNewFromPharm] = useState<string>('pharm_koramangala');
  const [newMedId, setNewMedId] = useState<string>('med-azi-500');
  const [newQty, setNewQty] = useState<number>(15);
  const [newReason, setNewReason] = useState<string>('Stock balancing / deficit relief');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch Transfers
  const loadTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transfers/pharmacy/${currentPharmacyId}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.all_transfers || []);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Opportunities
  const loadOpportunities = async () => {
    try {
      const res = await fetch('/api/transfers/surplus-deficit');
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.transfer_proposals || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    }
  };

  useEffect(() => {
    loadTransfers();
    loadOpportunities();
  }, [currentPharmacyId]);

  // Update Status
  const handleUpdateStatus = async (transferId: string, newStatus: StockTransferStatus) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await loadTransfers();
        await loadOpportunities();
      }
    } catch (err) {
      console.error('Failed to update transfer status:', err);
    }
  };

  // Submit New Transfer Request
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transfers/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_pharmacy_id: newFromPharm,
          to_pharmacy_id: currentPharmacyId,
          medicine_id: newMedId,
          quantity: newQty,
          batch_number: 'BATCH-NET-2026',
          expiry_date: '2026-12-31',
          reason: newReason
        })
      });
      if (res.ok) {
        await loadTransfers();
        setActiveTab('transfers');
      }
    } catch (err) {
      console.error('Failed to create transfer request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransfers = statusFilter === 'ALL' 
    ? transfers 
    : transfers.filter(t => t.status === statusFilter);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-teal-600" />
            <span>Pharmacy Network & Stock Balancing</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Inter-pharmacy stock transfers across Bangalore stores. Alleviate local stockouts using partner surplus inventory.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'transfers'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Active Transfers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {transfers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'opportunities'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>Surplus Matchmaker</span>
            {opportunities.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {opportunities.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('new_request')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'new_request'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Transfer</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Transfers Table */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transfer Records & Dispatch Status</h2>
              <p className="text-xs text-slate-500">Track chain-of-custody, batch numbers, courier tracking, and confirm receipt.</p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="RECEIVED">Received</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={loadTransfers}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Reload"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Transfer ID</th>
                  <th className="py-2.5 px-3">Medicine</th>
                  <th className="py-2.5 px-3">From Pharmacy</th>
                  <th className="py-2.5 px-3">To Pharmacy</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Logistics</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock transfers found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((tx) => {
                    const isIncoming = tx.to_pharmacy_id === currentPharmacyId;
                    return (
                      <tr key={tx.transfer_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {tx.transfer_id}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Batch: {tx.batch_number}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{tx.medicine_name}</div>
                          <div className="text-[10px] text-slate-500">Exp: {tx.expiry_date}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div className="font-medium">{tx.from_pharmacy_name}</div>
                          {tx.from_pharmacy_id === currentPharmacyId && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">Outgoing</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div className="font-medium">{tx.to_pharmacy_name}</div>
                          {isIncoming && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">Incoming</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {tx.quantity} units
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            tx.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                            tx.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            tx.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
                            tx.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800' :
                            tx.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          <div>{tx.courier_partner || 'Direct Transfer'}</div>
                          {tx.tracking_number && (
                            <div className="text-[10px] font-mono text-slate-400">{tx.tracking_number}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          {/* If Supplying store & Requested -> Accept or Reject */}
                          {tx.from_pharmacy_id === currentPharmacyId && tx.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(tx.transfer_id, 'ACCEPTED')}
                                className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px]"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(tx.transfer_id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* If Supplying store & Accepted -> Dispatch */}
                          {tx.from_pharmacy_id === currentPharmacyId && tx.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleUpdateStatus(tx.transfer_id, 'DISPATCHED')}
                              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 inline-flex"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* If In Transit & Receiving Store -> Confirm Receipt */}
                          {isIncoming && (tx.status === 'IN_TRANSIT' || tx.status === 'DISPATCHED') && (
                            <button
                              onClick={() => handleUpdateStatus(tx.transfer_id, 'RECEIVED')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 inline-flex shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Confirm Receipt</span>
                            </button>
                          )}

                          {tx.status === 'RECEIVED' && (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Stock Added</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Opportunities Matchmaker */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-teal-800/40">
            <h2 className="text-lg font-bold">Surplus vs. Deficit Algorithm Matching</h2>
            <p className="text-xs text-teal-200 mt-1 max-w-2xl">
              Our spatial intelligence engine continuously computes inter-pharmacy stock variances across Bengaluru stores. Pharmacies nearing stockout are paired with nearby stores holding surplus inventory to reduce overall wastage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">{opp.medicine_name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                    opp.urgency === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {opp.urgency} URGENCY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase">Deficit Store</span>
                    <div className="font-bold text-slate-800 mt-0.5">{opp.deficit_pharmacy_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Stock: {opp.deficit_current_stock} units left</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Surplus Store</span>
                    <div className="font-bold text-slate-800 mt-0.5">{opp.surplus_pharmacy_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Stock: {opp.surplus_current_stock} units</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {opp.reason} Distance: <strong>{opp.distance_km} km</strong>.
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-600">
                    Recommended: <strong>{opp.recommended_quantity} units</strong>
                  </span>
                  <button
                    onClick={() => {
                      setNewFromPharm(opp.surplus_pharmacy_id);
                      setNewMedId(opp.medicine_id);
                      setNewQty(opp.recommended_quantity);
                      setActiveTab('new_request');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Initiate Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Request Transfer Form */}
      {activeTab === 'new_request' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Request Stock from Partner Pharmacy</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit an inter-pharmacy stock balancing request. Once approved, dispatch is tracked with batch numbers.</p>
          </div>

          <form onSubmit={handleCreateTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Source Partner Pharmacy (Surplus Store)</label>
              <select
                value={newFromPharm}
                onChange={(e) => setNewFromPharm(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
              >
                <option value="pharm_koramangala">Aushadham Meds - Koramangala (Surplus Azithromycin)</option>
                <option value="pharm_jayanagar">Aushadham Health - Jayanagar</option>
                <option value="pharm_whitefield">Aushadham Express - Whitefield</option>
                <option value="pharm_malleshwaram">Aushadham Pharmacy - Malleshwaram</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicine to Transfer</label>
              <select
                value={newMedId}
                onChange={(e) => setNewMedId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.strength})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Units)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Transfer</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('transfers')}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Send Transfer Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
