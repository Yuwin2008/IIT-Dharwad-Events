import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../../types';

interface VibeAThonHeroProps {
  event: EventItem;
  onOpenDetails: (event: EventItem) => void;
  onOpenAnnouncement?: () => void;
}

export const VibeAThonHero: React.FC<VibeAThonHeroProps> = ({
  event,
  onOpenDetails,
  onOpenAnnouncement,
}) => {
  // Check registration status: registration closed on 9 Nov 2026
  const isRegistrationClosed = true; // 9 Nov 2026 has passed

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 md:p-8 lg:p-10 shadow-xl shadow-indigo-950/20">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Information */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/70 border border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flagship Featured Buildathon</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 font-medium">Coding Club IIT Dharwad</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            VIBE-A-THON
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {event.short_description}
          </p>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Project Submission Deadline</span>
                <span className="font-semibold text-slate-200">14 November 2026 (23:59 IST)</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Presentation Date</span>
                <span className="font-semibold text-slate-200">To be announced</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Venue</span>
                <span className="font-semibold text-slate-200">To be announced</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Participation Format</span>
                <span className="font-semibold text-slate-200">1 to 4 Members · AI Assisted</span>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <div>
              <strong className="font-semibold text-amber-300">Registration Notice:</strong>
              <span className="ml-1 text-slate-300">
                Official registration closed on <strong>9 November 2026</strong>. Registered teams are currently preparing implementations for the final submission on <strong>14 November 2026</strong>.
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenDetails(event)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-md shadow-indigo-950 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Full Details & Rules</span>
            </button>

            {onOpenAnnouncement && (
              <button
                onClick={onOpenAnnouncement}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
              >
                <span>Read Full Announcement</span>
              </button>
            )}

            {isRegistrationClosed ? (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5"
                title="Registration closed on 9 Nov 2026. Link provided for registered participants to review the form."
              >
                <span>Registration Closed</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </a>
            ) : (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Register Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Visual Poster Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-indigo-500/40 shadow-2xl group">
            <img
              src={event.poster_url || '/images/vibeathon_banner_1794484938286.jpg'}
              alt="VIBE-A-THON Buildathon Poster"
              referrerPolicy="no-referrer"
              className="w-full h-auto aspect-video sm:aspect-square lg:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800">
              <span className="font-semibold text-indigo-300">Organized by Coding Club</span>
              <span className="text-slate-400">Submission: Nov 14</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
