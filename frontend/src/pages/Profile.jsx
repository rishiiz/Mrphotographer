import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PageSkeleton } from '../components/Skeleton';
import { MapPin, Star, Sparkles, ShieldCheck, Heart, Calendar as CalendarIcon, Clock, ChevronRight, Tag, Phone, Video } from 'lucide-react';
import { formatINR, getProfileImage, formatIndianPhone } from '../utils/currency';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const renderVideoPlayer = (url) => {
  if (!url) return null;
  
  const videoSrc = url.startsWith('/uploads') ? `${BACKEND_URL}${url}` : url;
  
  // Check if it's a youtube link
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  
  if (ytMatch) {
    const videoId = ytMatch[1];
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    );
  }
  
  // Check if it's vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegex);
  
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        title="Vimeo video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    );
  }
  
  // Default to native HTML5 video player
  return (
    <video
      src={videoSrc}
      controls
      className="w-full h-full"
      preload="metadata"
    />
  );
};

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [photographer, setPhotographer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio', 'about', 'reviews'
  const [activePackage, setActivePackage] = useState('standard'); // 'basic', 'standard', 'premium'

  // Booking picker states
  const [chosenDate, setChosenDate] = useState('');
  const [chosenSlot, setChosenSlot] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getPhotographerDetails(id);
        setPhotographer(data.profile);
        setPackages(data.packages);
        setReviews(data.reviews);
        setAvailability(data.availability);
      } catch (err) {
        console.error('Failed to load photographer profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!photographer) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Photographer not found</h2>
        <button onClick={() => navigate('/search')} className="bg-[#E8A020] text-white px-5 py-2.5 rounded-full font-bold">
          Back to Search
        </button>
      </div>
    );
  }

  const selectedTierPackage = packages.find(pkg => pkg.type === activePackage) || packages[0];
  const availableDatesList = availability.filter(av => av.slots.length > 0);
  const selectedDateAvail = availability.find(av => av.date === chosenDate);
  const availableSlotsList = selectedDateAvail ? selectedDateAvail.slots : [];

  const handleBookingRedirect = () => {
    if (!chosenDate || !chosenSlot) {
      alert('Please select an available date and time slot first.');
      return;
    }
    if (!selectedTierPackage) {
      alert('Pricing packages are not configured.');
      return;
    }
    navigate(`/booking-flow?photographerId=${id}&packageId=${selectedTierPackage.id}&date=${chosenDate}&slot=${encodeURIComponent(chosenSlot)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-10">

      {/* Profile Header Header */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#1A1A1A]/5 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">

        {/* Cover overlay decoration */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#E8A020] via-brand-charcoal to-brand-amber"></div>

        {/* Profile Image */}
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden bg-brand-charcoal/5 border-2 border-brand-offwhite shadow-md flex-shrink-0">
          <img
            src={getProfileImage(photographer)}
            alt={photographer.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-brand-charcoal">{photographer.name}</h1>
                {photographer.is_approved && (
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center border border-green-200">
                    <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
                    Vetted
                  </span>
                )}
              </div>
              <p className="text-sm text-brand-charcoal/40 font-semibold flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1 text-brand-charcoal/30" />
                <span>{photographer.city}</span>
              </p>
              {photographer.address && (
                <p className="text-xs text-brand-charcoal/50 mt-1 max-w-lg">{photographer.address}</p>
              )}
              {photographer.phone && (
                <a
                  href={`tel:${formatIndianPhone(photographer.phone)}`}
                  className="text-sm text-[#E8A020] font-semibold flex items-center mt-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  <span>{photographer.phone}</span>
                </a>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-[#E8A020] font-bold text-lg bg-[#E8A020]/10 px-3 py-1.5 rounded-xl border border-[#E8A020]/10">
                <Star className="w-4 h-4 fill-current" />
                <span>{photographer.rating.toFixed(1)}</span>
                <span className="text-brand-charcoal/40 text-xs font-semibold">({reviews.length} reviews)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Starts at</span>
                <p className="text-2xl font-black text-brand-charcoal">{formatINR(photographer.price_per_hour)}<span className="text-sm font-semibold">/hr</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(photographer.specialties || '').split(',').map((spec) => (
              <span
                key={spec}
                className="text-xs bg-brand-charcoal/5 text-brand-charcoal/70 px-3 py-1 rounded-md font-bold"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const element = document.getElementById('booking-calendar');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-brand-charcoal hover:bg-[#E8A020] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-2"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Book Session Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* Detail Split Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Side: Portfolio & Bio */}
        <div className="lg:col-span-8 space-y-8">

          {/* Tab selectors */}
          <div className="flex border-b border-[#1A1A1A]/10">
            {['portfolio', 'about', 'reviews'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`py-4 px-6 text-sm font-bold border-b-2 uppercase tracking-wider transition-colors ${activeTab === t
                    ? 'border-[#E8A020] text-[#E8A020]'
                    : 'border-transparent text-brand-charcoal/50 hover:text-brand-charcoal'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6 animate-fade-in">
              {/* Featured Video Reel if exists */}
              {photographer.portfolio_video && (
                <div className="space-y-3 bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm">
                  <h3 className="text-lg font-bold text-brand-charcoal flex items-center space-x-2">
                    <Video className="w-5 h-5 text-[#E8A020]" />
                    <span>Featured Video Reel</span>
                  </h3>
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-sm border border-[#1A1A1A]/5">
                    {renderVideoPlayer(photographer.portfolio_video)}
                  </div>
                </div>
              )}

              {/* Portfolio Images Gallery */}
              <div className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-brand-charcoal">Image Gallery</h3>
                {photographer.portfolio.length === 0 ? (
                  <div className="text-center py-16 text-brand-charcoal/40 text-sm">
                    No portfolio images uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photographer.portfolio.map((img, index) => {
                      const imgUrl = img.startsWith('/uploads') ? `${BACKEND_URL}${img}` : img;
                      return (
                        <div key={index} className="overflow-hidden rounded-2xl bg-brand-charcoal/5 border border-[#1A1A1A]/5 relative group aspect-video">
                          <img
                            src={imgUrl}
                            alt={`Portfolio ${index}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="bg-white p-6 rounded-2xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-brand-charcoal">About {photographer.name}</h3>
                <p className="text-sm text-brand-charcoal/70 leading-relaxed whitespace-pre-line">{photographer.bio}</p>
              </div>

              <div className="border-t border-[#1A1A1A]/10 pt-4 space-y-2">
                <h3 className="text-lg font-bold text-brand-charcoal">Camera Gear & Equipment</h3>
                <div className="flex flex-wrap gap-2">
                  {(photographer.gear || '').split(',').map((g) => (
                    <span key={g} className="text-xs bg-brand-offwhite border border-[#1A1A1A]/10 text-brand-charcoal/80 px-3 py-1.5 rounded-lg font-semibold">
                      {g.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#1A1A1A]/5 rounded-2xl text-brand-charcoal/40">
                  No client reviews yet. Be the first to book!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-brand-charcoal">{rev.client_name || 'Client'}</h4>
                        <span className="text-[10px] text-brand-charcoal/40 font-semibold">
                          {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-0.5 text-[#E8A020]">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-brand-charcoal/10'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-brand-charcoal/70 leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side: Packages & Calendar Picker */}
        <div className="lg:col-span-4 space-y-6">

          {/* Packages Tier Picker */}
          <div className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-brand-charcoal flex items-center space-x-1.5">
              <Tag className="w-5 h-5 text-[#E8A020]" />
              <span>Pricing Packages</span>
            </h3>

            {/* Selector Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-brand-offwhite p-1 rounded-xl border border-[#1A1A1A]/5">
              {['basic', 'standard', 'premium'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActivePackage(tier)}
                  className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${activePackage === tier
                      ? 'bg-brand-charcoal text-white shadow-sm'
                      : 'text-brand-charcoal/50 hover:text-brand-charcoal'
                    }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Active Package Details */}
            {selectedTierPackage ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-start">
                  <h4 className="font-extrabold text-lg text-brand-charcoal">{selectedTierPackage.name}</h4>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#E8A020]">{formatINR(selectedTierPackage.price)}</p>
                    <span className="text-[10px] text-brand-charcoal/40 font-bold uppercase flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-0.5" />
                      {selectedTierPackage.duration_hours} hrs
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-brand-charcoal/70">
                  {selectedTierPackage.features.map((feat, index) => (
                    <li key={index} className="flex items-start">
                      <ChevronRight className="w-3.5 h-3.5 text-[#E8A020] mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-brand-charcoal/40">No package information available.</p>
            )}
          </div>

          {/* Availability Calendar Picker */}
          <div id="booking-calendar" className="bg-white p-6 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-brand-charcoal flex items-center space-x-1.5">
              <CalendarIcon className="w-5 h-5 text-[#E8A020]" />
              <span>Select Date & Time</span>
            </h3>

            {/* Date Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Choose Available Date</label>
              <select
                value={chosenDate}
                onChange={(e) => { setChosenDate(e.target.value); setChosenSlot(''); }}
                className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              >
                <option value="">-- Choose Date --</option>
                {availableDatesList.map((av) => (
                  <option key={av.date} value={av.date}>
                    {new Date(av.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot Picker */}
            {chosenDate && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Choose Time Slot</label>
                {availableSlotsList.length === 0 ? (
                  <p className="text-xs text-red-500 font-semibold">All slots are booked for this date.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availableSlotsList.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setChosenSlot(slot)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${chosenSlot === slot
                            ? 'bg-[#E8A020] border-[#E8A020] text-white'
                            : 'bg-brand-offwhite border-[#1A1A1A]/10 text-brand-charcoal/70 hover:bg-brand-charcoal/5'
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CTA Trigger */}
            <button
              onClick={handleBookingRedirect}
              disabled={!chosenDate || !chosenSlot}
              className="w-full bg-[#E8A020] hover:bg-[#d08f1b] disabled:bg-brand-charcoal/10 text-white disabled:text-brand-charcoal/30 font-bold py-3.5 rounded-xl transition-all shadow-sm"
            >
              Proceed to Booking
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
