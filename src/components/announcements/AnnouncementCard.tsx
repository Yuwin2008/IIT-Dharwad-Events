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
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return dateStr || 'Recent';
      return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr || 'Recent';
    }
  };

  const toSafeHref = (rawUrl?: string): string | undefined => {
    const trimmed = rawUrl?.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
    return `https://${trimmed}`;
  };

  const safeExternalUrl = toSafeHref(announcement.external_url);
  const safeAttachmentUrl = toSafeHref(announcement.attachment_url);

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
      {(safeExternalUrl || safeAttachmentUrl) && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          {safeExternalUrl && (
            <a
              href={safeExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Link / Submission</span>
            </a>
          )}

          {safeAttachmentUrl && (
            <a
              href={safeAttachmentUrl}
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
