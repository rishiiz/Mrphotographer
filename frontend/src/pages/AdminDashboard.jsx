import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageSkeleton } from '../components/Skeleton';
import { UserCheck, ShieldAlert, CheckCircle, XCircle, Users, Mail, MapPin } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      const data = await api.getPendingPhotographers();
      setPending(data);
    } catch (err) {
      console.error('Failed to load pending photographers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id, name) => {
    if (!window.confirm(`Approve photographer profile for: ${name}?`)) return;
    try {
      await api.approvePhotographer(id);
      alert('Photographer approved successfully!');
      await loadPending();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`REJECT and delete account for: ${name}? This action is permanent.`)) return;
    try {
      await api.rejectPhotographer(id);
      alert('Photographer registration rejected and profile deleted.');
      await loadPending();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Approval Panel</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">Review new photographer registrations, view specialties and pricing, and grant visibility access.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#1A1A1A]/5 shadow-sm min-h-[40vh]">
        <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-3 flex items-center space-x-2">
          <Users className="w-5 h-5 text-[#E8A020]" />
          <span>Pending Approvals ({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-base font-bold">All clear!</h3>
            <p className="text-xs text-brand-charcoal/50">There are no photographer registrations awaiting review.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {pending.map((p) => (
              <div
                key={p.user_id}
                className="bg-brand-offwhite/40 border border-brand-charcoal/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-base text-brand-charcoal">{p.name}</h4>
                    <span className="text-[10px] bg-amber-50 text-[#E8A020] border border-amber-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Awaiting Verification</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-brand-charcoal/60">
                    <p className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-[#E8A020]" /> <strong>Email:</strong> {p.email}</p>
                    <p className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-[#E8A020]" /> <strong>City:</strong> {p.city}</p>
                    <p><strong>Hourly rate:</strong> {formatINR(p.price_per_hour)}/hr</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-brand-charcoal/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Bio & Specialty</span>
                    <p className="text-xs text-brand-charcoal/70 line-clamp-2">{p.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(p.specialties || '').split(',').map((spec) => (
                        <span key={spec} className="text-[9px] bg-brand-charcoal/5 text-brand-charcoal/80 px-2 py-0.5 rounded font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 w-full md:w-auto flex-shrink-0">
                  <button
                    onClick={() => handleApprove(p.user_id, p.name)}
                    className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 py-2.5 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(p.user_id, p.name)}
                    className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
