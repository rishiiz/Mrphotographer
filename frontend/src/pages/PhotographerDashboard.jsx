import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { PageSkeleton } from '../components/Skeleton';
import { LayoutDashboard, Calendar, UserCheck, IndianRupee, Star, CheckCircle, XCircle, AlertCircle, Plus, Trash2, ShieldAlert, UploadCloud, Camera, Video, PlayCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const DEFAULT_SLOTS = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];

export default function PhotographerDashboard() {
  const { user, profile, reloadProfile } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // 'bookings', 'calendar', 'profile'

  // Availability calendar form state
  const [calDate, setCalDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([...DEFAULT_SLOTS]);

  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [gear, setGear] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [portfolioList, setPortfolioList] = useState([]);
  const [profileMsg, setProfileMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Portfolio states — preview URLs (for display) + actual File objects (for upload)
  const [profilePic, setProfilePic] = useState(null);       // preview URL string
  const [profilePicFile, setProfilePicFile] = useState(null); // File object
  const [portfolioGrid, setPortfolioGrid] = useState([null, null, null]);       // preview URL strings
  const [portfolioGridFiles, setPortfolioGridFiles] = useState([null, null, null]); // File objects
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const bookingsData = await api.getBookings();
        setBookings(bookingsData);
        
        const availabilityData = await api.getAvailability();
        setAvailability(availabilityData);

        if (profile) {
          setName(profile.name || '');
          setBio(profile.bio || '');
          setCity(profile.city || '');
          setPricePerHour(profile.price_per_hour || '');
          setGear(profile.gear || '');
          setSpecialties(profile.specialties || '');
          setPortfolioList(profile.portfolio || []);
        }

        // Load saved portfolio (profile pic, images, video) from backend
        try {
          const portfolioData = await api.getPortfolio();
          if (portfolioData.profile_pic) {
            setProfilePic(`${BACKEND_URL}${portfolioData.profile_pic}`);
          }
          if (portfolioData.portfolio_images && portfolioData.portfolio_images.length > 0) {
            const grid = [null, null, null];
            portfolioData.portfolio_images.forEach((img, i) => {
              if (i < 3 && img) grid[i] = `${BACKEND_URL}${img}`;
            });
            setPortfolioGrid(grid);
          }
          if (portfolioData.portfolio_video) {
            if (portfolioData.portfolio_video.startsWith('/uploads')) {
              setIsVideoUploaded(true);
            } else {
              setVideoUrl(portfolioData.portfolio_video);
            }
          }
        } catch (portfolioErr) {
          console.log('No portfolio data yet');
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [profile]);

  if (loading) {
    return <PageSkeleton />;
  }

  // Calculate statistics
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'approved');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.total_price, 0);
  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => b.status === 'approved');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'declined');

  // Booking actions
  const handleBookingAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to set this booking request to: ${status}?`)) {
      return;
    }
    try {
      await api.updateBookingStatus(id, status);
      // Reload bookings
      const updated = await api.getBookings();
      setBookings(updated);
      
      // Reload calendar too since status shifts can return slots
      const updatedAvail = await api.getAvailability();
      setAvailability(updatedAvail);
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  // Calendar slot toggles
  const handleSlotToggle = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort());
    }
  };

  // Submit availability
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    if (!calDate) {
      alert('Please select a date.');
      return;
    }
    try {
      await api.updateAvailability(calDate, selectedSlots);
      alert('Availability saved successfully!');
      
      const updatedAvail = await api.getAvailability();
      setAvailability(updatedAvail);
    } catch (err) {
      alert(err.message || 'Failed to save slots');
    }
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      // 1. Save text fields
      await api.updateProfile({
        name,
        bio,
        city,
        price_per_hour: parseFloat(pricePerHour),
        specialties,
        gear,
        portfolio: portfolioList
      });

      // 2. Upload portfolio files (profile pic, portfolio images, video)
      const formData = new FormData();
      formData.append('portfolio_grid_state', JSON.stringify(portfolioGrid));

      if (profilePicFile) {
        formData.append('profile_pic', profilePicFile);
      }

      portfolioGridFiles.forEach((file) => {
        if (file) {
          formData.append('portfolio_images', file);
        }
      });

      if (videoFile) {
        formData.append('portfolio_video', videoFile);
      }

      formData.append('video_url', videoUrl || '');

      const result = await api.uploadPortfolio(formData);
      
      // Update local preview URLs from the server response
      if (result.profile_pic) {
        setProfilePic(`${BACKEND_URL}${result.profile_pic}`);
        setProfilePicFile(null);
      }
      
      const grid = [null, null, null];
      if (result.portfolio_images?.length > 0) {
        result.portfolio_images.forEach((img, i) => {
          if (i < 3 && img) grid[i] = `${BACKEND_URL}${img}`;
        });
      }
      setPortfolioGrid(grid);
      setPortfolioGridFiles([null, null, null]);

      if (result.portfolio_video) {
        if (result.portfolio_video.startsWith('/uploads')) {
          setIsVideoUploaded(true);
          setVideoUrl('');
        } else {
          setIsVideoUploaded(false);
          setVideoUrl(result.portfolio_video);
        }
        setVideoFile(null);
      } else {
        setIsVideoUploaded(false);
        setVideoUrl('');
        setVideoFile(null);
      }

      setProfileMsg('Profile updated successfully!');
      await reloadProfile();
    } catch (err) {
      console.error(err);
      setProfileMsg(`Error: ${err.message || 'Failed to update'}`);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const response = await api.uploadPhoto(file);
      const url = response.url;
      if (url && !portfolioList.includes(url)) {
        setPortfolioList([...portfolioList, url]);
      }
      e.target.value = null;
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePortfolioImage = (url) => {
    setPortfolioList(portfolioList.filter(img => img !== url));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Pending verification alert */}
      {profile && !profile.is_approved && (
        <div className="bg-amber-50 border border-amber-200 text-brand-charcoal p-4 rounded-2xl flex items-start space-x-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-[#E8A020] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-[#E8A020]">Profile Pending Admin Verification</p>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              Your profile is currently hidden from search maps and directory queries until an administrator reviews and approves your account. You can still set up your availability and packages below.
            </p>
          </div>
        </div>
      )}

      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Photographer Dashboard</h1>
          <p className="text-sm text-brand-charcoal/60 mt-1">Manage requests, schedules, and profile visibility settings.</p>
        </div>

        {/* Tab Headers */}
        <div className="flex space-x-1.5 bg-brand-offwhite p-1 rounded-2xl border border-[#1A1A1A]/5 self-start">
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'bookings'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Bookings ({pendingRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'calendar'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'profile'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Total Earnings</span>
            <p className="text-xl font-black">{formatINR(totalEarnings)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Completed Shoots</span>
            <p className="text-xl font-black">{completedBookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#E8A020]">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Average Rating</span>
            <p className="text-xl font-black">{(profile?.rating || 5.0).toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Pending Requests</span>
            <p className="text-xl font-black">{pendingRequests.length}</p>
          </div>
        </div>
      </section>

      {/* Main Dashboard Panel */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#1A1A1A]/5 shadow-sm min-h-[50vh]">
        
        {/* BOOKINGS SUBTAB */}
        {activeSubTab === 'bookings' && (
          <div className="space-y-8">
            {/* 1. Pending Requests Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Pending Requests ({pendingRequests.length})</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-brand-charcoal/40">No pending sessions awaiting approval.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="border border-brand-charcoal/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between bg-brand-offwhite/50">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Client Email</span>
                            <p className="text-sm font-bold">{req.client_email}</p>
                          </div>
                          <span className="text-xs font-black text-[#E8A020]">{formatINR(req.total_price)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-brand-charcoal/60 mt-1">
                          <p><strong>Package:</strong> {req.package_name}</p>
                          <p><strong>Duration:</strong> {req.duration_hours} hrs</p>
                          <p><strong>Date:</strong> {req.booking_date}</p>
                          <p><strong>Time Slot:</strong> {req.time_slot}</p>
                        </div>
                        {req.notes && (
                          <div className="bg-white p-2.5 rounded-xl border border-brand-charcoal/5 text-xs text-brand-charcoal/70 leading-relaxed italic">
                            "{req.notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleBookingAction(req.id, 'approved')}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleBookingAction(req.id, 'declined')}
                          className="flex-1 flex items-center justify-center space-x-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Confirmed/Upcoming Bookings Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Upcoming Confirmed Sessions ({activeBookings.length})</h2>
              {activeBookings.length === 0 ? (
                <p className="text-xs text-brand-charcoal/40">No confirmed upcoming bookings.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBookings.map(req => (
                    <div key={req.id} className="border border-green-200 bg-green-50/20 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600/80">Confirmed Client</span>
                          <p className="text-sm font-bold">{req.client_email}</p>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">Paid {formatINR(req.total_price)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-brand-charcoal/60 mt-1">
                        <p><strong>Package:</strong> {req.package_name}</p>
                        <p><strong>Date:</strong> {req.booking_date}</p>
                        <p><strong>Time Slot:</strong> {req.time_slot}</p>
                        <p><strong>Duration:</strong> {req.duration_hours} hrs</p>
                      </div>
                      {req.notes && (
                        <p className="text-xs text-brand-charcoal/70 bg-white/70 p-2 rounded-xl italic">"{req.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. History Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Declined / Completed History ({pastBookings.length})</h2>
              {pastBookings.length === 0 ? (
                <p className="text-xs text-brand-charcoal/40">No past session records.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-brand-charcoal/10 text-brand-charcoal/40 uppercase tracking-wider font-bold">
                        <th className="py-3 px-1">Client</th>
                        <th className="py-3">Date</th>
                        <th className="py-3">Slot</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastBookings.map(pb => (
                        <tr key={pb.id} className="border-b border-brand-charcoal/5 hover:bg-brand-charcoal/5 transition-colors">
                          <td className="py-3 px-1 font-bold">{pb.client_email}</td>
                          <td className="py-3">{pb.booking_date}</td>
                          <td className="py-3">{pb.time_slot}</td>
                          <td className="py-3 font-semibold">{formatINR(pb.total_price)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded font-bold capitalize ${
                              pb.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-500 border border-red-200'
                            }`}>
                              {pb.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALENDAR & AVAILABILITY SUBTAB */}
        {activeSubTab === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Form setting date availability */}
            <form onSubmit={handleSaveAvailability} className="md:col-span-5 space-y-6 border-r border-[#1A1A1A]/10 pr-6">
              <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Set Availability Slots</h2>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={calDate}
                  onChange={(e) => setCalDate(e.target.value)}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Toggle Time Slots</label>
                <div className="grid grid-cols-1 gap-2">
                  {DEFAULT_SLOTS.map(slot => {
                    const active = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSlotToggle(slot)}
                        className={`w-full py-2.5 px-4 text-xs font-bold border rounded-xl transition-all text-left flex justify-between items-center ${
                          active
                            ? 'bg-[#E8A020]/15 border-[#E8A020] text-[#E8A020]'
                            : 'bg-brand-offwhite border-[#1A1A1A]/10 text-brand-charcoal/70'
                        }`}
                      >
                        <span>{slot}</span>
                        {active ? (
                          <span className="text-[10px] bg-[#E8A020] text-white px-2 py-0.5 rounded">Active</span>
                        ) : (
                          <span className="text-[10px] bg-brand-charcoal/5 text-brand-charcoal/30 px-2 py-0.5 rounded">Inactive</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-charcoal hover:bg-[#E8A020] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-xs uppercase tracking-wide"
              >
                Save Availability Date
              </button>
            </form>

            {/* Availability Listing */}
            <div className="md:col-span-7 space-y-4">
              <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Active Schedule</h2>
              {availability.length === 0 ? (
                <p className="text-xs text-brand-charcoal/40">No future availability configured. Use the form on the left to set dates.</p>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {availability.map(av => (
                    <div key={av.date} className="bg-brand-offwhite/50 border border-brand-charcoal/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-brand-charcoal">
                          {new Date(av.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {av.slots.length === 0 ? (
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">All Slots Booked / Closed</span>
                          ) : (
                            av.slots.map(s => (
                              <span key={s} className="text-[10px] bg-white border border-[#1A1A1A]/5 text-brand-charcoal/80 px-2 py-0.5 rounded font-medium">
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete all slots for this date?')) {
                            try {
                              await api.updateAvailability(av.date, []);
                              const updated = await api.getAvailability();
                              setAvailability(updated);
                            } catch (err) {
                              alert(err.message);
                            }
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE EDIT SUBTAB */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
            <h2 className="text-lg font-bold border-b border-[#1A1A1A]/10 pb-2">Edit Photographer Profile Settings</h2>

            {/* Profile Picture */}
            <div className="flex items-center space-x-6 pb-2">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-brand-charcoal/10 bg-brand-offwhite flex-shrink-0">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-brand-charcoal/30" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <UploadCloud className="w-6 h-6 text-white" />
                  <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={(e) => {
                    if (e.target.files[0]) {
                      setProfilePic(URL.createObjectURL(e.target.files[0]));
                      setProfilePicFile(e.target.files[0]);
                    }
                  }} />
                </label>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand-charcoal">Profile Photo</h3>
                <p className="text-xs text-brand-charcoal/60">Recommended: 400x400px, square aspect ratio.</p>
                <label className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 border border-[#1A1A1A]/10 rounded-xl text-xs font-bold hover:bg-[#1A1A1A]/5 transition-colors cursor-pointer mt-2">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={(e) => {
                    if (e.target.files[0]) {
                      setProfilePic(URL.createObjectURL(e.target.files[0]));
                      setProfilePicFile(e.target.files[0]);
                    }
                  }} />
                </label>
              </div>
            </div>

            {profileMsg && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-center space-x-2 ${
                profileMsg.startsWith('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <AlertCircle className="w-5 h-5" />
                <span>{profileMsg}</span>
              </div>
            )}

            {/* Profile Info Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">City Location</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Hourly Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  placeholder="Wedding,Portrait"
                />
              </div>
            </div>

            {/* Gear */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Camera Gear & Equipment List</label>
              <input
                type="text"
                value={gear}
                onChange={(e) => setGear(e.target.value)}
                className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                placeholder="Canon EOS R5, 85mm f/1.2 lens..."
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Profile Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl p-3.5 text-sm font-semibold"
              />
            </div>

            {/* Portfolio Upload */}
            <div className="space-y-4 border-t border-[#1A1A1A]/5 pt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">Portfolio Image Gallery Upload</label>
              
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={uploading}
                  onChange={handleFileChange}
                  className="w-full bg-brand-offwhite border border-[#1A1A1A]/10 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-charcoal file:text-white hover:file:bg-[#E8A020] file:cursor-pointer disabled:opacity-50"
                />
                {uploading && (
                  <p className="text-xs text-[#E8A020] animate-pulse">Uploading photo... Please wait.</p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-500 font-bold">{uploadError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {portfolioList.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group bg-brand-charcoal/5 border border-brand-charcoal/5">
                    <img src={url} alt="Portfolio preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioImage(url)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-lg p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Images Grid */}
            <div className="space-y-4 border-t border-[#1A1A1A]/5 pt-6">
              <div>
                <h3 className="text-sm font-bold text-brand-charcoal">Portfolio Images (Upload up to 3)</h3>
                <p className="text-[10px] uppercase tracking-wider text-brand-charcoal/40 mt-1">Showcase your best work directly on your profile.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const img = portfolioGrid[index];
                  return (
                    <div key={index} className="relative aspect-square rounded-2xl border-2 border-dashed border-[#1A1A1A]/10 bg-brand-offwhite hover:bg-[#1A1A1A]/5 transition-colors overflow-hidden group flex items-center justify-center">
                      {img ? (
                        <>
                          <img src={img} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newGrid = [...portfolioGrid];
                                newGrid[index] = null;
                                setPortfolioGrid(newGrid);
                              }}
                              className="bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-brand-charcoal/40 hover:text-[#E8A020] transition-colors p-4 text-center">
                          <UploadCloud className="w-6 h-6 mb-2" />
                          <span className="text-xs font-bold">Upload Image</span>
                          <span className="text-[10px] mt-1 opacity-70">JPG, PNG (Max 5MB)</span>
                          <input type="file" className="hidden" accept="image/jpeg,image/png" onChange={(e) => {
                            if (e.target.files[0]) {
                              const newGrid = [...portfolioGrid];
                              newGrid[index] = URL.createObjectURL(e.target.files[0]);
                              setPortfolioGrid(newGrid);
                              const newFiles = [...portfolioGridFiles];
                              newFiles[index] = e.target.files[0];
                              setPortfolioGridFiles(newFiles);
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Portfolio Video */}
            <div className="space-y-4 border-t border-[#1A1A1A]/5 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-charcoal">Featured Portfolio Video (Optional)</h3>
                  <p className="text-[10px] uppercase tracking-wider text-brand-charcoal/40 mt-1">A short reel or behind-the-scenes video.</p>
                </div>
              </div>

              <div className="bg-brand-offwhite border border-[#1A1A1A]/10 rounded-2xl p-4 md:p-6 space-y-4">
                {isVideoUploaded ? (
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1600188769045-bc6ed150d180?auto=format&fit=crop&q=80&w=800" alt="Video Thumbnail" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white transition-colors cursor-pointer" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVideoUploaded(false)}
                      className="absolute top-3 right-3 bg-red-600 text-white rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#1A1A1A]/10 rounded-xl py-10 px-4 text-center cursor-pointer hover:bg-[#1A1A1A]/5 hover:border-[#E8A020]/50 transition-all group">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-[#1A1A1A]/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Video className="w-5 h-5 text-brand-charcoal/40 group-hover:text-[#E8A020]" />
                    </div>
                    <span className="text-sm font-bold text-brand-charcoal">Drag and drop a video, or browse</span>
                    <span className="text-xs text-brand-charcoal/50 mt-1">MP4, MOV up to 15MB</span>
                    <input type="file" className="hidden" accept="video/mp4,video/quicktime" onChange={(e) => {
                      if (e.target.files[0]) {
                        setVideoFile(e.target.files[0]);
                        setIsVideoUploaded(true);
                      }
                    }} />
                  </label>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="h-px bg-[#1A1A1A]/10 flex-1"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/30">OR</span>
                  <div className="h-px bg-[#1A1A1A]/10 flex-1"></div>
                </div>

                <div className="relative flex items-center bg-white border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
                  <Video className="w-4 h-4 text-brand-charcoal/30 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Video URL (YouTube/Vimeo or direct link)"
                    className="w-full bg-transparent focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-brand-charcoal hover:bg-[#E8A020] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-sm text-xs uppercase tracking-wider"
            >
              Save Profile Changes
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
