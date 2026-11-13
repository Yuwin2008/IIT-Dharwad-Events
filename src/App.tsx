import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { ThemeProvider } from './lib/themeContext';
import { ViewportProvider, useViewport } from './lib/viewportContext';
import { Monitor, Smartphone } from 'lucide-react';
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
import { useEventPushScheduler } from './lib/useEventPushScheduler';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
} from './lib/pushNotifications';
import { EventItem, Club } from './types';

function AppContent() {
  const { user, canAccessAdmin, loading } = useAuth();
  const { viewportMode, toggleViewportMode } = useViewport();
  useDataStoreVersion();
  useEventPushScheduler(user?.email);

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

  // Sync browser URL history and shared ?event= query link
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedEventId = params.get('event');
    if (sharedEventId && !selectedEvent) {
      const evt = dataStore.getEventById(sharedEventId);
      if (evt) {
        setSelectedEvent(evt);
      }
    }
  }, [selectedEvent]);

  useEffect(() => {
    const handleOpenEventNotification = (ev: Event) => {
      const customEv = ev as CustomEvent<{ eventId?: string }>;
      const eventId = customEv.detail?.eventId;
      if (!eventId) return;
      const evt = dataStore.getEventById(eventId);
      if (evt) {
        setSelectedEvent(evt);
      }
    };

    window.addEventListener('iitdh-open-event', handleOpenEventNotification);
    return () => window.removeEventListener('iitdh-open-event', handleOpenEventNotification);
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
      else if (currentRoute === '/dashboard/notifications') dashboardTab = 'notifications';
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

  const appShell = (
    <div
      className={
        viewportMode === 'phone'
          ? 'w-full max-w-[390px] mx-auto bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-x-hidden min-h-[780px] phone-viewport-frame'
          : 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white'
      }
    >
      {/* Portal Session Bar */}
      <TestAccountSwitcher onOpenAuth={(mode) => handleOpenAuth(mode || 'login')} />

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
        onSuccessNavigate={(target) => {
          if (!currentRoute.startsWith('/admin')) {
            navigateTo(target);
          }
        }}
      />

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isBookmarked={user && selectedEvent ? dataStore.isEventBookmarked(user.email, selectedEvent.id) : false}
        onToggleBookmark={(eventId) => {
          if (!user?.email) {
            handleOpenAuth('login');
            return;
          }
          const wasBookmarked = dataStore.isEventBookmarked(user.email, eventId);
          void dataStore.toggleBookmarkEvent(user.email, eventId);
          if (!wasBookmarked && getBrowserPushPermission() === 'default') {
            void requestBrowserPushPermission(user.email);
          }
        }}
      />

      <ClubModal
        club={selectedClub}
        events={dataStore.getEvents(false)}
        announcements={dataStore.getAnnouncements(false)}
        onClose={() => setSelectedClub(null)}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        isFollowing={user && selectedClub ? dataStore.isFollowingClub(user.email, selectedClub.id) : false}
        onToggleFollow={user ? (clubId) => { void dataStore.toggleFollowClub(user.email, clubId); } : undefined}
      />

      <SqlMigrationModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />
    </div>
  );

  if (viewportMode === 'phone') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-4 px-2 flex flex-col items-center">
        <div className="w-full max-w-[390px] mb-3 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs shadow-sm">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phone View (390px)</span>
          </div>
          <button
            type="button"
            onClick={toggleViewportMode}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Switch to Desktop</span>
          </button>
        </div>
        {appShell}
      </div>
    );
  }

  return appShell;
}

export default function App() {
  return (
    <ThemeProvider>
      <ViewportProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ViewportProvider>
    </ThemeProvider>
  );
}
