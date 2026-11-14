import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink, ArrowRight, Bookmark } from 'lucide-react';
import { EventItem } from '../../types';
import { formatCalendarDate } from '../../lib/dateValidation';

interface EventCardProps {
  event: EventItem;
  onOpenDetails: (event: EventItem) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onOpenDetails,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  // Check registration status
  const isRegistrationClosed = (() => {
    if (event.id === 'e1111111-1111-4111-b111-111111111111') return true; // VIBE-A-THON reg closed 9 Nov
    if (!event.registration_deadline) return false;
    const deadlineMs = new Date(event.registration_deadline).getTime();
    if (isNaN(deadlineMs)) return false;
    return deadlineMs < Math.max(Date.now(), new Date('2026-11-12T04:00:00Z').getTime());
  })();

  const formatDate = (dateStr: string) => formatCalendarDate(dateStr, 'short');

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col group">
      {/* Event Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={event.poster_url || '/images/iitdh_campus_hero_1794484938737.jpg'}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        {/* Category metadata */}
        <div className="absolute top-3 left-3 text-[11px] font-medium text-slate-200 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/70">
          {event.category}
        </div>

        {event.status === 'Draft' ? (
          <div className="absolute top-3 right-3 text-[11px] font-semibold text-amber-300 bg-amber-950/90 border border-amber-800 px-2 py-0.5 rounded">
            Draft
          </div>
        ) : onToggleBookmark ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(event.id);
            }}
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg border text-[11px] font-semibold backdrop-blur-md transition-colors flex items-center gap-1 ${
              isBookmarked
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/70'
            }`}
            title={
              isBookmarked
                ? 'Bookmarked (30-min push reminder active). Click to remove.'
                : 'Bookmark event for a 30-min browser push reminder'
            }
            aria-label={isBookmarked ? 'Remove event bookmark' : 'Bookmark event'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Unboxed metadata: Club name & date */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-indigo-400">
              {event.club?.name || 'Technical Club'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(event.event_date)}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-indigo-300 transition-colors">
            {event.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.short_description || event.description}
          </p>
        </div>

        {/* Date, Time & Venue strip */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{formatDate(event.event_date)} {event.start_time ? `at ${event.start_time.slice(0, 5)}` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue || 'To be announced'}</span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenDetails(event)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {isRegistrationClosed ? (
            <span 
              className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60"
              title="Registration period has ended"
            >
              Registration Closed
            </span>
          ) : event.registration_url ? (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Register</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-400">No registration link</span>
          )}
        </div>
      </div>
    </div>
  );
};
