import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Lock, User, MapPin, IndianRupee, Sparkles, AlertCircle, Loader } from 'lucide-react';

const SPECIALTY_OPTIONS = ['Wedding', 'Portrait', 'Events', 'Commercial', 'Real Estate'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('client'); // 'client' or 'photographer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [specialties, setSpecialties] = useState([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpecialtyToggle = (spec) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (role === 'photographer') {
      if (!name || !city || !pricePerHour) {
        setError('Please fill in name, city, and hourly pricing.');
        return;
      }
      if (specialties.length === 0) {
        setError('Please choose at least one specialty.');
        return;
      }
    }

    setLoading(true);
    try {
      const registerData = {
        email,
        password,
        role,
        ...(role === 'photographer' && {
          name,
          city,
          pricePerHour: parseFloat(pricePerHour),
          specialties: specialties.join(',')
        })
      };

      await register(registerData);
      
      // Redirect based on role
      if (role === 'photographer') {
        navigate('/photographer-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try using a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-lg w-full bg-white p-8 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8A020]/10 mb-2">
            <Camera className="w-6 h-6 text-[#E8A020]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-charcoal">Create your account</h2>
          <p className="text-sm text-brand-charcoal/50">Join the Mr.Photographer community to book or offer photo shoots</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 bg-brand-offwhite p-1.5 rounded-2xl border border-[#1A1A1A]/5">
          <button
            type="button"
            onClick={() => { setRole('client'); setError(''); }}
            className={`py-3 rounded-xl text-sm font-bold transition-all ${
              role === 'client'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-brand-charcoal/5'
            }`}
          >
            I want to Book
          </button>
          <button
            type="button"
            onClick={() => { setRole('photographer'); setError(''); }}
            className={`py-3 rounded-xl text-sm font-bold transition-all ${
              role === 'photographer'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-brand-charcoal/5'
            }`}
          >
            I am a Photographer
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="reg-email">Email Address</label>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
              <Mail className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="reg-pass">Password</label>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
              <Lock className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
              <input
                id="reg-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Photographer specific details */}
          {role === 'photographer' && (
            <div className="space-y-4 border-t border-[#1A1A1A]/5 pt-4 animate-fade-in">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#E8A020]">Photographer Settings</h3>
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="reg-name">Full Name</label>
                <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
                  <User className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-transparent focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* City & Hourly Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="reg-city">City</label>
                  <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
                    <MapPin className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
                    <input
                      id="reg-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className="w-full bg-transparent focus:outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="reg-rate">Price / hr (₹)</label>
                  <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-2.5 transition-colors">
                    <IndianRupee className="w-5 h-5 text-brand-charcoal/30 mr-1 flex-shrink-0" />
                    <input
                      id="reg-rate"
                      type="number"
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      placeholder="2500"
                      className="w-full bg-transparent focus:outline-none text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Specialties Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#E8A020]" />
                  <span>Choose Specialties</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map((spec) => {
                    const selected = specialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleSpecialtyToggle(spec)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selected
                            ? 'bg-[#E8A020] text-white border border-[#E8A020]'
                            : 'bg-brand-offwhite border border-[#1A1A1A]/10 text-brand-charcoal/65 hover:bg-brand-charcoal/5'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-brand-charcoal hover:bg-[#E8A020] disabled:bg-brand-charcoal/40 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            <span>Sign Up</span>
          </button>
        </form>

        <div className="border-t border-[#1A1A1A]/5 pt-4 text-center text-sm text-brand-charcoal/60">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-[#E8A020] hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
