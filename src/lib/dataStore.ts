import { useEffect, useState } from 'react';
import { supabase, SUPER_ADMIN_EMAIL } from './supabase';
import {
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLUB_ADMINS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PROFILES,
} from './seedData';
import {
  Club,
  EventItem,
  AnnouncementItem,
  ClubAdminAssignment,
  ActivityLogItem,
  Profile,
} from '../types';

export {
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLUB_ADMINS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PROFILES,
};

const STORAGE_KEYS = {
  CLUBS: 'iitdh_portal_clubs',
  EVENTS: 'iitdh_portal_events',
  ANNOUNCEMENTS: 'iitdh_portal_announcements',
  CLUB_ADMINS: 'iitdh_portal_club_admins',
  ACTIVITY_LOGS: 'iitdh_portal_activity_logs',
  PROFILES: 'iitdh_portal_profiles',
};

const isValidUuid = (value?: string | null): boolean => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class DataStore {
  private clubs: Club[] = [];
  private events: EventItem[] = [];
  private announcements: AnnouncementItem[] = [];
  private clubAdmins: ClubAdminAssignment[] = [];
  private activityLogs: ActivityLogItem[] = [];
  private profiles: Profile[] = [];
  private isSupabaseLive: boolean = false;
  private version: number = 0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedClubs = localStorage.getItem(STORAGE_KEYS.CLUBS);
      let parsedClubs: Club[] = storedClubs ? JSON.parse(storedClubs) : [...INITIAL_CLUBS];
      INITIAL_CLUBS.forEach((initClub) => {
        if (!parsedClubs.some((c) => c.name.toLowerCase() === initClub.name.toLowerCase() || c.id === initClub.id)) {
          parsedClubs.push(initClub);
        }
      });
      this.clubs = parsedClubs;

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      this.events = storedEvents ? JSON.parse(storedEvents) : [...INITIAL_EVENTS];

      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      this.announcements = storedAnnouncements ? JSON.parse(storedAnnouncements) : [...INITIAL_ANNOUNCEMENTS];

      const storedClubAdmins = localStorage.getItem(STORAGE_KEYS.CLUB_ADMINS);
      this.clubAdmins = storedClubAdmins ? JSON.parse(storedClubAdmins) : [...INITIAL_CLUB_ADMINS];

      const storedLogs = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      this.activityLogs = storedLogs ? JSON.parse(storedLogs) : [...INITIAL_ACTIVITY_LOGS];

      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : [...INITIAL_PROFILES];
    } catch {
      this.clubs = [...INITIAL_CLUBS];
      this.events = [...INITIAL_EVENTS];
      this.announcements = [...INITIAL_ANNOUNCEMENTS];
      this.clubAdmins = [...INITIAL_CLUB_ADMINS];
      this.activityLogs = [...INITIAL_ACTIVITY_LOGS];
      this.profiles = [...INITIAL_PROFILES];
    }

    // Sync from authoritative shared backend & Supabase
    this.syncFromServer();
    this.syncFromSupabase();

    if (typeof window !== 'undefined') {
      // Keep all student sessions in sync automatically
      window.addEventListener('focus', () => {
        this.syncFromServer();
      });
      setInterval(() => {
        this.syncFromServer();
      }, 5000);
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(this.clubs));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcements));
      localStorage.setItem(STORAGE_KEYS.CLUB_ADMINS, JSON.stringify(this.clubAdmins));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(this.activityLogs));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    this.notify();
  }

  public getVersion(): number {
    return this.version;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }

  private lastServerSnapshot: string = '';

  public async syncFromServer() {
    try {
      const response = await fetch('/api/portal/state', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return;
      const rawText = await response.text();
      if (rawText === this.lastServerSnapshot) return;
      const data = JSON.parse(rawText);
      this.lastServerSnapshot = rawText;
      if (Array.isArray(data.clubs)) this.clubs = data.clubs;
      if (Array.isArray(data.events)) this.events = data.events;
      if (Array.isArray(data.announcements)) this.announcements = data.announcements;
      if (Array.isArray(data.clubAdmins)) this.clubAdmins = data.clubAdmins;
      if (Array.isArray(data.activityLogs)) this.activityLogs = data.activityLogs;
      if (Array.isArray(data.profiles)) this.profiles = data.profiles;
      this.save();
    } catch {
      // Offline / static fallback gracefully ignored
    }
  }

  public async syncFromSupabase() {
    try {
      const { data: remoteClubs, error: clubsErr } = await supabase.from('clubs').select('*');
      if (!clubsErr && remoteClubs && remoteClubs.length > 0) {
        this.clubs = remoteClubs;
        this.isSupabaseLive = true;
      }

      const { data: remoteEvents, error: eventsErr } = await supabase.from('events').select('*');
      if (!eventsErr && remoteEvents && remoteEvents.length > 0) {
        this.events = remoteEvents;
        this.isSupabaseLive = true;
      }

      const { data: remoteAnnouncements, error: annErr } = await supabase.from('announcements').select('*');
      if (!annErr && remoteAnnouncements && remoteAnnouncements.length > 0) {
        this.announcements = remoteAnnouncements;
        this.isSupabaseLive = true;
      }

      const { data: remoteAdmins, error: adminErr } = await supabase.from('club_admins').select('*');
      if (!adminErr && remoteAdmins && remoteAdmins.length > 0) {
        this.clubAdmins = remoteAdmins;
        this.isSupabaseLive = true;
      }

      if (this.isSupabaseLive) {
        this.save();
      }
    } catch {
      // Operating with Express backend + local cache
    }
  }

  public getIsSupabaseLive(): boolean {
    return this.isSupabaseLive;
  }

  // --- PROFILES ---
  public getProfiles(): Profile[] {
    return [...this.profiles];
  }

  public async registerProfile(email: string, fullName?: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iitdh.ac.in')) return;

    const existing = this.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!existing) {
      this.profiles.push({
        id: generateUuid(),
        email: cleanEmail,
        full_name: fullName?.trim() || cleanEmail.split('@')[0],
        created_at: new Date().toISOString(),
      });
      this.save();
    }

    try {
      const res = await fetch('/api/portal/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, fullName }),
      });
      if (res.ok) {
        const savedProfile = (await res.json()) as Profile;
        const idx = this.profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);
        if (idx >= 0) this.profiles[idx] = savedProfile;
        else this.profiles.push(savedProfile);
        this.save();
      }
    } catch {}
  }

  // --- CLUBS ---
  public getClubs(): Club[] {
    return [...this.clubs];
  }

  public getClubById(id: string): Club | undefined {
    return this.clubs.find((c) => c.id === id);
  }

  public async createClub(club: Omit<Club, 'id' | 'created_at'>, actorEmail: string): Promise<Club> {
    const newClub: Club = {
      ...club,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/portal/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club, actorEmail }),
      });
      if (res.ok) {
        const created = (await res.json()) as Club;
        await this.syncFromServer();
        return created;
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      const { data, error } = await supabase.from('clubs').insert([newClub]).select().single();
      if (!error && data) {
        this.clubs.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Created club "${newClub.name}"`, 'club', data.id);
        this.save();
        return data;
      }
    } catch {}

    this.clubs.unshift(newClub);
    this.logActivity(actorEmail, `Created club "${newClub.name}"`, 'club', newClub.id);
    this.save();
    return newClub;
  }

  public async updateClub(id: string, updates: Partial<Club>, actorEmail: string): Promise<Club> {
    const index = this.clubs.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Club not found');

    try {
      const res = await fetch(`/api/portal/clubs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, actorEmail }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Club;
        await this.syncFromServer();
        return updated;
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    const updated = { ...this.clubs[index], ...updates };
    try {
      const { error } = await supabase.from('clubs').update(updates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.clubs[index] = updated;
    this.logActivity(actorEmail, `Updated club details for "${updated.name}"`, 'club', id);
    this.save();
    return updated;
  }

  public async deleteClub(id: string, actorEmail: string): Promise<boolean> {
    const club = this.getClubById(id);
    const clubName = club?.name || 'Club';

    try {
      const res = await fetch(`/api/portal/clubs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorEmail }),
      });
      if (res.ok) {
        await this.syncFromServer();
        return true;
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      await supabase.from('clubs').delete().eq('id', id);
    } catch {}

    this.clubs = this.clubs.filter((c) => c.id !== id);
    this.events = this.events.filter((e) => e.club_id !== id);
    this.announcements = this.announcements.filter((a) => a.club_id !== id);
    this.clubAdmins = this.clubAdmins.filter((ca) => ca.club_id !== id);

    this.logActivity(actorEmail, `Deleted club "${clubName}" and related records`, 'club', id);
    this.save();
    return true;
  }

  // --- EVENTS ---
  public getEvents(includeDrafts: boolean = false, allowedClubIds?: string[]): EventItem[] {
    return this.events
      .filter((e) => {
        if (!includeDrafts && e.status === 'Draft') return false;
        if (allowedClubIds !== undefined && !allowedClubIds.includes(e.club_id)) {
          return false;
        }
        return true;
      })
      .map((e) => ({
        ...e,
        club: this.getClubById(e.club_id),
      }))
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }

  public getEventById(id: string): EventItem | undefined {
    const event = this.events.find((e) => e.id === id);
    if (!event) return undefined;
    return {
      ...event,
      club: this.getClubById(event.club_id),
    };
  }

  public async createEvent(
    event: Omit<EventItem, 'id' | 'created_at' | 'club'>,
    actorEmail: string
  ): Promise<EventItem> {
    const newEvent: EventItem = {
      ...event,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/portal/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, actorEmail }),
      });
      if (res.ok) {
        const created = (await res.json()) as EventItem;
        await this.syncFromServer();
        return { ...created, club: this.getClubById(created.club_id) };
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      const supabasePayload = {
        ...newEvent,
        created_by: isValidUuid(newEvent.created_by) ? newEvent.created_by : undefined,
      };
      const { data, error } = await supabase.from('events').insert([supabasePayload]).select().single();
      if (!error && data) {
        this.events.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Created event "${newEvent.title}"`, 'event', data.id);
        this.save();
        return { ...data, club: this.getClubById(data.club_id) };
      }
    } catch {}

    this.events.unshift(newEvent);
    this.logActivity(actorEmail, `Created event "${newEvent.title}"`, 'event', newEvent.id);
    this.save();
    return { ...newEvent, club: this.getClubById(newEvent.club_id) };
  }

  public async updateEvent(id: string, updates: Partial<EventItem>, actorEmail: string): Promise<EventItem> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');

    try {
      const res = await fetch(`/api/portal/events/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, actorEmail }),
      });
      if (res.ok) {
        const updated = (await res.json()) as EventItem;
        await this.syncFromServer();
        return { ...updated, club: this.getClubById(updated.club_id) };
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    const updated: EventItem = {
      ...this.events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.events[index] = updated;
    this.logActivity(actorEmail, `Updated event "${updated.title}"`, 'event', id);
    this.save();
    return { ...updated, club: this.getClubById(updated.club_id) };
  }

  public async deleteEvent(id: string, actorEmail: string): Promise<boolean> {
    const event = this.getEventById(id);
    const eventTitle = event?.title || 'Event';

    try {
      const res = await fetch(`/api/portal/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorEmail }),
      });
      if (res.ok) {
        await this.syncFromServer();
        return true;
      }
      if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      await supabase.from('events').delete().eq('id', id);
    } catch {}

    this.events = this.events.filter((e) => e.id !== id);
    this.logActivity(actorEmail, `Deleted event "${eventTitle}"`, 'event', id);
    this.save();
    return true;
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(includeDrafts: boolean = false, allowedClubIds?: string[]): AnnouncementItem[] {
    return this.announcements
      .filter((a) => {
        if (!includeDrafts && a.status === 'Draft') return false;
        if (allowedClubIds !== undefined) {
          // Scoped view (e.g., Club Admin managing their clubs)
          if (a.club_id && !allowedClubIds.includes(a.club_id)) return false;
        }
        return true;
      })
      .map((a) => ({
        ...a,
        club: a.club_id ? this.getClubById(a.club_id) : undefined,
      }))
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
  }

  public async createAnnouncement(
    announcement: Omit<AnnouncementItem, 'id' | 'created_at' | 'club'>,
    actorEmail: string
  ): Promise<AnnouncementItem> {
    const newAnnouncement: AnnouncementItem = {
      ...announcement,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: announcement.published_at || new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/portal/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement, actorEmail }),
      });
      if (res.ok) {
        const created = (await res.json()) as AnnouncementItem;
        await this.syncFromServer();
        return { ...created, club: created.club_id ? this.getClubById(created.club_id) : undefined };
      } else if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Unauthorized to publish announcement.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) {
        throw err;
      }
    }

    try {
      const supabasePayload = {
        ...newAnnouncement,
        created_by: isValidUuid(newAnnouncement.created_by) ? newAnnouncement.created_by : undefined,
      };
      const { data, error } = await supabase.from('announcements').insert([supabasePayload]).select().single();
      if (!error && data) {
        this.announcements.unshift(data);
        this.isSupabaseLive = true;
        this.logActivity(actorEmail, `Published announcement "${newAnnouncement.title}"`, 'announcement', data.id);
        this.save();
        return { ...data, club: data.club_id ? this.getClubById(data.club_id) : undefined };
      }
    } catch {}

    this.announcements.unshift(newAnnouncement);
    this.logActivity(actorEmail, `Published announcement "${newAnnouncement.title}"`, 'announcement', newAnnouncement.id);
    this.save();
    return { ...newAnnouncement, club: newAnnouncement.club_id ? this.getClubById(newAnnouncement.club_id) : undefined };
  }

  public async updateAnnouncement(
    id: string,
    updates: Partial<AnnouncementItem>,
    actorEmail: string
  ): Promise<AnnouncementItem> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found');

    try {
      const res = await fetch(`/api/portal/announcements/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, actorEmail }),
      });
      if (res.ok) {
        const updated = (await res.json()) as AnnouncementItem;
        await this.syncFromServer();
        return { ...updated, club: updated.club_id ? this.getClubById(updated.club_id) : undefined };
      } else if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Unauthorized to update announcement.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    const updated: AnnouncementItem = {
      ...this.announcements[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabaseUpdates = {
        ...updates,
        created_by: isValidUuid(updates.created_by) ? updates.created_by : undefined,
      };
      const { error } = await supabase.from('announcements').update(supabaseUpdates).eq('id', id);
      if (!error) this.isSupabaseLive = true;
    } catch {}

    this.announcements[index] = updated;
    this.logActivity(actorEmail, `Updated announcement "${updated.title}"`, 'announcement', id);
    this.save();
    return { ...updated, club: updated.club_id ? this.getClubById(updated.club_id) : undefined };
  }

  public async deleteAnnouncement(id: string, actorEmail: string): Promise<boolean> {
    const ann = this.announcements.find((a) => a.id === id);
    const title = ann?.title || 'Announcement';

    try {
      const res = await fetch(`/api/portal/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorEmail }),
      });
      if (res.ok) {
        await this.syncFromServer();
        return true;
      } else if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Unauthorized to delete announcement.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      await supabase.from('announcements').delete().eq('id', id);
    } catch {}

    this.announcements = this.announcements.filter((a) => a.id !== id);
    this.logActivity(actorEmail, `Deleted announcement "${title}"`, 'announcement', id);
    this.save();
    return true;
  }

  // --- CLUB ADMINS ---
  public getClubAdmins(): ClubAdminAssignment[] {
    return this.clubAdmins.map((ca) => ({
      ...ca,
      club_name: this.getClubById(ca.club_id)?.name || 'Unknown Club',
    }));
  }

  public getClubIdsForUser(email: string): string[] {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return this.clubs.map((c) => c.id);
    }
    return this.clubAdmins
      .filter((ca) => ca.user_email?.toLowerCase() === email.toLowerCase())
      .map((ca) => ca.club_id);
  }

  public async assignClubAdmin(
    userEmail: string,
    clubId: string,
    actorEmail: string
  ): Promise<ClubAdminAssignment> {
    const club = this.getClubById(clubId);
    if (!club) throw new Error('Invalid club ID');

    try {
      const res = await fetch('/api/portal/club-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, clubId, actorEmail }),
      });
      if (res.ok) {
        const created = (await res.json()) as ClubAdminAssignment;
        await this.syncFromServer();
        return created;
      } else if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    const existing = this.clubAdmins.find(
      (ca) => ca.user_email?.toLowerCase() === userEmail.toLowerCase() && ca.club_id === clubId
    );
    if (existing) {
      return existing;
    }

    const newAssignment: ClubAdminAssignment = {
      id: generateUuid(),
      user_id: generateUuid(),
      user_email: userEmail.toLowerCase().trim(),
      club_id: clubId,
      club_name: club.name,
      assigned_by: actorEmail,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('club_admins').insert([newAssignment]);
    } catch {}

    this.clubAdmins.unshift(newAssignment);
    this.logActivity(actorEmail, `Assigned ${userEmail} as admin for ${club.name}`, 'admin', newAssignment.id);
    this.save();
    return newAssignment;
  }

  public async removeClubAdmin(id: string, actorEmail: string): Promise<boolean> {
    const assignment = this.clubAdmins.find((ca) => ca.id === id);
    const targetEmail = assignment?.user_email || 'User';
    const clubName = assignment?.club_name || 'Club';

    try {
      const res = await fetch(`/api/portal/club-admins/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorEmail }),
      });
      if (res.ok) {
        await this.syncFromServer();
        return true;
      } else if (res.status >= 400 && res.status < 500) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Request rejected by server.');
      }
    } catch (err: any) {
      if (err?.message && !err.message.includes('fetch')) throw err;
    }

    try {
      await supabase.from('club_admins').delete().eq('id', id);
    } catch {}

    this.clubAdmins = this.clubAdmins.filter((ca) => ca.id !== id);
    this.logActivity(actorEmail, `Removed ${targetEmail} from ${clubName} admin privileges`, 'admin', id);
    this.save();
    return true;
  }

  // --- ACTIVITY LOGS ---
  public getActivityLogs(): ActivityLogItem[] {
    return [...this.activityLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public logActivity(
    actorEmail: string,
    action: string,
    targetType: 'event' | 'announcement' | 'club' | 'admin',
    targetId?: string
  ) {
    const newLog: ActivityLogItem = {
      id: generateUuid(),
      actor_id: actorEmail,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      created_at: new Date().toISOString(),
    };

    try {
      fetch('/api/portal/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorEmail, action, targetType, targetId }),
      });
    } catch {}

    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 200) {
      this.activityLogs = this.activityLogs.slice(0, 200);
    }
    this.save();
  }
}

export const dataStore = new DataStore();

export function useDataStoreVersion(): number {
  const [version, setVersion] = useState(() => dataStore.getVersion());
  useEffect(() => {
    return dataStore.subscribe(() => {
      setVersion(dataStore.getVersion());
    });
  }, []);
  return version;
}
