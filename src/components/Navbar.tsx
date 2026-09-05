import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Calendar,
  Lock,
  Sparkles,
  Stethoscope,
  Activity,
  Award,
  Image,
  BookOpen,
  Phone
} from 'lucide-react';

interface NavbarProps {
  onOpenBooking: (branch?: 'belgaum' | 'goa') => void;
  onOpenAdmin?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenAdmin,
  isAdminLoggedIn = false,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  // Exactly 4 primary visible links in top bar as requested
  const mainBarLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#doctors' },
    { label: 'Services', href: '#clinics' },
    { label: 'Photo Gallery', href: '#gallery' },
  ];

  // Extended navigation links inside the 3-line menu
  const drawerLinks = [
    { label: 'Home', href: '#home', icon: Sparkles },
    { label: 'About Us', href: '#doctors', icon: Stethoscope },
    { label: 'Services', href: '#clinics', icon: Award },
    { label: 'Conditions Treated', href: '#treatments', icon: Activity },
    { label: 'Pre & Post Results', href: '#pre-post', icon: Image },
    { label: 'Photo Gallery', href: '#gallery', icon: Image },
    { label: 'Patient Testimonials', href: '#testimonials', icon: Sparkles },
    { label: 'Health Blog', href: '#blog', icon: BookOpen },
    { label: 'Contact Us', href: '#contact', icon: Phone },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          {/* Green Mortar and Pestle Icon with Leaves */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#335e35] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100"
            >
              {/* Mortar body */}
              <path d="M4 11a8 8 0 0 0 16 0v-1H4v1z" fill="currentColor" fillOpacity="0.25" />
              <path d="M3 10h18" />
              <path d="M6 10v1a6 6 0 0 0 12 0v-1" />
              <path d="M9 17l-1 4h8l-1-4" />
              {/* Pestle */}
              <path d="M14.5 4l-4 7" strokeWidth="2.2" />
              {/* Leaf sprout */}
              <path d="M12 4c.5-1.5 2-2 3.5-1.5 1 .3 1.5 1.5 1 2.5-1 1-3 1.5-4.5 1" fill="currentColor" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1c3f3a] font-serif-display leading-none">
              Dr. Dravid's
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.22em] font-bold text-[#335e35] uppercase mt-1">
              HOMEOPATHIC CLINIC
            </span>
          </div>
        </a>

        {/* Desktop Primary Bar: 4 visible links + 3-Line Menu */}
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Main 4 links visible on laptop/desktop */}
          <nav className="hidden md:flex items-center gap-6 xl:gap-8 text-[15px] font-normal text-slate-700">
            {mainBarLinks.map((link) => {
              const isActive = activeNav === link.label;
              return (
                <div key={link.label} className="relative flex flex-col items-center">
                  <a
                    href={link.href}
                    onClick={() => setActiveNav(link.label)}
                    className={`transition-colors py-1.5 cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'text-[#335e35] font-semibold' 
                        : 'text-slate-800 hover:text-[#335e35]'
                    }`}
                  >
                    {link.label}
                  </a>
                  {isActive && (
                    <span className="w-8 h-[2.5px] bg-[#335e35] rounded-full absolute -bottom-1"></span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 3-Line Hamburger Menu Button */}
          <button
            id="nav-hamburger-btn"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-800 hover:text-[#335e35] hover:bg-emerald-50/80 border border-slate-300 transition-all cursor-pointer shadow-2xs"
            aria-label="Toggle full menu"
            title="Open Menu"
          >
            {drawerOpen ? <X className="w-5 h-5 text-[#335e35]" /> : <Menu className="w-5 h-5 text-slate-900" />}
            <span className="text-xs font-bold text-slate-900 hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>

      {/* 3-Line Flyout Menu (Clean single menu list with Admin at the end) */}
      {drawerOpen && (
        <div 
          id="full-menu-drawer"
          className="bg-white border-b border-slate-200 shadow-xl px-4 sm:px-8 py-5 animate-in fade-in slide-in-from-top-3"
        >
          <div className="max-w-7xl mx-auto">
            {/* Menu Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {drawerLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => {
                      setActiveNav(link.label);
                      setDrawerOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-900 hover:text-[#335e35] transition-colors border border-slate-200 hover:border-emerald-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-[#335e35] flex items-center justify-center group-hover:bg-[#335e35] group-hover:text-white transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{link.label}</span>
                  </a>
                );
              })}

              {/* Admin Panel as regular menu item in the list */}
              <button
                id="drawer-admin-btn"
                onClick={() => {
                  setDrawerOpen(false);
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/80 text-slate-900 hover:text-amber-900 transition-colors border border-slate-200 hover:border-amber-200 group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">Admin Panel</span>
                </div>
                {isAdminLoggedIn ? (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Active</span>
                ) : (
                  <span className="text-xs text-slate-700 group-hover:text-amber-800 font-bold">Login</span>
                )}
              </button>
            </div>

            {/* Quick Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-800 font-medium">
                Dr. Yogesh Dravid &amp; Dr. Prachi Dravid &bull; Belgaum &bull; Helpline: +91 8762465349
              </p>

              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenBooking('belgaum');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-6 rounded-full bg-[#335e35] hover:bg-[#284c2a] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


