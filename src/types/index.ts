export type UserRole = 'normal' | 'club_admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  domain: string;
  description: string;
  email: string;
  logo_url?: string;
  created_at: string;
}

export interface ClubAdminAssignment {
  id: string;
  user_id: string;
  club_id: string;
  assigned_by?: string;
  created_at: string;
  user_email?: string;
  club_name?: string;
}

export type EventStatus = 'Draft' | 'Published' | 'Cancelled';

export interface EventItem {
  id: string;
  club_id: string;
  title: string;
  category: string;
  short_description: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM:SS
  end_time?: string; // HH:MM:SS
  venue: string;
  registration_url?: string;
  registration_deadline?: string;
  poster_url?: string;
  status: EventStatus;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  club?: Club;
}

export type AnnouncementType = 'Club Announcement' | 'Campus-wide Announcement';
export type AnnouncementStatus = 'Draft' | 'Published';

export interface AnnouncementItem {
  id: string;
  club_id?: string | null; // null for campus-wide
  title: string;
  content: string;
  type: AnnouncementType;
  external_url?: string;
  attachment_url?: string;
  status: AnnouncementStatus;
  published_at: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  club?: Club;
}

export interface ActivityLogItem {
  id: string;
  actor_id?: string;
  actor_email?: string;
  action: string;
  target_type: 'event' | 'announcement' | 'club' | 'admin';
  target_id?: string;
  created_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  assignedClubIds: string[];
}
