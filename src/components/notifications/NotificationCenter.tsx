import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Megaphone,
  CheckCheck,
  Check,
  Building2,
  ExternalLink,
  Search,
  Plus,
  Sparkles,
  Bookmark,
  CheckCircle2,
  ShieldAlert,
  Send,
  Trash2,
  Clock,
} from 'lucide-react';
import { Club, EventItem, PortalNotification } from '../../types';
import { formatCalendarDate, formatDateTimeDisplay } from '../../lib/dateValidation';
import {
  REMINDER_LEAD_MS,
  BrowserPushPermission,
  formatTimeRemaining,
  getBrowserPushPermission,
  getEventStartTimestamp,
  hasReminderFired,
  requestBrowserPushPermission,
  sendBrowserPushNotification,
} from '../../lib/pushNotifications';

interface NotificationCenterProps {
  notifications: PortalNotification[];
  clubs: Club[];
  followedClubIds: string[];
  onToggleFollow: (clubId: string) => void;
  onMarkRead: (ids: string[]) => void;
  onMarkAllRead: () => void;
  onOpenEvent: (event: EventItem) => void;
  onOpenAnnouncementsTab: (clubId?: string | null) => void;
  userEmail?: string;
  bookmarkedEvents?: EventItem[];
  onToggleBookmark?: (eventId: string) => void;
}

type NotificationFilter = 'all' | 'unread' | 'reminder' | 'announcement' | 'event';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  clubs,
  followedClubIds,
  onToggleFollow,
  onMarkRead,
  onMarkAllRead,
  onOpenEvent,
  onOpenAnnouncementsTab,
  userEmail,
  bookmarkedEvents = [],
  onToggleBookmark,
}) => {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [clubSearch, setClubSearch] = useState('');
  const [pushPermission, setPushPermission] = useState<BrowserPushPermission>(() =>
    getBrowserPushPermission()
  );
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const reminderCount = notifications.filter((n) => n.kind === 'reminder').length;
  const announcementCount = notifications.filter((n) => n.kind === 'announcement').length;
  const eventCount = notifications.filter((n) => n.kind === 'event').length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread' && item.isRead) return false;
    if (filter === 'reminder' && item.kind !== 'reminder') return false;
    if (filter === 'announcement' && item.kind !== 'announcement') return false;
    if (filter === 'event' && item.kind !== 'event') return false;
    return true;
  });

  const filteredClubs = clubs.filter((c) => {
    if (!clubSearch.trim()) return true;
    const q = clubSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q);
  });

  const handleNotificationClick = (item: PortalNotification) => {
    if (!item.isRead) {
      onMarkRead([item.id]);
    }
    if ((item.kind === 'event' || item.kind === 'reminder') && item.event) {
      onOpenEvent(item.event);
    } else if (item.kind === 'announcement') {
      onOpenAnnouncementsTab(item.clubId);
    }
  };

  const handleEnableBrowserPush = async () => {
    setPushFeedback(null);
    const perm = await requestBrowserPushPermission(userEmail);
    setPushPermission(perm);
    if (perm === 'granted') {
      setPushFeedback('Browser push notifications enabled. Alerts will trigger automatically 30 minutes before bookmarked events.');
    } else if (perm === 'denied') {
      setPushFeedback('Browser notification permission is blocked. Allow notifications for this site in your browser settings.');
    } else if (perm === 'unsupported') {
      setPushFeedback('This browser environment does not support Web Notifications.');
    } else {
      setPushFeedback('Notification permission prompt was dismissed.');
    }
  };

  const handleSendTestAlert = async () => {
    setPushFeedback(null);
    let currentPerm = getBrowserPushPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestBrowserPushPermission(userEmail);
      setPushPermission(currentPerm);
    }
    if (currentPerm !== 'granted') {
      setPushFeedback(
        currentPerm === 'denied'
          ? 'Notifications are blocked in your browser settings. Unblock them to receive push alerts.'
          : 'Enable browser notifications first to preview a push alert.'
      );
      return;
    }

    const sampleEvent = bookmarkedEvents[0];
    const sent = await sendBrowserPushNotification(
      sampleEvent ? `Reminder Preview: ${sampleEvent.title}` : 'IIT Dharwad Event Reminder Preview',
      {
        body: sampleEvent
          ? `${sampleEvent.club?.name || 'Campus Club'} · Starts 30m after reminder trigger at ${sampleEvent.venue}`
          : 'You will automatically receive a push notification 30 minutes before any bookmarked event starts.',
        tag: `iitdh-test-push-${Date.now()}`,
        eventId: sampleEvent?.id,
      }
    );
    setPushFeedback(
      sent
        ? 'Test push notification dispatched to your browser.'
        : 'Could not dispatch browser notification in this preview window.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-400" />
            <span>Notification Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time alerts for all campus events, official circulars, and club announcements
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Unread Alerts</span>
            <span className="text-2xl font-bold text-white font-mono">{unreadCount}</span>
          </div>
          <Bell className="w-7 h-7 text-indigo-400/80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Published Circulars</span>
            <span className="text-2xl font-bold text-white font-mono">{announcementCount}</span>
          </div>
          <Megaphone className="w-7 h-7 text-purple-400/80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">New Events Added</span>
            <span className="text-2xl font-bold text-white font-mono">{eventCount}</span>
          </div>
          <Calendar className="w-7 h-7 text-emerald-400/80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notifications Feed */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'reminder', label: `30m Reminders (${reminderCount})` },
              { id: 'announcement', label: `Announcements (${announcementCount})` },
              { id: 'event', label: `New Events (${eventCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as NotificationFilter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {followedClubIds.length === 0 && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl flex items-start gap-3 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Follow clubs to highlight their updates</p>
                <p className="text-indigo-200/80 mt-0.5">
                  You receive alerts for all campus events, official circulars, and club announcements. Follow clubs on the right to tag their updates as Following.
                </p>
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No notifications in this view</p>
              <p className="text-xs text-slate-500">
                {filter === 'unread'
                  ? 'You are all caught up!'
                  : 'New events and announcements from followed clubs will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
                const isAnnouncement = item.kind === 'announcement';
                const isReminder = item.kind === 'reminder';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      item.isRead
                        ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        : isReminder
                        ? 'bg-slate-900 border-amber-500/50 shadow-md shadow-amber-950/20 hover:border-amber-400/70'
                        : 'bg-slate-900 border-indigo-500/40 shadow-md shadow-indigo-950/30 hover:border-indigo-400/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            isReminder
                              ? 'bg-amber-950/60 border-amber-700/50 text-amber-300'
                              : isAnnouncement
                              ? 'bg-purple-950/60 border-purple-700/40 text-purple-300'
                              : 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300'
                          }`}
                        >
                          {isReminder ? (
                            <BellRing className="w-4 h-4" />
                          ) : isAnnouncement ? (
                            <Megaphone className="w-4 h-4" />
                          ) : (
                            <Calendar className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {!item.isRead && (
                              <span
                                className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"
                                title="Unread"
                              />
                            )}
                            <span
                              className={`font-semibold ${
                                isReminder
                                  ? 'text-amber-300'
                                  : isAnnouncement
                                  ? 'text-purple-300'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {isReminder
                                ? '30-Min Event Reminder'
                                : isAnnouncement
                                ? 'New Announcement'
                                : 'New Event Added'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-200 font-medium">{item.clubName}</span>
                            {item.isFollowedClub && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 font-semibold">
                                Following
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                            <span>Posted {formatDateTimeDisplay(item.timestamp)}</span>
                            {item.event && (
                              <span className="text-slate-400">
                                Event Date: {formatCalendarDate(item.event.event_date, 'short')} · {item.event.venue}
                              </span>
                            )}
                            {item.announcement?.external_url && (
                              <a
                                href={item.announcement.external_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                              >
                                <span>Circular Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead([item.id]);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-800/60 border border-indigo-700/50 rounded-md shrink-0 flex items-center gap-1 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                          <span>Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Browser Push Alerts & Followed Clubs */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Browser Push Alerts (30m Before Bookmarked Events) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-indigo-400" />
                  <span>Browser Push Alerts</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automated browser alerts trigger 30 minutes before any bookmarked event starts.
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 flex items-center gap-1 ${
                  pushPermission === 'granted'
                    ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                    : pushPermission === 'denied'
                    ? 'bg-rose-950/60 border-rose-700/50 text-rose-300'
                    : 'bg-amber-950/60 border-amber-700/50 text-amber-300'
                }`}
              >
                {pushPermission === 'granted' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Enabled</span>
                  </>
                ) : pushPermission === 'denied' ? (
                  <>
                    <ShieldAlert className="w-3 h-3" />
                    <span>Blocked</span>
                  </>
                ) : pushPermission === 'unsupported' ? (
                  <span>Unsupported</span>
                ) : (
                  <span>Needs Permission</span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={() => void handleEnableBrowserPush()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Enable Browser Push</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSendTestAlert()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Send Test Alert</span>
              </button>
            </div>

            {pushFeedback && (
              <p className="text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 rounded-lg px-2.5 py-2">
                {pushFeedback}
              </p>
            )}

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bookmarked Events ({bookmarkedEvents.length})</span>
                </span>
              </div>

              {bookmarkedEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  Bookmark any event card or modal to schedule a 30-minute pre-start browser push reminder.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {bookmarkedEvents.map((evt) => {
                    const startMs = getEventStartTimestamp(evt);
                    const nowMs = Date.now();
                    const reminderMs = startMs ? startMs - REMINDER_LEAD_MS : null;
                    const fired =
                      userEmail && startMs ? hasReminderFired(userEmail, evt.id, startMs) : false;

                    let statusLabel = 'Unscheduled';
                    let statusClass = 'text-slate-400 bg-slate-800 border-slate-700';
                    if (startMs && reminderMs) {
                      if (fired) {
                        statusLabel = 'Alert Sent';
                        statusClass = 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50';
                      } else if (nowMs >= startMs) {
                        statusLabel = 'Started';
                        statusClass = 'text-slate-400 bg-slate-800 border-slate-700';
                      } else if (nowMs >= reminderMs) {
                        statusLabel = 'Within 30m Window';
                        statusClass = 'text-amber-300 bg-amber-950/60 border-amber-700/50';
                      } else {
                        statusLabel = `Alert in ${formatTimeRemaining(reminderMs, nowMs)}`;
                        statusClass = 'text-indigo-300 bg-indigo-950/60 border-indigo-700/50';
                      }
                    }

                    return (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenEvent(evt)}
                            className="text-left text-xs font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-1"
                          >
                            {evt.title}
                          </button>
                          {onToggleBookmark && (
                            <button
                              type="button"
                              onClick={() => onToggleBookmark(evt.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                              title="Remove bookmark & reminder"
                              aria-label={`Remove bookmark for ${evt.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>
                              {formatCalendarDate(evt.event_date, 'short')}
                              {evt.start_time ? ` · ${evt.start_time.slice(0, 5)} IST` : ''}
                            </span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border font-semibold ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Followed Clubs Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Clubs You Follow ({followedClubIds.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Toggle clubs below to receive announcement notifications from them.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                placeholder="Filter clubs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
              {filteredClubs.map((club) => {
                const following = followedClubIds.includes(club.id);
                return (
                  <div
                    key={club.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                      following
                        ? 'bg-indigo-950/40 border-indigo-700/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">{club.name}</span>
                      <span className="text-[10px] text-slate-400">{club.domain}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFollow(club.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 flex items-center gap-1 transition-colors ${
                        following
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {following ? (
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
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
