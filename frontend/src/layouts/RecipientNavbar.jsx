import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export function RecipientNavbar() {
  // Automatically applies the red pill style if the route matches
  const navLinkClass = ({ isActive }) => 
    `px-5 py-2 rounded-full font-bold text-sm tracking-wide transition-colors ${
      isActive 
        ? 'bg-danger text-white' 
        : 'text-white hover:bg-white/10'
    }`;

  return (
    <nav className="bg-ink-soft px-8 py-4 flex items-center justify-between text-white shadow-md">
      {/* Left side: Logo & Navigation */}
      <div className="flex items-center gap-10">
        
        {/* Brand/Logo */}
        <Link to="/reservations" className="flex items-center gap-3">
          <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center">
            {/* Minimal Leaf SVG */}
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wider">AFF</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          <NavLink to="/reservations" className={navLinkClass}>
            BROWSE
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            HISTORY
          </NavLink>
        </div>
      </div>

      {/* Right side: User Profile Icon */}
      <div>
        <Link to="/profile" className="p-2 block hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}