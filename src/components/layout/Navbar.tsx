import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  LogIn, 
  LayoutDashboard, 
  ShieldAlert, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
}) => {
  const { user, canAccessAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDashboardClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onNavigate('/dashboard');
    }
  };

  const handleAdminClick = () => {
    if (!user) {
      onOpenAuth();
    } else if (canAccessAdmin) {
      onNavigate('/admin');
    } else {
      onNavigate('/unauthorized');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark / single element */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left group whitespace-nowrap shrink-0 focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 group-hover:scale-105 transition-transform">
            <span className="font-bold text-xs tracking-tighter">IITDh</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
              IIT Dharwad
            </span>
            <span className="text-[11px] text-slate-400 tracking-normal leading-tight font-medium">
              Campus Events Portal
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('/')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentRoute === '/' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('/dashboard/events')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentRoute === '/dashboard/events' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => onNavigate('/dashboard/clubs')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentRoute === '/dashboard/clubs' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Clubs
          </button>
          <button
            onClick={() => onNavigate('/dashboard/announcements')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              currentRoute === '/dashboard/announcements' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Announcements
          </button>

          {/* Conditional Admin Dashboard Link: ONLY for Super Admin or assigned Club Admin */}
          {canAccessAdmin && (
            <button
              onClick={handleAdminClick}
              className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                currentRoute.startsWith('/admin')
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-500/50'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-800/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / User profile */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDashboardClick}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  currentRoute.startsWith('/dashboard')
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Student Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('/dashboard/account')}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title={`Account: ${user.email}`}
              >
                <UserIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDashboardClick}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-950 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Normal Dashboard / Login</span>
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {user && canAccessAdmin && (
            <button
              onClick={handleAdminClick}
              className="p-1.5 rounded-md bg-purple-950/70 text-purple-300 border border-purple-700/50 text-xs font-semibold"
            >
              Admin
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('/dashboard/events');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Events
            </button>
            <button
              onClick={() => {
                onNavigate('/dashboard/clubs');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Clubs
            </button>
            <button
              onClick={() => {
                onNavigate('/dashboard/announcements');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
            >
              Announcements
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                handleDashboardClick();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{user ? 'Normal Dashboard' : 'Normal Dashboard / Login'}</span>
            </button>

            {canAccessAdmin && (
              <button
                onClick={() => {
                  handleAdminClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 border border-purple-600/40 text-purple-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 rounded-lg text-rose-300 hover:bg-rose-950/30 text-sm font-medium text-left"
              >
                Log Out ({user.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
