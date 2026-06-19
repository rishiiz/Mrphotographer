import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'photographer') return '/photographer-dashboard';
    return '/client-dashboard';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#1A1A1A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-[#1A1A1A]">
              <Camera className="w-8 h-8 text-[#E8A020]" />
              <span className="font-extrabold text-2xl tracking-tight font-sans">
                Mr.<span className="text-[#E8A020]">Photographer</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/search" className="text-[#1A1A1A]/75 hover:text-[#1A1A1A] font-medium transition-colors">
              Find Photographers
            </Link>
            
            {user ? (
              <>
                <Link to={getDashboardPath()} className="flex items-center space-x-1.5 text-[#1A1A1A]/75 hover:text-[#1A1A1A] font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="h-4 w-px bg-[#1A1A1A]/20"></div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-[#1A1A1A]/60 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-[#E8A020]" />
                    <span>{user.email}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm bg-transparent border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#FAFAF8] text-[#1A1A1A] px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#1A1A1A]/75 hover:text-[#1A1A1A] font-medium transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#E8A020] hover:bg-[#d08f1b] text-white px-5 py-2 rounded-full font-bold shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Join as Photographer
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#1A1A1A] hover:text-[#E8A020] hover:bg-[#1A1A1A]/5 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1A1A1A]/10 bg-[#FAFAF8] px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
          >
            Find Photographers
          </Link>
          
          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
              >
                Dashboard ({user.role})
              </Link>
              <div className="px-3 py-2 text-sm text-[#1A1A1A]/60">
                Logged in as: {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-[#E8A020] text-white px-3 py-2.5 rounded-full font-bold"
              >
                Join as Photographer
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
