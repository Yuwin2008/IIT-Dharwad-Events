import { EventItem } from '../types';
import { sanitizeDateString, sanitizeTimeString } from './dateValidation';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatUtcCompact(date: Date): string {
  return (
    String(date.getUTCFullYear()).padStart(4, '0') +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

function formatDateCompact(year: number, month: number, day: number): string {
  return String(year).padStart(4, '0') + pad2(month) + pad2(day);
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function buildEventDescription(event: EventItem): string {
  const parts: string[] = [];
  if (event.club?.name) {
    parts.push(`Organized by: ${event.club.name}`);
  }
  if (event.category) {
    parts.push(`Category: ${event.category}`);
  }
  const body = (event.description || event.short_description || '').trim();
  if (body) {
    parts.push(body);
  }
  if (event.registration_url) {
    parts.push(`Registration Link: ${event.registration_url}`);
  }
  return parts.join('\n\n');
}

function resolveCalendarBounds(event: EventItem):
  | { allDay: true; startDateCompact: string; endDateCompact: string }
  | { allDay: false; startUtc: Date; endUtc: Date }
  | null {
  const cleanDate = sanitizeDateString(event.event_date);
  if (!cleanDate) return null;

  const [year, month, day] = cleanDate.split('-').map(Number);
  const cleanStart = event.start_time ? sanitizeTimeString(event.start_time) : null;

  if (!cleanStart) {
    const startUtcDay = new Date(Date.UTC(year, month - 1, day));
    const nextUtcDay = new Date(Date.UTC(year, month - 1, day + 1));
    return {
      allDay: true,
      startDateCompact: formatDateCompact(
        startUtcDay.getUTCFullYear(),
        startUtcDay.getUTCMonth() + 1,
        startUtcDay.getUTCDate()
      ),
      endDateCompact: formatDateCompact(
        nextUtcDay.getUTCFullYear(),
        nextUtcDay.getUTCMonth() + 1,
        nextUtcDay.getUTCDate()
      ),
    };
  }

  const [sh, sm, ss] = cleanStart.split(':').map(Number);
  const startUtcMs = Date.UTC(year, month - 1, day, sh, sm, ss) - IST_OFFSET_MS;
  const startUtc = new Date(startUtcMs);

  const cleanEnd = event.end_time ? sanitizeTimeString(event.end_time) : null;
  let endUtc: Date;
  if (cleanEnd && cleanEnd > cleanStart) {
    const [eh, em, es] = cleanEnd.split(':').map(Number);
    endUtc = new Date(Date.UTC(year, month - 1, day, eh, em, es) - IST_OFFSET_MS);
  } else {
    endUtc = new Date(startUtcMs + 60 * 60 * 1000);
  }

  return {
    allDay: false,
    startUtc,
    endUtc,
  };
}

export function buildGoogleCalendarUrl(event: EventItem): string | null {
  const bounds = resolveCalendarBounds(event);
  if (!bounds) return null;

  const datesParam = bounds.allDay
    ? `${bounds.startDateCompact}/${bounds.endDateCompact}`
    : `${formatUtcCompact(bounds.startUtc)}/${formatUtcCompact(bounds.endUtc)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: datesParam,
    details: buildEventDescription(event),
    location: event.venue || 'IIT Dharwad Campus',
    ctz: 'Asia/Kolkata',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: EventItem, shareUrl?: string): string | null {
  const bounds = resolveCalendarBounds(event);
  if (!bounds) return null;

  const dtStamp = formatUtcCompact(new Date());
  const uid = `${event.id || Date.now()}@iitdh.ac.in`;
  const summary = escapeIcsText(event.title);
  const location = escapeIcsText(event.venue || 'IIT Dharwad Campus');
  const description = escapeIcsText(buildEventDescription(event));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IIT Dharwad//Campus Events Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    bounds.allDay
      ? `DTSTART;VALUE=DATE:${bounds.startDateCompact}`
      : `DTSTART:${formatUtcCompact(bounds.startUtc)}`,
    bounds.allDay
      ? `DTEND;VALUE=DATE:${bounds.endDateCompact}`
      : `DTEND:${formatUtcCompact(bounds.endUtc)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
  ];

  const eventUrl = event.registration_url || shareUrl;
  if (eventUrl) {
    lines.push(`URL:${eventUrl}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function getIcsFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'iitdh-event'}.ics`;
}
