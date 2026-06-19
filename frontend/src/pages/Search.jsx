import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { PhotographerCardSkeleton } from '../components/Skeleton';
import { Search as SearchIcon, Filter, MapPin, Star, Calendar, ArrowUpDown, Compass, List } from 'lucide-react';
import { formatINR, getProfileImage } from '../utils/currency';



export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL parameters
  const [city, setCity] = useState(searchParams.get('city') || 'Pune');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [lat, setLat] = useState(searchParams.get('lat') || '');
  const [lng, setLng] = useState(searchParams.get('lng') || '');

  // UI state
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Additional filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [availDate, setAvailDate] = useState('');
  const [sortBy, setSortBy] = useState('nearest');



  // Fetch photographers on search configuration changes
  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const filters = {
          city,
          specialty,
          minPrice,
          maxPrice,
          rating: minRating,
          date: availDate,
          lat,
          lng,
          sortBy
        };

        const data = await api.getPhotographers(filters);
        setPhotographers(data);


      } catch (err) {
        console.error('Failed to search photographers', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [city, specialty, minPrice, maxPrice, minRating, availDate, lat, lng, sortBy]);

  // Geolocation trigger
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setCity(''); // Clear text city to use precise lat/lng
        setSearchParams({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation failed', error);
        alert('Could not retrieve your coordinates. Please enter a city name.');
      }
    );
  };

  const handleCityChange = (e) => {
    const val = e.target.value;
    setCity(val);
    if (lat || lng) {
      setLat('');
      setLng('');
      setSearchParams({ city: val });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Top Search & Filter Bar */}
      <section className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-sm space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Location input */}
          <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3.5 py-2.5">
            <MapPin className="w-5 h-5 text-brand-charcoal/40 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              placeholder="City (e.g. Pune, Hadapsar)"
              className="w-full bg-transparent focus:outline-none text-sm font-medium"
            />
            <button
              onClick={handleGeolocation}
              className="text-[#E8A020] hover:text-[#d08f1b] transition-colors p-1"
              title="Detect my location"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>

          {/* Specialty */}
          <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3.5 py-2.5">
            <Filter className="w-5 h-5 text-brand-charcoal/40 mr-2 flex-shrink-0" />
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm font-medium appearance-none"
            >
              <option value="">All Specialties</option>
              <option value="Wedding">Wedding</option>
              <option value="Portrait">Portrait</option>
              <option value="Events">Events</option>
              <option value="Commercial">Commercial</option>
              <option value="Real Estate">Real Estate</option>
            </select>
          </div>

          {/* Pricing Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3 py-2.5">
              <span className="text-sm text-brand-charcoal/40 mr-1">₹</span>
              <input
                type="number"
                placeholder="Min/hr"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3 py-2.5">
              <span className="text-sm text-brand-charcoal/40 mr-1">₹</span>
              <input
                type="number"
                placeholder="Max/hr"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Sorting Option */}
          <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-xl px-3.5 py-2.5">
            <ArrowUpDown className="w-5 h-5 text-brand-charcoal/40 mr-2 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm font-medium appearance-none"
            >
              <option value="nearest">Sort by: Distance</option>
              <option value="highest_rated">Sort by: Star Rating</option>
              <option value="lowest_price">Sort by: Price (Low to High)</option>
              <option value="most_reviewed">Sort by: Most Reviewed</option>
            </select>
          </div>

        </div>

        {/* Second Row Filters (Availability & Stars) */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-[#1A1A1A]/5">
          {/* Availability Date */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Date:</span>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-4 h-4 text-brand-charcoal/40 mr-1.5" />
              <input
                type="date"
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
                className="bg-transparent focus:outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Star Ratings */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Rating:</span>
            <div className="flex space-x-1.5">
              {[3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setMinRating(minRating == stars ? '' : stars)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    minRating == stars
                      ? 'bg-[#E8A020] text-white'
                      : 'bg-brand-offwhite border border-[#1A1A1A]/10 text-brand-charcoal/70 hover:bg-brand-charcoal/5'
                  }`}
                >
                  <span>{stars}+</span>
                  <Star className={`w-3 h-3 ${minRating == stars ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters button */}
          {(minPrice || maxPrice || minRating || availDate) && (
            <button
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setMinRating('');
                setAvailDate('');
              }}
              className="text-xs text-[#E8A020] hover:text-[#d08f1b] font-bold self-center ml-auto hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* Photographer Listings */}
        <div className="overflow-y-auto pr-2 space-y-4 h-full">
          <div className="flex justify-between items-center px-1">
            <p className="text-sm font-semibold text-brand-charcoal/60">
              Found {photographers.length} photographer{photographers.length === 1 ? '' : 's'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <PhotographerCardSkeleton key={i} />)}
            </div>
          ) : photographers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white rounded-2xl border border-[#1A1A1A]/5">
              <SearchIcon className="w-12 h-12 text-brand-charcoal/20" />
              <h3 className="text-lg font-bold">No photographers match your search</h3>
              <p className="text-sm text-brand-charcoal/50 max-w-sm">Try widening your filters, searching a different city, or removing specializations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
              {photographers.map((photo) => (
                <div
                  key={photo.user_id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
                >
                  {/* Photo Profile Image */}
                  <div className="relative h-44 w-full bg-brand-charcoal/5">
                    <img
                      src={getProfileImage(photo)}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-brand-charcoal text-brand-offwhite px-2.5 py-1 rounded-full text-xs font-bold">
                      {formatINR(photo.price_per_hour)}/hr
                    </div>
                  </div>

                  {/* Profile Specs */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-brand-charcoal group-hover:text-[#E8A020] transition-colors line-clamp-1">
                          {photo.name}
                        </h3>
                        <div className="flex items-center space-x-1 text-[#E8A020] font-bold text-xs bg-[#E8A020]/10 px-2 py-0.5 rounded">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{photo.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-brand-charcoal/40 font-medium mt-1">
                        <p className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{photo.city}</span>
                        </p>
                        {photo.distance !== null && (
                          <span className="bg-brand-charcoal/5 text-brand-charcoal/80 px-2 py-0.5 rounded font-bold">
                            {photo.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-brand-charcoal/60 line-clamp-2 mt-3">
                        {photo.bio}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {(photo.specialties || '').split(',').map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] bg-brand-charcoal/5 text-brand-charcoal/70 px-2 py-0.5 rounded font-semibold"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

                      <Link
                        to={`/photographer/${photo.user_id}`}
                        className="block text-center bg-brand-charcoal hover:bg-[#E8A020] text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </div>
    </div>
  );
}
