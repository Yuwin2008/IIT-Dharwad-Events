import React from 'react';
import { Mail, Calendar, ArrowRight, Check, Plus } from 'lucide-react';
import { Club } from '../../types';

interface ClubCardProps {
  club: Club;
  eventCount?: number;
  onSelect: (club: Club) => void;
  isFollowing?: boolean;
  onToggleFollow?: (clubId: string) => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({
  club,
  eventCount = 0,
  onSelect,
  isFollowing = false,
  onToggleFollow,
}) => {
  return (
    <div 
      onClick={() => onSelect(club)}
      className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between group cursor-pointer hover:bg-slate-900/90"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 overflow-hidden shrink-0 group-hover:border-indigo-500/40 transition-colors">
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-sm">
                {club.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-medium block">
              {club.domain || 'Technical'}
            </span>
            <span className="text-[11px] text-indigo-400 font-medium flex items-center justify-end gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{eventCount} {eventCount === 1 ? 'event' : 'events'}</span>
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            {club.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
            {club.description}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
        <a
          href={`mailto:${club.email}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 truncate max-w-[160px]"
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{club.email}</span>
        </a>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleFollow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(club.id);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                isFollowing
                  ? 'bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}

          <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
