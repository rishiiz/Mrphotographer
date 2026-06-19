import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect away
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'photographer') navigate('/photographer-dashboard');
        else navigate('/client-dashboard');
      }
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Redirect is handled in useEffect
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#1A1A1A]/5 shadow-sm space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8A020]/10 mb-2">
            <Camera className="w-6 h-6 text-[#E8A020]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-charcoal">Welcome back</h2>
          <p className="text-sm text-brand-charcoal/50">Enter your credentials to access your Mr.Photographer account</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="email">Email Address</label>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-3 transition-colors">
              <Mail className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60" htmlFor="password">Password</label>
            <div className="relative flex items-center bg-brand-offwhite border border-[#1A1A1A]/10 focus-within:border-[#E8A020] rounded-xl px-3.5 py-3 transition-colors">
              <Lock className="w-5 h-5 text-brand-charcoal/30 mr-2 flex-shrink-0" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-brand-charcoal hover:bg-[#E8A020] disabled:bg-brand-charcoal/40 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            <span>Sign In</span>
          </button>
        </form>

        <div className="border-t border-[#1A1A1A]/5 pt-4 text-center text-sm text-brand-charcoal/60">
          <span>New to Mr.Photographer? </span>
          <Link to="/register" className="font-bold text-[#E8A020] hover:underline">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}
