import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ExternalLink,
  AlertCircle,
  Share2,
  Check,
  CalendarPlus,
  Download,
  Bookmark,
  BellRing,
} from 'lucide-react';
import { EventItem } from '../../types';
import { formatCalendarDate, formatDateTimeDisplay } from '../../lib/dateValidation';
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  getIcsFilename,
} from '../../lib/calendarExport';

interface EventModalProps {
  event: EventItem | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [icsDownloaded, setIcsDownloaded] = useState(false);

  if (!event) return null;

  const isRegistrationClosed = (() => {
    if (event.id === 'e1111111-1111-4111-b111-111111111111') return true;
    if (!event.registration_deadline) return false;
    const deadlineMs = new Date(event.registration_deadline).getTime();
    if (isNaN(deadlineMs)) return false;
    return deadlineMs < new Date('2026-11-12T04:00:00Z').getTime();
  })();

  const formatDate = (dateStr: string) => formatCalendarDate(dateStr, 'long');

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}?event=${event.id}` : undefined;
  const googleCalendarUrl = buildGoogleCalendarUrl(event);

  const handleCopyShare = () => {
    if (shareUrl) {
      navigator.clipboard?.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    const ics = buildIcsContent(event, shareUrl);
    if (!ics) return;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getIcsFilename(event.title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIcsDownloaded(true);
    setTimeout(() => setIcsDownloaded(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poster Header */}
        <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-slate-950">
          <img
            src={event.poster_url || '/src/assets/images/iitdh_campus_hero_1794484938737.jpg'}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/75 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white p-2 rounded-full border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
              {event.club?.name || 'IIT Dharwad Club'} · {event.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Event Date</span>
                <span className="font-semibold text-slate-200">{formatDate(event.event_date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Timing</span>
                <span className="font-semibold text-slate-200">
                  {event.start_time ? `${event.start_time.slice(0, 5)} IST` : 'To be announced'}
                  {event.end_time ? ` to ${event.end_time.slice(0, 5)} IST` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Venue</span>
                <span className="font-semibold text-slate-200">{event.venue || 'To be announced'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Organizing Contact</span>
                <a
                  href={`mailto:${event.club?.email || 'events@iitdh.ac.in'}`}
                  className="font-semibold text-indigo-400 hover:underline truncate block"
                >
                  {event.club?.email || 'events@iitdh.ac.in'}
                </a>
              </div>
            </div>
          </div>

          {/* Bookmark & Export to Calendar Bar */}
          {(googleCalendarUrl || onToggleBookmark) && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Calendar & 30-minute push reminder</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(event.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      isBookmarked
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isBookmarked ? (
                      <>
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Bookmarked (30m Alert On)</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Bookmark & Remind</span>
                      </>
                    )}
                  </button>
                )}
                {googleCalendarUrl && (
                  <>
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-950/60 hover:bg-indigo-600/80 border border-indigo-700/50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Google Calendar</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                    <button
                      type="button"
                      onClick={handleDownloadIcs}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {icsDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">ICS Downloaded</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .ICS</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Registration Status Banner */}
          {isRegistrationClosed ? (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-semibold block">Registration Closed</strong>
                <span>
                  The official registration window for this event is closed. If you have already registered, keep track of your email and submissions.
                </span>
              </div>
            </div>
          ) : event.registration_deadline ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 font-semibold block">Registration Open</strong>
                <span>
                  Closes on: {formatDateTimeDisplay(event.registration_deadline)}
                </span>
              </div>
            </div>
          ) : null}

          {/* Description Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Event Overview & Details
            </h4>
            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-3 font-normal">
              {event.description || event.short_description}
            </div>
          </div>

          {/* Organizing Club Details */}
          {event.club && (
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                About the Organizing Club
              </span>
              <h5 className="text-sm font-bold text-white">{event.club.name}</h5>
              <p className="text-xs text-slate-400">{event.club.description}</p>
              <div className="pt-1">
                <a
                  href={`mailto:${event.club.email}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{event.club.email}</span>
                </a>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopyShare}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share Event'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>

              {isRegistrationClosed ? (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Form link for registered participants"
                >
                  <span>Registration Closed (View Form)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : event.registration_url ? (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <span>Register Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
