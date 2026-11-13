import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { TestAccountSwitcher } from './components/auth/TestAccountSwitcher';
import { AuthModal } from './components/auth/AuthModal';
import { EventModal } from './components/events/EventModal';
import { ClubModal } from './components/clubs/ClubModal';
import { SqlMigrationModal } from './components/admin/SqlMigrationModal';

import { HomeView } from './views/HomeView';
import { NormalDashboardView } from './views/NormalDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { UnauthorizedView } from './views/UnauthorizedView';

import { dataStore, useDataStoreVersion } from './lib/dataStore';
import { EventItem, Club } from './types';

function AppContent() {
  const { user, canAccessAdmin, loading } = useAuth();
  useDataStoreVersion();

  // Router State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);

  // Sync browser URL history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Loading IIT Dharwad Portal...
          </span>
        </div>
      </div>
    );
  }

  // Route Rendering Logic
  const renderCurrentRoute = () => {
    // 1. UNAUTHORIZED ROUTE
    if (currentRoute === '/unauthorized') {
      return <UnauthorizedView onNavigate={navigateTo} />;
    }

    // 2. ADMIN ROUTES (/admin, /admin/events, /admin/clubs, etc.)
    if (currentRoute.startsWith('/admin')) {
      if (!user) {
        // Logged out: Prompt auth
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Administrator Login Required</h2>
            <p className="text-xs text-slate-400">
              Please sign in with your institutional credentials to access administrative functions.
            </p>
            <button
              onClick={() => handleOpenAuth('login')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Log In With Institutional Account
            </button>
          </div>
        );
      }

      if (!canAccessAdmin) {
        // Normal student visiting /admin: Deny with 403
        return <UnauthorizedView onNavigate={navigateTo} />;
      }

      // Determine active admin tab from route
      let adminTab = 'overview';
      if (currentRoute === '/admin/events') adminTab = 'events';
      else if (currentRoute === '/admin/announcements') adminTab = 'announcements';
      else if (currentRoute === '/admin/clubs') adminTab = 'clubs';
      else if (currentRoute === '/admin/administrators') adminTab = 'admins';
      else if (currentRoute === '/admin/activity') adminTab = 'activity';

      return (
        <AdminDashboardView
          initialTab={adminTab}
          onPreviewEvent={(evt) => setSelectedEvent(evt)}
          onNavigateStudentDashboard={() => navigateTo('/dashboard')}
        />
      );
    }

    // 3. STUDENT DASHBOARD ROUTES (/dashboard, /dashboard/events, /dashboard/clubs, /dashboard/announcements, /dashboard/account)
    if (currentRoute.startsWith('/dashboard')) {
      if (!user) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
            <h2 className="text-xl font-bold text-white">IIT Dharwad Authentication Required</h2>
            <p className="text-xs text-slate-400">
              Please log in with your official @iitdh.ac.in account to enter the student dashboard.
            </p>
            <button
              onClick={() => handleOpenAuth('login')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Sign In with Institute SSO
            </button>
          </div>
        );
      }

      let dashboardTab = 'overview';
      if (currentRoute === '/dashboard/events') dashboardTab = 'upcoming';
      else if (currentRoute === '/dashboard/clubs') dashboardTab = 'clubs';
      else if (currentRoute === '/dashboard/announcements') dashboardTab = 'announcements';
      else if (currentRoute === '/dashboard/account') dashboardTab = 'account';

      return (
        <NormalDashboardView
          initialTab={dashboardTab}
          onOpenDetails={(evt) => setSelectedEvent(evt)}
          onSelectClub={(club) => setSelectedClub(club)}
          onNavigateAdmin={() => navigateTo('/admin')}
        />
      );
    }

    // 4. DEFAULT: HOMEPAGE (/)
    return (
      <HomeView
        onNavigate={navigateTo}
        onOpenDetails={(evt) => setSelectedEvent(evt)}
        onSelectClub={(club) => setSelectedClub(club)}
        onOpenAuth={() => handleOpenAuth('login')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Quick Test Account Switcher Bar for Seamless Evaluation */}
      <TestAccountSwitcher />

      {/* Main Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Viewport Content */}
      <div className="flex-1">
        {renderCurrentRoute()}
      </div>

      {/* Footer */}
      <Footer
        onNavigate={navigateTo}
        onOpenSqlMigration={() => setSqlModalOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccessNavigate={(target) => navigateTo(target)}
      />

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <ClubModal
        club={selectedClub}
        events={dataStore.getEvents(false)}
        announcements={dataStore.getAnnouncements(false)}
        onClose={() => setSelectedClub(null)}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
      />

      <SqlMigrationModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
