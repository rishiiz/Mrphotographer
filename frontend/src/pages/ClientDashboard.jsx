import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { PageSkeleton } from '../components/Skeleton';
import { Calendar, Clock, Star, MessageSquare, RefreshCw, XCircle, FileText, Loader, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load client bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  // Segment bookings
  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'approved');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'declined');

  const handleStatusComplete = async (bookingId) => {
    if (!window.confirm('Mark this session as Completed?')) return;
    try {
      await api.updateBookingStatus(bookingId, 'completed');
      await loadBookings();
    } catch (err) {
      alert(err.message || 'Failed to complete session');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    setReviewSubmitting(true);
    try {
      await api.postReview({
        bookingId: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment
      });
      alert('Review posted successfully! Thank you.');
      setReviewBookingId(null);
      setReviewComment('');
      setReviewRating(5);
      await loadBookings();
    } catch (err) {
      console.error(err);
      setReviewMsg(err.message || 'Failed to post review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Client Dashboard</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">Check reservation records, complete sessions, and leave photographer feedback.</p>
      </div>

      {/* Grid splits into Upcoming and Past */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upcoming reservations */}
        <section className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold border-b border-[#1A1A1A]/10 pb-2">Upcoming & Pending Sessions ({upcomingBookings.length})</h2>
          
          {upcomingBookings.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-[#1A1A1A]/5 space-y-4">
              <p className="text-sm text-brand-charcoal/45">You have no upcoming photo sessions scheduled.</p>
              <Link to="/search" className="inline-block bg-[#E8A020] text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide">
                Find a Photographer
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-[#1A1A1A]/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Photographer</span>
                      <h4 className="font-extrabold text-base text-brand-charcoal">{b.photographer_name}</h4>
                      <p className="text-xs text-brand-charcoal/50">{b.photographer_city}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                      b.status === 'approved'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-amber-50 text-[#E8A020] border border-amber-200'
                    }`}>
                      {b.status === 'approved' ? 'Confirmed' : 'Pending Approval'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-brand-charcoal/60 pt-2 border-t border-brand-charcoal/5">
                    <p className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-[#E8A020]" /> <strong>Date:</strong> {b.booking_date}</p>
                    <p className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-[#E8A020]" /> <strong>Slot:</strong> {b.time_slot}</p>
                    <p><strong>Package:</strong> {b.package_name}</p>
                  </div>

                  {b.status === 'approved' && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleStatusComplete(b.id)}
                        className="bg-brand-charcoal hover:bg-[#E8A020] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Complete Session
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Past reservation records */}
        <section className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold border-b border-[#1A1A1A]/10 pb-2">Session History ({pastBookings.length})</h2>
          
          {pastBookings.length === 0 ? (
            <p className="text-xs text-brand-charcoal/40">No previous sessions found.</p>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-[#1A1A1A]/5 shadow-sm space-y-4 bg-brand-offwhite/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-brand-charcoal">{b.photographer_name}</h4>
                      <span className="text-[10px] text-brand-charcoal/40 font-bold">{b.booking_date}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'completed'
                        ? 'bg-green-50 text-green-600 border border-green-150'
                        : 'bg-red-50 text-red-500 border border-red-150'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-brand-charcoal/5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Amount</span>
                      <p className="font-bold text-brand-charcoal">{formatINR(b.total_price)}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/photographer/${b.photographer_id}`}
                        className="bg-brand-charcoal/5 hover:bg-brand-charcoal/10 text-brand-charcoal px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1"
                        title="Book this photographer again"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Rebook</span>
                      </Link>

                      {b.status === 'completed' && (
                        <button
                          onClick={() => {
                            setReviewBookingId(b.id);
                            setReviewComment('');
                          }}
                          className="bg-[#E8A020] hover:bg-[#d08f1b] text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Review Modal Dialog */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fade-in">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-2xl relative space-y-4">
            
            {/* Close Button */}
            <button
              onClick={() => setReviewBookingId(null)}
              className="absolute top-4 right-4 text-brand-charcoal/40 hover:text-brand-charcoal p-1"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center">
              <FileText className="w-10 h-10 text-[#E8A020] mx-auto mb-2" />
              <h3 className="text-xl font-bold">Write a Review</h3>
              <p className="text-xs text-brand-charcoal/50">Your rating updates the photographer's public listing score.</p>
            </div>

            {reviewMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl flex items-center space-x-1.5 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{reviewMsg}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              
              {/* Star Rating Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Select Stars</label>
                <div className="flex space-x-1 justify-center py-2 bg-brand-offwhite rounded-xl border border-brand-charcoal/5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none transition-transform active:scale-95"
                    >
                      <Star className={`w-7 h-7 ${star <= reviewRating ? 'text-[#E8A020] fill-[#E8A020]' : 'text-brand-charcoal/10'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Review comment</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience working with this photographer..."
                  className="w-full bg-brand-offwhite border border-brand-charcoal/10 focus:outline-none rounded-xl p-3 text-xs font-semibold placeholder-brand-charcoal/30"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full bg-[#E8A020] hover:bg-[#d08f1b] disabled:bg-brand-charcoal/20 text-white font-bold py-3.5 rounded-xl transition-all shadow text-xs uppercase tracking-wide flex justify-center items-center"
              >
                {reviewSubmitting ? <Loader className="w-4 h-4 animate-spin mr-1.5" /> : null}
                <span>Submit Feedback</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
