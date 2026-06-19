import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Globe, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-16 pb-8 border-t border-[#1A1A1A]/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 text-white mb-4">
              <Camera className="w-6 h-6 text-[#E8A020]" />
              <span className="font-extrabold text-xl tracking-tight">
                Mr.<span className="text-[#E8A020]">Photographer</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Connecting you with top local photographers. Find the perfect photographer for your weddings, portraits, events, real estate, and commercials in just a few clicks.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/40 hover:text-[#E8A020] transition-colors"><Globe className="w-5 h-5" /></a>
              <a href="#" className="text-white/40 hover:text-[#E8A020] transition-colors"><Camera className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/95 mb-4">Specialties</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/search?specialty=Wedding" className="hover:text-[#E8A020] transition-colors">Wedding Photography</Link></li>
              <li><Link to="/search?specialty=Portrait" className="hover:text-[#E8A020] transition-colors">Portrait Sessions</Link></li>
              <li><Link to="/search?specialty=Events" className="hover:text-[#E8A020] transition-colors">Event Coverage</Link></li>
              <li><Link to="/search?specialty=Commercial" className="hover:text-[#E8A020] transition-colors">Commercial Shoots</Link></li>
              <li><Link to="/search?specialty=Real+Estate" className="hover:text-[#E8A020] transition-colors">Real Estate & Architectural</Link></li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/95 mb-4">Popular Cities</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/search?city=New+York" className="hover:text-[#E8A020] transition-colors">New York, NY</Link></li>
              <li><Link to="/search?city=Los+Angeles" className="hover:text-[#E8A020] transition-colors">Los Angeles, CA</Link></li>
              <li><Link to="/search?city=San+Francisco" className="hover:text-[#E8A020] transition-colors">San Francisco, CA</Link></li>
              <li><Link to="/search?city=Chicago" className="hover:text-[#E8A020] transition-colors">Chicago, IL</Link></li>
              <li><Link to="/search?city=Miami" className="hover:text-[#E8A020] transition-colors">Miami, FL</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white/95 mb-4">Mr.Photographer</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/register" className="hover:text-[#E8A020] transition-colors">Apply as a Photographer</Link></li>
              <li><Link to="/login" className="hover:text-[#E8A020] transition-colors">Customer Login</Link></li>
              <li><a href="#" className="hover:text-[#E8A020] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#E8A020] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#E8A020] transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/40">
          <p>© {new Date().getFullYear()} Mr.Photographer Inc. All rights reserved.</p>
          <p className="flex items-center mt-4 md:mt-0">
            Made with <Heart className="w-3.5 h-3.5 mx-1 text-red-500 fill-current" /> for beautiful memories.
          </p>
        </div>
      </div>
    </footer>
  );
}
