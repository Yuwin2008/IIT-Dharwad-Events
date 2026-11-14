import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { dataStore, useDataStoreVersion } from '../lib/dataStore';
import { VibeAThonHero } from '../components/events/VibeAThonHero';
import { EventCard } from '../components/events/EventCard';
import { ClubCard } from '../components/clubs/ClubCard';
import { AnnouncementCard } from '../components/announcements/AnnouncementCard';
import { 
  Calendar, 
  Building2, 
  Megaphone, 
  Search, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
} from '../lib/pushNotifications';
import { EventItem, Club, AnnouncementItem } from '../types';

interface HomeViewProps {
  onNavigate: (route: string) => void;
  onOpenDetails: (event: EventItem) => void;
  onSelectClub: (club: Club) => void;
  onOpenAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenDetails,
  onSelectClub,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  useDataStoreVersion();

  const clubs = dataStore.getClubs();
  const allEvents = dataStore.getEvents(false);
  const announcements = dataStore.getAnnouncements(false);

  const handleToggleBookmark = (eventId: string) => {
    if (!user?.email) {
      onOpenAuth();
      return;
    }
    const wasBookmarked = dataStore.isEventBookmarked(user.email, eventId);
    void dataStore.toggleBookmarkEvent(user.email, eventId);
    if (!wasBookmarked && getBrowserPushPermission() === 'default') {
      void requestBrowserPushPermission(user.email);
    }
  };

  // Featured event is VIBE-A-THON
  const featuredEvent = allEvents.find((e) => e.title.includes('VIBE-A-THON')) || allEvents[0];
  const regularEvents = allEvents.filter((e) => e.id !== featuredEvent?.id);

  // Filters for events
  const [selectedClubFilter, setSelectedClubFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  // Domain filter for clubs directory
  const [selectedClubDomain, setSelectedClubDomain] = useState<'ALL' | 'Technical' | 'Cultural' | 'Sports'>('ALL');

  const filteredClubs = clubs.filter((c) => {
    if (selectedClubDomain !== 'ALL' && c.domain.toLowerCase() !== selectedClubDomain.toLowerCase()) {
      return false;
    }
    return true;
  });

  const filteredEvents = regularEvents.filter((evt) => {
    if (selectedClubFilter !== 'ALL' && evt.club_id !== selectedClubFilter) return false;
    if (selectedCategoryFilter !== 'ALL' && !evt.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase())) return false;
    if (searchEventQuery.trim()) {
      const q = searchEventQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.short_description?.toLowerCase().includes(q) ||
        evt.club?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Indian Institute of Technology Dharwad</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Campus Events & Technical Clubs Portal
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                The centralized gateway for IIT Dharwad technical societies, student competitions, workshops, and verified administrative circulars.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-lg shadow-indigo-950 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>{user ? 'Open Student Dashboard' : 'Student Access / Login'}</span>
                </button>

                <a
                  href="#events-section"
                  className="px-5 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm rounded-lg border border-slate-700/80 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Explore Upcoming Events</span>
                </a>
              </div>

              {/* Institute Quick Facts (Unboxed text) */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800/80">
                <div>
                  <strong className="text-white font-mono text-sm block">{clubs.length}</strong>
                  <span>Active Student Clubs</span>
                </div>
                <span className="text-slate-700">|</span>
                <div>
                  <strong className="text-white font-mono text-sm block">3 Domains</strong>
                  <span>Technical · Cultural · Sports</span>
                </div>
                <span className="text-slate-700">|</span>
                <div>
                  <strong className="text-white font-mono text-sm block">Permanent Campus</strong>
                  <span>Chikkamalligawad</span>
                </div>
              </div>
            </div>

            {/* Right Col: Campus architectural photo */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                  src="/src/assets/images/iitdh_campus_hero_1794484938737.jpg"
                  alt="IIT Dharwad Permanent Campus Building"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-video sm:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-white block">Main Academic Complex</span>
                  <span className="text-[11px] text-slate-400">Indian Institute of Technology Dharwad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section 1: FEATURED EVENT VIBE-A-THON */}
        {featuredEvent && (
          <section id="featured-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                  Spotlight Event
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Featured Hackathon & Buildathon
                </h2>
              </div>
            </div>

            <VibeAThonHero
              event={featuredEvent}
              onOpenDetails={onOpenDetails}
              onOpenAnnouncement={() => onNavigate('/dashboard/announcements')}
            />
          </section>
        )}

        {/* Section 2: UPCOMING EVENTS WITH FILTERS */}
        <section id="events-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                Campus Calendar
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Upcoming Institute Events & Bootcamps
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Filter by technical club or event category to discover hands-on sessions
              </p>
            </div>

            <button
              onClick={() => onNavigate('/dashboard/events')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
            >
              <span>View All Events In Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Filter Strip (Functional tabs and search) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Category Segmented Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'Buildathon', 'Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>

              {/* Club Dropdown Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedClubFilter}
                  onChange={(e) => setSelectedClubFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Clubs</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchEventQuery}
                    onChange={(e) => setSearchEventQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Cards Grid */}
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-slate-400 text-xs">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-medium text-slate-300">No events found matching your filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedClubFilter('ALL');
                  setSelectedCategoryFilter('ALL');
                  setSearchEventQuery('');
                }}
                className="text-indigo-400 hover:underline pt-1 block mx-auto"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  onOpenDetails={onOpenDetails}
                  isBookmarked={user ? dataStore.isEventBookmarked(user.email, evt.id) : false}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 3: STUDENT CLUBS DIRECTORY ACROSS ALL DOMAINS */}
        <section id="clubs-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                Student Bodies
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Official Student Clubs Directory ({clubs.length})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore student organizations across Technical, Cultural, and Sports domains at IIT Dharwad
              </p>
            </div>

            <button
              onClick={() => onNavigate('/dashboard/clubs')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
            >
              <span>Explore All In Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                onClick={() => setSelectedClubDomain(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedClubDomain === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredClubs.map((c) => {
              const eventCount = allEvents.filter((e) => e.club_id === c.id).length;
              return (
                <ClubCard
                  key={c.id}
                  club={c}
                  eventCount={eventCount}
                  onSelect={onSelectClub}
                />
              );
            })}
          </div>
        </section>

        {/* Section 4: RECENT CAMPUS ANNOUNCEMENTS */}
        <section id="announcements-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                Notice Board
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Recent Announcements & Circulars
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verified administrative and club notifications for all IIT Dharwad students
              </p>
            </div>

            <button
              onClick={() => onNavigate('/dashboard/announcements')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
            >
              <span>View Full Notice Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No announcements published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((ann) => (
                <AnnouncementCard key={ann.id} announcement={ann} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
