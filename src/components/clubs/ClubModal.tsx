import React from 'react';
import { X, Mail, Globe, Calendar, Megaphone, ArrowRight } from 'lucide-react';
import { Club, EventItem, AnnouncementItem } from '../../types';

interface ClubModalProps {
  club: Club | null;
  events: EventItem[];
  announcements: AnnouncementItem[];
  onClose: () => void;
  onSelectEvent: (event: EventItem) => void;
}

export const ClubModal: React.FC<ClubModalProps> = ({
  club,
  events,
  announcements,
  onClose,
  onSelectEvent,
}) => {
  if (!club) return null;

  const clubEvents = events.filter((e) => e.club_id === club.id);
  const clubAnnouncements = announcements.filter((a) => a.club_id === club.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 p-1 shrink-0 overflow-hidden">
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-300 font-bold">
                  {club.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                {club.domain || 'Technical Domain'}
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {club.name}
              </h2>
              <a
                href={`mailto:${club.email}`}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 mt-0.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{club.email}</span>
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              About Club
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {club.description}
            </p>
          </div>

          {/* Club Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Organized Events ({clubEvents.length})</span>
              </h4>
            </div>

            {clubEvents.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No events scheduled currently for this club.
              </div>
            ) : (
              <div className="space-y-2">
                {clubEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      onClose();
                      onSelectEvent(evt);
                    }}
                    className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white hover:text-indigo-300">
                        {evt.title}
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Date: {evt.event_date} · Venue: {evt.venue}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Club Announcements */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Megaphone className="w-4 h-4 text-indigo-400" />
              <span>Club Announcements ({clubAnnouncements.length})</span>
            </h4>

            {clubAnnouncements.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No recent announcements from this club.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clubAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{ann.title}</span>
                      <span>{new Date(ann.published_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ann.content}
                    </p>
                    {ann.external_url && (
                      <a
                        href={ann.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        <span>Official Link</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
