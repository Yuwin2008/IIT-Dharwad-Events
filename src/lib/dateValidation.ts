export interface EventDateInput {
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  registration_deadline?: string | null;
}

export interface SanitizedEventDates {
  event_date: string;
  start_time?: string;
  end_time?: string;
  registration_deadline?: string | null;
}

export type EventDateValidationResult =
  | { valid: true; sanitized: SanitizedEventDates }
  | { valid: false; error: string };

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/**
 * Normalizes a date string to strict YYYY-MM-DD if valid, or returns null.
 * Supports YYYY-MM-DD, ISO timestamps starting with YYYY-MM-DD, and DD-MM-YYYY / DD/MM/YYYY.
 */
export function sanitizeDateString(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match YYYY-MM-DD (or prefix of ISO timestamp)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidCalendarDate(year, month, day)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (!isValidCalendarDate(year, month, day)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normalizes a time string (HH:MM or HH:MM:SS) to strict HH:MM:SS, or returns null if invalid.
 */
export function sanitizeTimeString(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Combines a validated YYYY-MM-DD date string and optional HH:MM(:SS) time string into a UTC ISO-8601 string.
 */
export function combineDateAndTimeToIso(dateStr?: string | null, timeStr?: string | null): string | null {
  const cleanDate = sanitizeDateString(dateStr);
  if (!cleanDate) return null;

  const cleanTime = timeStr && timeStr.trim() ? sanitizeTimeString(timeStr) : '23:59:00';
  if (!cleanTime) return null;

  const [year, month, day] = cleanDate.split('-').map(Number);
  const [hour, minute, second] = cleanTime.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, second);

  if (isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
}

/**
 * Validates and normalizes an ISO-8601 / timestamp deadline string.
 */
export function sanitizeDeadlineIso(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check if plain date was passed
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
    return combineDateAndTimeToIso(trimmed, '23:59:00');
  }

  // Must start with valid calendar YYYY-MM-DD
  const prefixMatch = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i.exec(trimmed);
  if (!prefixMatch) return null;

  const year = Number(prefixMatch[1]);
  const month = Number(prefixMatch[2]);
  const day = Number(prefixMatch[3]);
  const hour = Number(prefixMatch[4]);
  const minute = Number(prefixMatch[5]);
  const second = prefixMatch[6] !== undefined ? Number(prefixMatch[6]) : 0;

  if (!isValidCalendarDate(year, month, day)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/**
 * Full validation + sanitization of all event date/time fields before database submission.
 */
export function validateAndSanitizeEventDates(input: EventDateInput): EventDateValidationResult {
  const cleanEventDate = sanitizeDateString(input.event_date);
  if (!cleanEventDate) {
    return {
      valid: false,
      error: 'Please enter a valid Event Date (YYYY-MM-DD).',
    };
  }

  let cleanStartTime: string | undefined;
  if (input.start_time && input.start_time.trim()) {
    const parsedStart = sanitizeTimeString(input.start_time);
    if (!parsedStart) {
      return {
        valid: false,
        error: 'Please enter a valid Start Time (HH:MM).',
      };
    }
    cleanStartTime = parsedStart;
  }

  let cleanEndTime: string | undefined;
  if (input.end_time && input.end_time.trim()) {
    const parsedEnd = sanitizeTimeString(input.end_time);
    if (!parsedEnd) {
      return {
        valid: false,
        error: 'Please enter a valid End Time (HH:MM).',
      };
    }
    cleanEndTime = parsedEnd;
  }

  if (cleanStartTime && cleanEndTime && cleanEndTime <= cleanStartTime) {
    return {
      valid: false,
      error: 'Event End Time must be later than Start Time.',
    };
  }

  let cleanDeadline: string | null | undefined;
  if (input.registration_deadline === null) {
    cleanDeadline = null;
  } else if (input.registration_deadline && input.registration_deadline.trim()) {
    const parsedDeadline = sanitizeDeadlineIso(input.registration_deadline);
    if (!parsedDeadline) {
      return {
        valid: false,
        error: 'Please enter a valid Registration Deadline date and time.',
      };
    }

    const maxAllowedDeadlineMs =
      new Date(`${cleanEventDate}T23:59:59Z`).getTime() + 12 * 3600 * 1000;
    if (new Date(parsedDeadline).getTime() > maxAllowedDeadlineMs) {
      return {
        valid: false,
        error: 'Registration Deadline cannot be after the Event Date.',
      };
    }

    cleanDeadline = parsedDeadline;
  }

  return {
    valid: true,
    sanitized: {
      event_date: cleanEventDate,
      start_time: cleanStartTime,
      end_time: cleanEndTime,
      registration_deadline: cleanDeadline,
    },
  };
}

/**
 * Formats a YYYY-MM-DD date string without UTC-to-local day shift or "Invalid Date" output.
 */
export function formatCalendarDate(
  dateStr?: string | null,
  variant: 'long' | 'short' = 'short'
): string {
  if (!dateStr) return 'To be announced';
  const clean = sanitizeDateString(dateStr);
  if (clean) {
    const [year, month, day] = clean.split('-').map(Number);
    const local = new Date(year, month - 1, day);
    return local.toLocaleDateString('en-US', {
      ...(variant === 'long' ? { weekday: 'long', month: 'long' } : { month: 'short' }),
      day: 'numeric',
      year: 'numeric',
    });
  }

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 'To be announced';
  return parsed.toLocaleDateString('en-US', {
    ...(variant === 'long' ? { weekday: 'long', month: 'long' } : { month: 'short' }),
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Safely formats an ISO timestamp for UI display, returning a fallback instead of "Invalid Date".
 */
export function formatDateTimeDisplay(isoStr?: string | null): string {
  if (!isoStr) return 'To be announced';
  const parsed = new Date(isoStr);
  if (isNaN(parsed.getTime())) return 'To be announced';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
