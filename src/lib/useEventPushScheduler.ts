import { useEffect } from 'react';
import { dataStore, useDataStoreVersion } from './dataStore';
import {
  REMINDER_LEAD_MS,
  getBrowserPushPermission,
  getEventStartTimestamp,
  hasReminderFired,
  markReminderFired,
  registerPushServiceWorker,
  sendBrowserPushNotification,
} from './pushNotifications';

/**
 * Automatically schedules and dispatches browser push notifications (plus Notification Center
 * reminders) 30 minutes before any bookmarked event starts for the signed-in user.
 */
export function useEventPushScheduler(userEmail?: string) {
  const version = useDataStoreVersion();

  useEffect(() => {
    if (!userEmail) return;

    if (getBrowserPushPermission() === 'granted') {
      void registerPushServiceWorker();
    }

    let nextTimer: ReturnType<typeof setTimeout> | null = null;

    const evaluateReminders = () => {
      if (nextTimer) {
        clearTimeout(nextTimer);
        nextTimer = null;
      }

      const now = Date.now();
      const bookmarkedIds = new Set(dataStore.getBookmarkedEventIds(userEmail));
      if (bookmarkedIds.size === 0) return;

      const publishedEvents = dataStore.getEvents(false);
      let earliestUpcomingDelay: number | null = null;

      for (const evt of publishedEvents) {
        if (!bookmarkedIds.has(evt.id)) continue;
        const startMs = getEventStartTimestamp(evt);
        if (!startMs) continue;

        const reminderAt = startMs - REMINDER_LEAD_MS;

        // Trigger window: within 30 minutes before event start and before start time
        if (now >= reminderAt && now < startMs) {
          if (!hasReminderFired(userEmail, evt.id, startMs)) {
            const minutesLeft = Math.max(1, Math.round((startMs - now) / 60000));
            markReminderFired(userEmail, evt.id, startMs);
            dataStore.recordTriggeredEventReminder(userEmail, evt.id, startMs, minutesLeft);

            const clubName = evt.club?.name || 'IIT Dharwad Club';
            const timeLabel = evt.start_time ? `${evt.start_time.slice(0, 5)} IST` : 'Scheduled start';
            void sendBrowserPushNotification(
              `Starting in ${minutesLeft} min: ${evt.title}`,
              {
                body: `${clubName} · ${evt.venue || 'Campus Venue'} · ${timeLabel}`,
                tag: `event-reminder-${evt.id}-${startMs}`,
                eventId: evt.id,
              }
            );
          }
        } else if (reminderAt > now) {
          const delay = reminderAt - now;
          if (earliestUpcomingDelay === null || delay < earliestUpcomingDelay) {
            earliestUpcomingDelay = delay;
          }
        }
      }

      if (earliestUpcomingDelay !== null) {
        // Schedule exact timer for the next 30-minute boundary (capped at 12h so it re-syncs cleanly)
        const cappedDelay = Math.min(earliestUpcomingDelay + 250, 12 * 60 * 60 * 1000);
        nextTimer = setTimeout(evaluateReminders, cappedDelay);
      }
    };

    evaluateReminders();
    const pollInterval = setInterval(evaluateReminders, 15000);

    return () => {
      if (nextTimer) clearTimeout(nextTimer);
      clearInterval(pollInterval);
    };
  }, [userEmail, version]);
}
