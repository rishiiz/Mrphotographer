import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PageSkeleton } from '../components/Skeleton';
import { CreditCard, Calendar, Clock, BookOpen, AlertCircle, Sparkles, Loader } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const photographerId = searchParams.get('photographerId');
  const packageId = searchParams.get('packageId');
  const bookingDate = searchParams.get('date');
  const bookingSlot = searchParams.get('slot');

  const [photographer, setPhotographer] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Razorpay mock checkout states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  useEffect(() => {
    if (!photographerId || !packageId || !bookingDate || !bookingSlot) {
      navigate('/search');
      return;
    }

    async function loadDetails() {
      try {
        const data = await api.getPhotographerDetails(photographerId);
        setPhotographer(data.profile);
        const pkg = data.packages.find(p => String(p.id) === String(packageId));
        setSelectedPackage(pkg);
      } catch (err) {
        console.error('Error loading booking checkout details', err);
        setError('Could not retrieve booking options.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [photographerId, packageId, bookingDate, bookingSlot, navigate]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !photographer || !selectedPackage) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="text-red-500 font-bold">{error || 'Booking parameters invalid.'}</div>
        <button onClick={() => navigate('/search')} className="bg-brand-charcoal text-white px-5 py-2.5 rounded-full font-bold">
          Return to Search
        </button>
      </div>
    );
  }

  const basePrice = selectedPackage.price;
  const serviceFee = parseFloat((basePrice * 0.05).toFixed(2)); // 5% fee
  const totalPrice = basePrice + serviceFee;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cardNumber.length < 16 || cardExpiry.length < 4 || cardCVC.length < 3) {
      setError('Please enter valid mock payment details.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createBooking({
        photographerId: parseInt(photographerId),
        packageId: parseInt(packageId),
        date: bookingDate,
        timeSlot: bookingSlot,
        notes
      });
      
      alert('Booking request sent successfully! Redirecting to client dashboard.');
      navigate('/client-dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Checkout process failed. Please check availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-charcoal">Complete your Booking</h1>
        <p className="text-brand-charcoal/60 mt-1">Review details and authorize payment via Razorpay (simulated).</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Booking Notes & Stripe payment */}
        <form onSubmit={handleCheckoutSubmit} className="md:col-span-7 space-y-6">
          
          {/* Notes Section */}
          <div className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-brand-charcoal flex items-center space-x-1.5">
              <BookOpen className="w-5 h-5 text-[#E8A020]" />
              <span>Session Notes</span>
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40" htmlFor="notes">Special Requests or Location Notes</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Let the photographer know details about coordinates, event themes, outfit changes, or desired styles..."
                className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:border-[#E8A020] focus:outline-none rounded-xl p-3 text-sm font-semibold placeholder-brand-charcoal/30"
              />
            </div>
          </div>

          {/* Payment Section (Razorpay placeholder) */}
          <div className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-brand-charcoal flex items-center space-x-1.5">
                <CreditCard className="w-5 h-5 text-[#E8A020]" />
                <span>Simulated Checkout</span>
              </h3>
              <span className="text-[10px] bg-[#E8A020]/20 text-[#E8A020] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Razorpay Test</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none focus:border-[#E8A020] rounded-xl px-3.5 py-3 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Expiration Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none focus:border-[#E8A020] rounded-xl px-3.5 py-3 text-sm font-semibold text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">CVC</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="123"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none focus:border-[#E8A020] rounded-xl px-3.5 py-3 text-sm font-semibold text-center"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-brand-charcoal/40 italic">This transaction is a secure simulation. No live funds will be debited.</p>
          </div>

          {/* Submission button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#E8A020] hover:bg-[#d08f1b] disabled:bg-[#brand-charcoal]/20 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : null}
            <span>Pay & Book Session • {formatINR(totalPrice)}</span>
          </button>
        </form>

        {/* Right Side: Package Summary Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-brand-charcoal border-b border-[#1A1A1A]/15 pb-3">Session Summary</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Photographer</span>
                <p className="font-extrabold text-brand-charcoal">{photographer.name}</p>
                <p className="text-xs text-brand-charcoal/50">{photographer.city}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Package Selected</span>
                <p className="font-extrabold text-brand-charcoal">{selectedPackage.name}</p>
                <p className="text-xs text-brand-charcoal/50 capitalize">{selectedPackage.type} Tier ({selectedPackage.duration_hours} Hours)</p>
              </div>

              <div className="flex items-start space-x-2 border-t border-[#1A1A1A]/5 pt-4">
                <Calendar className="w-4 h-4 text-[#E8A020] mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Date</span>
                  <p className="text-sm font-semibold text-brand-charcoal">
                    {new Date(bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-[#E8A020] mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Time Slot</span>
                  <p className="text-sm font-semibold text-brand-charcoal">{bookingSlot}</p>
                </div>
              </div>
            </div>

            {/* Bill breakdown */}
            <div className="border-t border-[#1A1A1A]/10 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-brand-charcoal/60">
                <span>{selectedPackage.name}</span>
                <span>{formatINR(basePrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-charcoal/60">
                <span>Platform Service Fee (5%)</span>
                <span>{formatINR(serviceFee)}</span>
              </div>
              
              <div className="flex justify-between font-black text-base text-brand-charcoal border-t border-[#1A1A1A]/10 pt-3">
                <span>Total Amount</span>
                <span className="text-[#E8A020]">{formatINR(totalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-[#E8A020]/10 border border-[#E8A020]/25 p-3.5 rounded-2xl text-[10px] text-[#E8A020] font-semibold leading-relaxed">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Your booking is protected by the Mr.Photographer Satisfaction Policy.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
