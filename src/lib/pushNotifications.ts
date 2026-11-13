import { EventItem } from '../types';
import { sanitizeDateString, sanitizeTimeString } from './dateValidation';

export const REMINDER_LEAD_MS = 30 * 60 * 1000; // 30 minutes before event start
const SENT_REMINDERS_KEY = 'iitdh_portal_sent_event_reminders';
const PUSH_OPT_IN_KEY = 'iitdh_portal_push_opt_in';

export type BrowserPushPermission = NotificationPermission | 'unsupported';

export function isBrowserPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserPushPermission(): BrowserPushPermission {
  if (!isBrowserPushSupported()) return 'unsupported';
  return Notification.permission;
}

export function getPushOptIn(userEmail?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(PUSH_OPT_IN_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    const key = userEmail ? userEmail.trim().toLowerCase() : '__default__';
    return Boolean(map[key]);
  } catch {
    return false;
  }
}

export function setPushOptIn(userEmail: string | undefined, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PUSH_OPT_IN_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const key = userEmail ? userEmail.trim().toLowerCase() : '__default__';
    map[key] = enabled;
    localStorage.setItem(PUSH_OPT_IN_KEY, JSON.stringify(map));
  } catch {}
}

let cachedSwRegistration: ServiceWorkerRegistration | null = null;

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  if (cachedSwRegistration) return cachedSwRegistration;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) {
      cachedSwRegistration = existing;
      return existing;
    }
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    cachedSwRegistration = reg;
    return reg;
  } catch {
    return null;
  }
}

export async function requestBrowserPushPermission(
  userEmail?: string
): Promise<BrowserPushPermission> {
  if (!isBrowserPushSupported()) return 'unsupported';

  await registerPushServiceWorker();

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }

  if (permission === 'granted') {
    setPushOptIn(userEmail, true);
  }
  return permission;
}

/**
 * Computes the local start timestamp (epoch ms) for an event using event_date and optional start_time.
 * Defaults to 09:00:00 local time if start_time is omitted.
 */
export function getEventStartTimestamp(event: EventItem): number | null {
  const cleanDate = sanitizeDateString(event.event_date);
  if (!cleanDate) return null;

  const cleanTime = event.start_time ? sanitizeTimeString(event.start_time) : '09:00:00';
  const [year, month, day] = cleanDate.split('-').map(Number);
  const [hour, minute, second] = (cleanTime || '09:00:00').split(':').map(Number);

  const localDate = new Date(year, month - 1, day, hour, minute, second);
  if (isNaN(localDate.getTime())) return null;
  return localDate.getTime();
}

export function getSentReminderKey(userEmail: string, eventId: string, startMs: number): string {
  return `${userEmail.trim().toLowerCase()}:${eventId}:${startMs}`;
}

function loadSentReminderMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function hasReminderFired(userEmail: string, eventId: string, startMs: number): boolean {
  const map = loadSentReminderMap();
  return Boolean(map[getSentReminderKey(userEmail, eventId, startMs)]);
}

export function markReminderFired(userEmail: string, eventId: string, startMs: number): void {
  if (typeof window === 'undefined') return;
  try {
    const map = loadSentReminderMap();
    map[getSentReminderKey(userEmail, eventId, startMs)] = new Date().toISOString();
    // Keep last 500 reminder entries
    const entries = Object.entries(map).slice(-500);
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

export interface BrowserPushPayload {
  body: string;
  tag?: string;
  eventId?: string;
}

export async function sendBrowserPushNotification(
  title: string,
  payload: BrowserPushPayload
): Promise<boolean> {
  if (!isBrowserPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const targetUrl = payload.eventId ? `/?event=${encodeURIComponent(payload.eventId)}` : '/';
  const options: NotificationOptions = {
    body: payload.body,
    tag: payload.tag || (payload.eventId ? `event-reminder-${payload.eventId}` : 'iitdh-portal'),
    data: { url: targetUrl, eventId: payload.eventId },
  };

  try {
    const reg = await registerPushServiceWorker();
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall back to standard Notification constructor
  }

  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      try {
        window.focus();
        if (payload.eventId) {
          window.dispatchEvent(
            new CustomEvent('iitdh-open-event', { detail: { eventId: payload.eventId } })
          );
        }
      } catch {}
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function formatTimeRemaining(targetMs: number, nowMs: number = Date.now()): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return 'Now';
  const totalMinutes = Math.ceil(diff / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
