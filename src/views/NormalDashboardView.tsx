import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import { dataStore, useDataStoreVersion } from '../lib/dataStore';
import { EventCard } from '../components/events/EventCard';
import { ClubCard } from '../components/clubs/ClubCard';
import { AnnouncementCard } from '../components/announcements/AnnouncementCard';
import { VibeAThonHero } from '../components/events/VibeAThonHero';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { formatDateTimeDisplay } from '../lib/dateValidation';
import { 
  LayoutDashboard, 
  Calendar, 
  Building2, 
  Megaphone, 
  User as UserIcon, 
  LogOut, 
  Search, 
  ShieldCheck, 
  GraduationCap,
  ChevronRight,
  Bell,
  BellRing,
  CheckCheck,
  X,
  Bookmark
} from 'lucide-react';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
} from '../lib/pushNotifications';
import { EventItem, Club, PortalNotification } from '../types';

interface NormalDashboardViewProps {
  initialTab?: string;
  onOpenDetails: (event: EventItem) => void;
  onSelectClub: (club: Club) => void;
  onNavigateAdmin?: () => void;
}

export const NormalDashboardView: React.FC<NormalDashboardViewProps> = ({
  initialTab = 'overview',
  onOpenDetails,
  onSelectClub,
  onNavigateAdmin,
}) => {
  const { user, logout, canAccessAdmin } = useAuth();
  useDataStoreVersion();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const clubs = dataStore.getClubs();
  const events = dataStore.getEvents(false);
  const announcements = dataStore.getAnnouncements(false);
  const followedClubIds = dataStore.getFollowedClubIds(user?.email);
  const bookmarkedEventIds = dataStore.getBookmarkedEventIds(user?.email);
  const bookmarkedEvents = events.filter((e) => bookmarkedEventIds.includes(e.id));
  const notifications = dataStore.getStudentNotifications(user?.email);
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Notification popover & live incoming alert banner
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [liveAlert, setLiveAlert] = useState<PortalNotification | null>(null);
  const seenNotifIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    if (seenNotifIdsRef.current === null) {
      seenNotifIdsRef.current = currentIds;
      return;
    }

    const newlyArrived = notifications.find((n) => !seenNotifIdsRef.current!.has(n.id) && !n.isRead);
    seenNotifIdsRef.current = currentIds;
    if (newlyArrived) {
      setLiveAlert(newlyArrived);
    }
  }, [notifications]);

  // Filters for Events Tab
  const [eventSearch, setEventSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [bookmarkedOnlyFilter, setBookmarkedOnlyFilter] = useState(false);

  // Filters for Announcements Tab
  const [announcementClubFilter, setAnnouncementClubFilter] = useState('ALL');

  // Search and domain filter for Clubs Tab
  const [clubSearch, setClubSearch] = useState('');
  const [clubDomainFilter, setClubDomainFilter] = useState<'ALL' | 'Technical' | 'Cultural' | 'Sports'>('ALL');

  const featuredEvent = events.find((e) => e.title.includes('VIBE-A-THON')) || events[0];

  const handleToggleFollow = (clubId: string) => {
    if (!user?.email) return;
    void dataStore.toggleFollowClub(user.email, clubId);
  };

  const handleToggleBookmark = (eventId: string) => {
    if (!user?.email) return;
    const wasBookmarked = dataStore.isEventBookmarked(user.email, eventId);
    void dataStore.toggleBookmarkEvent(user.email, eventId);
    if (!wasBookmarked && getBrowserPushPermission() === 'default') {
      void requestBrowserPushPermission(user.email);
    }
  };

  const handleMarkNotificationsRead = (ids: string[]) => {
    if (!user?.email || ids.length === 0) return;
    void dataStore.markNotificationsRead(user.email, ids);
  };

  const handleMarkAllRead = () => {
    const unreadIds = unreadNotifications.map((n) => n.id);
    if (unreadIds.length > 0) {
      handleMarkNotificationsRead(unreadIds);
    }
  };

  const handleOpenNotificationItem = (item: PortalNotification) => {
    if (!item.isRead) {
      handleMarkNotificationsRead([item.id]);
    }
    setNotifMenuOpen(false);
    setLiveAlert(null);
    if ((item.kind === 'event' || item.kind === 'reminder') && item.event) {
      onOpenDetails(item.event);
    } else if (item.kind === 'announcement') {
      setAnnouncementClubFilter(item.clubId || 'ALL');
      setActiveTab('announcements');
    }
  };

  // Event filtering logic
  const filteredEvents = events.filter((evt) => {
    if (bookmarkedOnlyFilter && !bookmarkedEventIds.includes(evt.id)) return false;
    if (clubFilter !== 'ALL' && evt.club_id !== clubFilter) return false;
    if (timeFilter === 'upcoming') {
      const isPast = new Date(evt.event_date).getTime() < new Date('2026-11-12').getTime();
      if (isPast) return false;
    }
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.short_description?.toLowerCase().includes(q) ||
        evt.club?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Club filtering logic
  const filteredClubs = clubs.filter((c) => {
    if (clubDomainFilter !== 'ALL' && c.domain.toLowerCase() !== clubDomainFilter.toLowerCase()) {
      return false;
    }
    if (!clubSearch.trim()) return true;
    const q = clubSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q)
    );
  });

  // Announcement filtering logic
  const filteredAnnouncements = announcements.filter((ann) => {
    if (announcementClubFilter === 'CAMPUS_WIDE') {
      return ann.type === 'Campus-wide Announcement' || !ann.club_id;
    }
    if (announcementClubFilter !== 'ALL') {
      return ann.club_id === announcementClubFilter;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-6 sticky top-20">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                Student Portal
              </span>
              <span className="text-sm font-bold text-white truncate block">
                {user?.fullName || 'Student'}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Upcoming Events</span>
              </div>
              <span className="font-mono text-[11px] opacity-75">{events.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'clubs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Clubs Directory</span>
              </div>
              <span className="font-mono text-[11px] opacity-75">{clubs.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'announcements'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4" />
                <span>Announcements</span>
              </div>
              <span className="font-mono text-[11px] opacity-75">{announcements.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Notification Center</span>
              </div>
              {unreadNotifications.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold">
                  {unreadNotifications.length}
                </span>
              ) : (
                <span className="font-mono text-[11px] opacity-75">{notifications.length}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'account'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4" />
                <span>My Account</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          {/* Conditional Admin Switch Button */}
          {canAccessAdmin && onNavigateAdmin && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onNavigateAdmin}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Admin Dashboard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="lg:col-span-9 space-y-8">
          {/* Live Incoming Alert Toast Banner */}
          {liveAlert && (
            <div className="p-4 bg-indigo-950/70 border border-indigo-500/50 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-indigo-200 uppercase tracking-wider text-[10px] block">
                    {liveAlert.kind === 'reminder'
                      ? `Starting Soon · ${liveAlert.clubName}`
                      : liveAlert.kind === 'announcement'
                      ? `New Announcement from ${liveAlert.clubName}`
                      : `New Event Added by ${liveAlert.clubName}`}
                  </span>
                  <p className="text-sm font-bold text-white">{liveAlert.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenNotificationItem(liveAlert)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  View Alert
                </button>
                <button
                  type="button"
                  onClick={() => setLiveAlert(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors"
                  aria-label="Dismiss live alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcome message */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                    IIT Dharwad Student Portal
                  </span>
                  <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                    Welcome back, {user?.fullName || 'Student'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Logged in with official institutional email <code className="text-slate-200 font-mono">{user?.email}</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Notification Center Quick Bell & Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setNotifMenuOpen((prev) => !prev)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 relative"
                      aria-label="Open notification center"
                    >
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span>Alerts</span>
                      {unreadNotifications.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
                          {unreadNotifications.length}
                        </span>
                      )}
                    </button>

                    {notifMenuOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white">Notification Center</h4>
                            <span className="text-[11px] text-slate-400">
                              {unreadNotifications.length} unread · {followedClubIds.length} clubs followed
                            </span>
                          </div>
                          {unreadNotifications.length > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                              No notifications yet. Follow clubs or check back for new events.
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleOpenNotificationItem(item)}
                                className={`w-full text-left px-4 py-3 hover:bg-slate-800/70 transition-colors flex items-start gap-2.5 ${
                                  item.isRead ? 'opacity-75' : 'bg-indigo-950/20'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    item.isRead ? 'bg-slate-600' : 'bg-indigo-400'
                                  }`}
                                />
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span
                                      className={
                                        item.kind === 'reminder'
                                          ? 'text-amber-300 font-semibold'
                                          : item.kind === 'announcement'
                                          ? 'text-purple-300 font-semibold'
                                          : 'text-emerald-300 font-semibold'
                                      }
                                    >
                                      {item.kind === 'reminder'
                                        ? '30m Reminder'
                                        : item.kind === 'announcement'
                                        ? 'Announcement'
                                        : 'New Event'}{' '}
                                      · {item.clubName}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatDateTimeDisplay(item.timestamp)}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setNotifMenuOpen(false);
                              setActiveTab('notifications');
                            }}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                          >
                            Open Full Notification Center →
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotifMenuOpen(false)}
                            className="text-[11px] text-slate-400 hover:text-white"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-950"
                  >
                    Browse Events
                  </button>
                </div>
              </div>

              {/* Statistics strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Upcoming Events</span>
                    <span className="text-2xl font-bold text-white font-mono">{events.length}</span>
                  </div>
                  <Calendar className="w-8 h-8 text-indigo-400/80" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Technical Clubs</span>
                    <span className="text-2xl font-bold text-white font-mono">{clubs.length}</span>
                  </div>
                  <Building2 className="w-8 h-8 text-emerald-400/80" />
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Latest Circulars</span>
                    <span className="text-2xl font-bold text-white font-mono">{announcements.length}</span>
                  </div>
                  <Megaphone className="w-8 h-8 text-purple-400/80" />
                </div>
              </div>

              {/* Featured Event: VIBE-A-THON */}
              {featuredEvent && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Featured Buildathon
                  </h3>
                  <VibeAThonHero
                    event={featuredEvent}
                    onOpenDetails={onOpenDetails}
                    onOpenAnnouncement={() => setActiveTab('announcements')}
                  />
                </div>
              )}

              {/* Upcoming Event Cards Strip */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Upcoming Campus Events
                  </h3>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.slice(0, 2).map((evt) => (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      onOpenDetails={onOpenDetails}
                      isBookmarked={bookmarkedEventIds.includes(evt.id)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              </div>

              {/* Latest Announcements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Announcements
                  </h3>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    All Notices →
                  </button>
                </div>

                <div className="space-y-4">
                  {announcements.slice(0, 2).map((ann) => (
                    <AnnouncementCard key={ann.id} announcement={ann} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UPCOMING / ALL EVENTS TAB */}
          {(activeTab === 'upcoming' || activeTab === 'events') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Campus Events Directory
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Explore competitions, workshops, seminars, and hackathons
                </p>
              </div>

              {/* Filters */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={clubFilter}
                    onChange={(e) => setClubFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Clubs</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as 'upcoming' | 'all')}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="all">All Events (Including Past)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setBookmarkedOnlyFilter((prev) => !prev)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      bookmarkedOnlyFilter
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmarked Only ({bookmarkedEventIds.length})</span>
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search by event name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Grid */}
              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
                  No events found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((evt) => (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      onOpenDetails={onOpenDetails}
                      isBookmarked={bookmarkedEventIds.includes(evt.id)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CLUBS DIRECTORY TAB */}
          {activeTab === 'clubs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Student Clubs Directory ({clubs.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Browse all official IIT Dharwad student technical, cultural, and sports organizations
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    placeholder="Search clubs by name or domain..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Domain Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'ALL', label: `All Clubs (${clubs.length})` },
                  { id: 'Technical', label: `Technical (${clubs.filter(c => c.domain === 'Technical').length})` },
                  { id: 'Cultural', label: `Cultural (${clubs.filter(c => c.domain === 'Cultural').length})` },
                  { id: 'Sports', label: `Sports (${clubs.filter(c => c.domain === 'Sports').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setClubDomainFilter(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      clubDomainFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredClubs.map((club) => {
                  const eventCount = events.filter((e) => e.club_id === club.id).length;
                  return (
                    <ClubCard
                      key={club.id}
                      club={club}
                      eventCount={eventCount}
                      onSelect={onSelectClub}
                      isFollowing={followedClubIds.includes(club.id)}
                      onToggleFollow={handleToggleFollow}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Campus Announcements Feed
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological verified notifications and circulars (Read-only)
                  </p>
                </div>

                <select
                  value={announcementClubFilter}
                  onChange={(e) => setAnnouncementClubFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Announcements</option>
                  <option value="CAMPUS_WIDE">Campus-wide Circulars</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {filteredAnnouncements.map((ann) => (
                  <AnnouncementCard key={ann.id} announcement={ann} />
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATION CENTER TAB */}
          {activeTab === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              clubs={clubs}
              followedClubIds={followedClubIds}
              onToggleFollow={handleToggleFollow}
              onMarkRead={handleMarkNotificationsRead}
              onMarkAllRead={handleMarkAllRead}
              onOpenEvent={onOpenDetails}
              onOpenAnnouncementsTab={(clubId) => {
                setAnnouncementClubFilter(clubId || 'ALL');
                setActiveTab('announcements');
              }}
              userEmail={user?.email}
              bookmarkedEvents={bookmarkedEvents}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* MY ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  My Institute Account
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified institutional student profile details
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Institutional Email</span>
                    <span className="font-mono font-semibold text-slate-200">{user?.email}</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Full Name</span>
                    <span className="font-semibold text-slate-200">{user?.fullName || 'Registered Student'}</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Portal Role</span>
                    <span className="capitalize font-semibold text-indigo-400">
                      {user?.role === 'super_admin' ? 'Super Administrator' : user?.role === 'club_admin' ? 'Club Administrator' : 'Normal Student User'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Account Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>Active & Verified</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Database Authentication</span>
                    <span className="text-slate-300 font-mono">Supabase Session</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
