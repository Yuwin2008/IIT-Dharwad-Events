import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  SUPER_ADMIN_EMAIL,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLUB_ADMINS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PROFILES,
} from './src/lib/seedData.ts';
import type {
  Club,
  EventItem,
  AnnouncementItem,
  ClubAdminAssignment,
  ActivityLogItem,
  Profile,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'portal-db.json');

interface PortalDatabase {
  clubs: Club[];
  events: EventItem[];
  announcements: AnnouncementItem[];
  clubAdmins: ClubAdminAssignment[];
  activityLogs: ActivityLogItem[];
  profiles: Profile[];
}

function loadDatabase(): PortalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let db: PortalDatabase | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw) as PortalDatabase;
    } catch (err) {
      console.error('Failed to parse existing portal-db.json, reinitializing:', err);
    }
  }

  if (!db) {
    db = {
      clubs: [...INITIAL_CLUBS],
      events: [...INITIAL_EVENTS],
      announcements: [...INITIAL_ANNOUNCEMENTS],
      clubAdmins: [...INITIAL_CLUB_ADMINS],
      activityLogs: [...INITIAL_ACTIVITY_LOGS],
      profiles: [...INITIAL_PROFILES],
    };
    saveDatabase(db);
    return db;
  }

  // Merge any newly added initial clubs idempotently
  let changed = false;
  for (const initClub of INITIAL_CLUBS) {
    const exists = db.clubs.some(
      (c) => c.id === initClub.id || c.name.toLowerCase() === initClub.name.toLowerCase()
    );
    if (!exists) {
      db.clubs.push(initClub);
      changed = true;
    }
  }
  if (!Array.isArray(db.profiles)) {
    db.profiles = [...INITIAL_PROFILES];
    changed = true;
  }
  if (changed) {
    saveDatabase(db);
  }

  return db;
}

function saveDatabase(db: PortalDatabase) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

let db = loadDatabase();

function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

function isClubAdminFor(email: string | undefined, clubId: string): boolean {
  if (!email) return false;
  if (isSuperAdminEmail(email)) return true;
  const clean = email.trim().toLowerCase();
  return db.clubAdmins.some(
    (ca) => ca.user_email?.toLowerCase() === clean && ca.club_id === clubId
  );
}

function isAnyAdmin(email?: string): boolean {
  if (!email) return false;
  if (isSuperAdminEmail(email)) return true;
  const clean = email.trim().toLowerCase();
  return db.clubAdmins.some((ca) => ca.user_email?.toLowerCase() === clean);
}

function appendActivityLog(
  actorEmail: string,
  action: string,
  targetType: 'event' | 'announcement' | 'club' | 'admin',
  targetId?: string
) {
  const newLog: ActivityLogItem = {
    id: crypto.randomUUID(),
    actor_id: actorEmail,
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    created_at: new Date().toISOString(),
  };
  db.activityLogs.unshift(newLog);
  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 200);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && req.path.startsWith('/api')) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, clubs: db.clubs.length, announcements: db.announcements.length });
  });

  // Get complete synchronized portal state
  app.get('/api/portal/state', (_req, res) => {
    res.json({
      clubs: db.clubs,
      events: db.events,
      announcements: db.announcements,
      clubAdmins: db.clubAdmins,
      activityLogs: db.activityLogs,
      profiles: db.profiles,
    });
  });

  // Register or update institutional user profile
  app.post('/api/portal/profiles', (req, res) => {
    const { email, fullName } = req.body as { email?: string; fullName?: string };
    if (!email || !email.trim().toLowerCase().endsWith('@iitdh.ac.in')) {
      res.status(400).json({ error: 'Only @iitdh.ac.in email addresses are permitted.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (fullName && fullName.trim()) {
        existing.full_name = fullName.trim();
        saveDatabase(db);
      }
      res.json(existing);
      return;
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      full_name: fullName?.trim() || cleanEmail.split('@')[0],
      created_at: new Date().toISOString(),
    };
    db.profiles.push(newProfile);
    saveDatabase(db);
    res.status(201).json(newProfile);
  });

  // --- CLUBS CRUD (Super Admin only) ---
  app.post('/api/portal/clubs', (req, res) => {
    const { club, actorEmail } = req.body as { club: Omit<Club, 'id' | 'created_at'>; actorEmail?: string };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can create clubs.' });
      return;
    }

    const newClub: Club = {
      ...club,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    db.clubs.unshift(newClub);
    appendActivityLog(actorEmail!, `Created club "${newClub.name}"`, 'club', newClub.id);
    saveDatabase(db);
    res.status(201).json(newClub);
  });

  app.put('/api/portal/clubs/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as { updates: Partial<Club>; actorEmail?: string };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can update clubs.' });
      return;
    }

    const index = db.clubs.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    const updated = { ...db.clubs[index], ...updates };
    db.clubs[index] = updated;
    appendActivityLog(actorEmail!, `Updated club details for "${updated.name}"`, 'club', id);
    saveDatabase(db);
    res.json(updated);
  });

  app.delete('/api/portal/clubs/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can delete clubs.' });
      return;
    }

    const club = db.clubs.find((c) => c.id === id);
    const clubName = club?.name || 'Club';
    db.clubs = db.clubs.filter((c) => c.id !== id);
    db.events = db.events.filter((e) => e.club_id !== id);
    db.announcements = db.announcements.filter((a) => a.club_id !== id);
    db.clubAdmins = db.clubAdmins.filter((ca) => ca.club_id !== id);
    appendActivityLog(actorEmail!, `Deleted club "${clubName}" and related records`, 'club', id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- EVENTS CRUD ---
  app.post('/api/portal/events', (req, res) => {
    const { event, actorEmail } = req.body as {
      event: Omit<EventItem, 'id' | 'created_at' | 'club'>;
      actorEmail?: string;
    };
    if (!event?.club_id || !isClubAdminFor(actorEmail, event.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to create events for this club.' });
      return;
    }

    const newEvent: EventItem = {
      ...event,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.events.unshift(newEvent);
    appendActivityLog(actorEmail!, `Created event "${newEvent.title}"`, 'event', newEvent.id);
    saveDatabase(db);
    res.status(201).json(newEvent);
  });

  app.put('/api/portal/events/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as { updates: Partial<EventItem>; actorEmail?: string };
    const index = db.events.findIndex((e) => e.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const targetClubId = updates.club_id || db.events[index].club_id;
    if (!isClubAdminFor(actorEmail, db.events[index].club_id) || !isClubAdminFor(actorEmail, targetClubId)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to modify this event.' });
      return;
    }

    const updated: EventItem = {
      ...db.events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    db.events[index] = updated;
    appendActivityLog(actorEmail!, `Updated event "${updated.title}"`, 'event', id);
    saveDatabase(db);
    res.json(updated);
  });

  app.delete('/api/portal/events/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    const existing = db.events.find((e) => e.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    if (!isClubAdminFor(actorEmail, existing.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to delete this event.' });
      return;
    }

    db.events = db.events.filter((e) => e.id !== id);
    appendActivityLog(actorEmail!, `Deleted event "${existing.title}"`, 'event', id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- ANNOUNCEMENTS CRUD ---
  app.post('/api/portal/announcements', (req, res) => {
    const { announcement, actorEmail } = req.body as {
      announcement: Omit<AnnouncementItem, 'id' | 'created_at' | 'club'>;
      actorEmail?: string;
    };

    if (announcement.type === 'Campus-wide Announcement' || !announcement.club_id) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can publish campus-wide announcements.' });
        return;
      }
    } else if (!isClubAdminFor(actorEmail, announcement.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to publish announcements for this club.' });
      return;
    }

    const newAnnouncement: AnnouncementItem = {
      ...announcement,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: announcement.published_at || new Date().toISOString(),
    };
    db.announcements.unshift(newAnnouncement);
    appendActivityLog(actorEmail!, `Published announcement "${newAnnouncement.title}"`, 'announcement', newAnnouncement.id);
    saveDatabase(db);
    res.status(201).json(newAnnouncement);
  });

  app.put('/api/portal/announcements/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorEmail } = req.body as {
      updates: Partial<AnnouncementItem>;
      actorEmail?: string;
    };
    const index = db.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    const existing = db.announcements[index];
    const targetType = updates.type || existing.type;
    const targetClubId = updates.club_id !== undefined ? updates.club_id : existing.club_id;

    if (existing.club_id === null || targetType === 'Campus-wide Announcement' || !targetClubId) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can update campus-wide announcements.' });
        return;
      }
    } else {
      if (
        (existing.club_id && !isClubAdminFor(actorEmail, existing.club_id)) ||
        !isClubAdminFor(actorEmail, targetClubId)
      ) {
        res.status(403).json({ error: 'Forbidden: Not authorized to edit this announcement.' });
        return;
      }
    }

    const updated: AnnouncementItem = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    db.announcements[index] = updated;
    appendActivityLog(actorEmail!, `Updated announcement "${updated.title}"`, 'announcement', id);
    saveDatabase(db);
    res.json(updated);
  });

  app.delete('/api/portal/announcements/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    const existing = db.announcements.find((a) => a.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    if (!existing.club_id) {
      if (!isSuperAdminEmail(actorEmail)) {
        res.status(403).json({ error: 'Forbidden: Only Super Admin can delete campus-wide announcements.' });
        return;
      }
    } else if (!isClubAdminFor(actorEmail, existing.club_id)) {
      res.status(403).json({ error: 'Forbidden: Not authorized to delete this announcement.' });
      return;
    }

    db.announcements = db.announcements.filter((a) => a.id !== id);
    appendActivityLog(actorEmail!, `Deleted announcement "${existing.title}"`, 'announcement', id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- CLUB ADMINS CRUD (Super Admin only) ---
  app.post('/api/portal/club-admins', (req, res) => {
    const { userEmail, clubId, actorEmail } = req.body as {
      userEmail?: string;
      clubId?: string;
      actorEmail?: string;
    };
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can assign club admins.' });
      return;
    }
    if (!userEmail || !clubId) {
      res.status(400).json({ error: 'userEmail and clubId are required.' });
      return;
    }

    const club = db.clubs.find((c) => c.id === clubId);
    if (!club) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    const existing = db.clubAdmins.find(
      (ca) => ca.user_email?.toLowerCase() === cleanEmail && ca.club_id === clubId
    );
    if (existing) {
      res.json(existing);
      return;
    }

    const profile = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    const newAssignment: ClubAdminAssignment = {
      id: crypto.randomUUID(),
      user_id: profile?.id || crypto.randomUUID(),
      user_email: cleanEmail,
      club_id: clubId,
      club_name: club.name,
      assigned_by: actorEmail,
      created_at: new Date().toISOString(),
    };
    db.clubAdmins.unshift(newAssignment);
    appendActivityLog(actorEmail!, `Assigned ${cleanEmail} as admin for ${club.name}`, 'admin', newAssignment.id);
    saveDatabase(db);
    res.status(201).json(newAssignment);
  });

  app.delete('/api/portal/club-admins/:id', (req, res) => {
    const { id } = req.params;
    const actorEmail = (req.body?.actorEmail || req.headers['x-actor-email']) as string | undefined;
    if (!isSuperAdminEmail(actorEmail)) {
      res.status(403).json({ error: 'Forbidden: Only Super Admin can remove club admins.' });
      return;
    }

    const existing = db.clubAdmins.find((ca) => ca.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    db.clubAdmins = db.clubAdmins.filter((ca) => ca.id !== id);
    appendActivityLog(
      actorEmail!,
      `Removed ${existing.user_email || 'User'} from ${existing.club_name || 'Club'} admin privileges`,
      'admin',
      id
    );
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- ACTIVITY LOG ---
  app.post('/api/portal/activity', (req, res) => {
    const { actorEmail, action, targetType, targetId } = req.body as {
      actorEmail?: string;
      action?: string;
      targetType?: 'event' | 'announcement' | 'club' | 'admin';
      targetId?: string;
    };
    if (!isAnyAdmin(actorEmail)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (action && targetType) {
      appendActivityLog(actorEmail!, action, targetType, targetId);
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  // Return JSON 404 for any unmatched /api/* route instead of HTML
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite Dev Middleware or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IIT Dharwad Campus Events Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
