import React from 'react';
import { Megaphone, ExternalLink, Paperclip, Calendar } from 'lucide-react';
import { AnnouncementItem } from '../../types';

interface AnnouncementCardProps {
  announcement: AnnouncementItem;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const isCampusWide = announcement.type === 'Campus-wide Announcement' || !announcement.club_id;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-colors space-y-3">
      {/* Header: Label & Date */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {isCampusWide ? (
            <span className="font-semibold text-purple-400 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Campus-wide Announcement</span>
            </span>
          ) : (
            <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{announcement.club?.name || 'Club Announcement'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formatDate(announcement.published_at || announcement.created_at)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white tracking-tight leading-snug">
        {announcement.title}
      </h3>

      {/* Content */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        {announcement.content}
      </p>

      {/* External Link or Attachment */}
      {(announcement.external_url || announcement.attachment_url) && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          {announcement.external_url && (
            <a
              href={announcement.external_url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Link / Submission</span>
            </a>
          )}

          {announcement.attachment_url && (
            <a
              href={announcement.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>View Attachment</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
};
