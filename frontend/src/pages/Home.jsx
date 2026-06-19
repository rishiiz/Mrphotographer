import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { PhotographerCardSkeleton } from '../components/Skeleton';
import { Search, Sparkles, User, Calendar, Briefcase, Home as HomeIcon, MapPin, Star, Compass } from 'lucide-react';
import { formatINR, getProfileImage } from '../utils/currency';

const CATEGORIES = [
  { name: 'Wedding', icon: Sparkles, desc: 'Capture your special day' },
  { name: 'Portrait', icon: User, desc: 'Professional headshots & portraits' },
  { name: 'Events', icon: Calendar, desc: 'Parties, gigs, and celebrations' },
  { name: 'Commercial', icon: Briefcase, desc: 'Product photography & brand shoots' },
  { name: 'Real Estate', icon: HomeIcon, desc: 'Stunning property visuals' },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    async function loadFeatured() {
      try {
        // Fetch top rated photographers
        const data = await api.getPhotographers({ sortBy: 'highest_rated' });
        setFeatured(data.slice(0, 3)); // show top 3
      } catch (err) {
        console.error('Error loading featured photographers', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      navigate(`/search?city=${encodeURIComponent(searchCity.trim())}`);
    } else {
      navigate('/search?city=Pune');
    }
  };

  const handleGeolocation = () => {
    setGeoLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setGeoLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        navigate(`/search?lat=${latitude}&lng=${longitude}`);
        setGeoLocating(false);
      },
      (error) => {
        console.error('Error getting location', error);
        alert('Could not determine your location. Please enter a city manually.');
        setGeoLocating(false);
      }
    );
  };

  return (
    <div className="space-y-20 pb-20 animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-[#1A1A1A] text-white py-24 md:py-32 px-4 overflow-hidden">
        {/* Soft atmospheric gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1600"
          alt="Hero Camera Background"
          className="absolute inset-0 w-full h-full object-cover opacity-45 transform scale-105 transition-transform duration-1000"
        />
        
        <div className="relative z-20 max-w-5xl mx-auto text-center md:text-left space-y-8">
          <div className="inline-flex items-center space-x-2 bg-[#E8A020]/20 border border-[#E8A020]/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#E8A020]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Local Visual Storytellers</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
            Find and Book <span className="text-[#E8A020]">Top Photographers</span> Near You
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-xl font-normal leading-relaxed">
            Mr.Photographer matches you with vetted local professionals based on location, style, package budget, and real-time calendar availability.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-[#FAFAF8] p-2 rounded-2xl shadow-xl border border-[#1A1A1A]/10 text-brand-charcoal">
            <div className="flex-1 flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-brand-charcoal/10">
              <MapPin className="w-5 h-5 text-brand-charcoal/40 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Enter city (e.g. Pune, Mumbai)..."
                className="w-full bg-transparent focus:outline-none text-base font-medium placeholder-brand-charcoal/40"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={geoLocating}
                className="flex items-center justify-center bg-brand-charcoal/5 hover:bg-brand-charcoal/10 active:scale-95 transition-all text-brand-charcoal p-3.5 rounded-xl font-bold flex-shrink-0"
                title="Locate me automatically"
              >
                <Compass className={`w-5 h-5 ${geoLocating ? 'animate-spin text-[#E8A020]' : ''}`} />
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-[#E8A020] hover:bg-[#d08f1b] active:scale-95 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Browse by Specialty</h2>
          <p className="text-brand-charcoal/60 max-w-md mx-auto">Explore packages tailored to your specific event style and needs.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/search?specialty=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center p-6 bg-white border border-[#1A1A1A]/5 rounded-2xl text-center hover:border-[#E8A020] hover:shadow-md transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#E8A020]/10 flex items-center justify-center mb-4 group-hover:bg-[#E8A020] group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6 text-[#E8A020] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-lg text-brand-charcoal mb-1">{cat.name}</h3>
                <p className="text-xs text-brand-charcoal/50 leading-snug">{cat.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Photographers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end border-b border-[#1A1A1A]/10 pb-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Featured Photographers</h2>
            <p className="text-brand-charcoal/60 mt-1">Vetted and top-rated storytellers on Mr.Photographer.</p>
          </div>
          <Link
            to="/search?city=Pune"
            className="text-sm font-bold text-[#E8A020] hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => <PhotographerCardSkeleton key={i} />)
          ) : featured.length === 0 ? (
            <div className="col-span-full py-12 text-center text-brand-charcoal/50">
              No featured photographers found.
            </div>
          ) : (
            featured.map((photo) => (
              <div
                key={photo.user_id}
                className="bg-white rounded-2xl overflow-hidden border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Image & Price Tag */}
                <div className="relative h-60 w-full overflow-hidden bg-brand-charcoal/5">
                  <img
                    src={getProfileImage(photo)}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-brand-charcoal text-brand-offwhite px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    {formatINR(photo.price_per_hour)}/hr
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-xl text-brand-charcoal group-hover:text-[#E8A020] transition-colors">
                        {photo.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-[#E8A020] font-bold text-sm bg-[#E8A020]/10 px-2 py-0.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{photo.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-brand-charcoal/40 font-medium flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span>{photo.city}</span>
                    </p>

                    <p className="text-sm text-brand-charcoal/70 line-clamp-2 mt-3.5 leading-relaxed">
                      {photo.bio}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(photo.specialties || '').split(',').map((spec) => (
                        <span
                          key={spec}
                          className="text-xs bg-brand-charcoal/5 text-brand-charcoal/75 px-2.5 py-1 rounded-md font-semibold"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    <Link
                      to={`/photographer/${photo.user_id}`}
                      className="block text-center bg-brand-charcoal hover:bg-[#E8A020] text-white hover:text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                    >
                      View Profile & Availability
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
