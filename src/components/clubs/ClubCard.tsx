import React from 'react';
import { Mail, Calendar, ArrowRight } from 'lucide-react';
import { Club } from '../../types';

interface ClubCardProps {
  club: Club;
  eventCount?: number;
  onSelect: (club: Club) => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, eventCount = 0, onSelect }) => {
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

      <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <a
          href={`mailto:${club.email}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 truncate max-w-[180px]"
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{club.email}</span>
        </a>

        <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
