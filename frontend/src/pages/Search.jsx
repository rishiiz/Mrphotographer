import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PhotographerCardSkeleton } from '../components/Skeleton';
import { Search as SearchIcon, Filter, MapPin, Star, Calendar, ArrowUpDown, Compass, Map, List } from 'lucide-react';
import { formatINR, getProfileImage } from '../utils/currency';

// Custom Gold/Amber Marker Icon to match the design palette
const amberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Center mapping for predefined cities
const CITY_COORDS = {
  'pune': [18.5204, 73.8567],
  'hadapsar': [18.5089, 73.9260],
  'phursungi': [18.4680, 73.9450],
  'bhekrai nagar': [18.4720, 73.9420],
  'uruli devachi': [18.4550, 73.9350],
  'shewalewadi': [18.4875, 73.9580],
};

// Map controller to change view dynamically
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

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
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'map'

  // Additional filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [availDate, setAvailDate] = useState('');
  const [sortBy, setSortBy] = useState('nearest');

  // Map settings
  const [mapCenter, setMapCenter] = useState([18.472, 73.942]); // Bhekrai Nagar, Pune
  const [mapZoom, setMapZoom] = useState(13);

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

        // Center map to searched parameters
        if (lat && lng) {
          setMapCenter([parseFloat(lat), parseFloat(lng)]);
          setMapZoom(11);
        } else if (city && CITY_COORDS[city.toLowerCase()]) {
          setMapCenter(CITY_COORDS[city.toLowerCase()]);
          setMapZoom(11);
        } else if (data.length > 0 && data[0].lat && data[0].lng) {
          // Center on first photographer result if available
          setMapCenter([data[0].lat, data[0].lng]);
          setMapZoom(10);
        }
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

      {/* Main Split Grid (List & Map) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden relative">
        
        {/* Toggle button on Mobile */}
        <div className="lg:hidden absolute bottom-6 right-6 z-40 shadow-lg">
          <button
            onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
            className="flex items-center space-x-2 bg-brand-charcoal hover:bg-[#E8A020] text-white px-5 py-3.5 rounded-full font-bold transition-colors"
          >
            {mobileView === 'list' ? (
              <>
                <Map className="w-5 h-5" />
                <span>Show Map</span>
              </>
            ) : (
              <>
                <List className="w-5 h-5" />
                <span>Show List</span>
              </>
            )}
          </button>
        </div>

        {/* Left Side: Photographer Listings */}
        <div className={`lg:col-span-7 overflow-y-auto pr-2 space-y-4 ${
          mobileView === 'list' ? 'block h-full' : 'hidden lg:block h-full'
        }`}>
          <div className="flex justify-between items-center px-1">
            <p className="text-sm font-semibold text-brand-charcoal/60">
              Found {photographers.length} photographer{photographers.length === 1 ? '' : 's'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <PhotographerCardSkeleton key={i} />)}
            </div>
          ) : photographers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white rounded-2xl border border-[#1A1A1A]/5">
              <SearchIcon className="w-12 h-12 text-brand-charcoal/20" />
              <h3 className="text-lg font-bold">No photographers match your search</h3>
              <p className="text-sm text-brand-charcoal/50 max-w-sm">Try widening your filters, searching a different city, or removing specializations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
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

        {/* Right Side: Leaflet Map */}
        <div className={`lg:col-span-5 h-full relative rounded-2xl overflow-hidden border border-[#1A1A1A]/10 shadow-sm ${
          mobileView === 'map' ? 'block h-full w-full' : 'hidden lg:block h-full'
        }`}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full min-h-[400px] lg:min-h-0 z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeMapView center={mapCenter} zoom={mapZoom} />
            
            {photographers.map((photo) => {
              if (!photo.lat || !photo.lng) return null;
              return (
                <Marker
                  key={photo.user_id}
                  position={[photo.lat, photo.lng]}
                  icon={amberIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-2">
                      <div className="font-bold text-sm text-brand-charcoal">{photo.name}</div>
                      <div className="text-xs text-brand-charcoal/60 flex items-center space-x-1">
                        <Star className="w-3 h-3 text-[#E8A020] fill-current" />
                        <span>{photo.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{formatINR(photo.price_per_hour)}/hr</span>
                      </div>
                      <div className="text-xs font-semibold text-brand-charcoal/70 line-clamp-1">{photo.specialties}</div>
                      <Link
                        to={`/photographer/${photo.user_id}`}
                        className="block text-center bg-[#E8A020] text-white hover:bg-[#d08f1b] font-bold text-xs py-1.5 px-2 rounded mt-1.5 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
