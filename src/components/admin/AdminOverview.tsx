import React from 'react';
import { useAuth } from '../../lib/authContext';
import { dataStore } from '../../lib/dataStore';
import { 
  Building2, 
  Calendar, 
  Megaphone, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight 
} from 'lucide-react';
import { Club, EventItem, AnnouncementItem, ActivityLogItem } from '../../types';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenSqlModal: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab, onOpenSqlModal }) => {
  const { user, isSuperAdmin, isClubAdmin, assignedClubs } = useAuth();

  const allClubs = dataStore.getClubs();
  // Filter for Club Admins
  const relevantClubs = isSuperAdmin
    ? allClubs
    : allClubs.filter((c) => assignedClubs.includes(c.id));

  const relevantClubIds = relevantClubs.map((c) => c.id);

  const relevantEvents = dataStore.getEvents(true, isSuperAdmin ? undefined : relevantClubIds);
  const relevantAnnouncements = dataStore.getAnnouncements(true, isSuperAdmin ? undefined : relevantClubIds);
  const activityLogs = dataStore.getActivityLogs().slice(0, 8);

  const upcomingCount = relevantEvents.filter((e) => e.status === 'Published').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Context Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {isSuperAdmin ? 'Super Administrator Console' : 'Club Administrator Workspace'}
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs text-slate-300 font-mono">{user?.email}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Administrative Management Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Unrestricted administrative authority across all IIT Dharwad clubs, events, and institutional permissions.'
              : `Managing administrative activities for ${relevantClubs.length} assigned club(s): ${relevantClubs.map((c) => c.name).join(', ') || 'None'}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSqlModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Supabase Schema & SQL</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('clubs')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Clubs Under Admin</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {relevantClubs.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {isSuperAdmin ? 'Full institute scope' : 'Your assigned clubs'}
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('events')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Managed Events</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {relevantEvents.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {upcomingCount} active published
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('announcements')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Announcements</span>
            <Megaphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {relevantAnnouncements.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Published circulars
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('activity')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Audit Events</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {activityLogs.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Logged operations
          </span>
        </div>
      </div>

      {/* Two Column Section: Events & Announcements overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Managed Events Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Events In Scope</span>
            </h3>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Manage Events</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {relevantEvents.slice(0, 4).map((evt) => (
              <div
                key={evt.id}
                className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-200">{evt.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {evt.club?.name} · {evt.event_date}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  evt.status === 'Published'
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                    : evt.status === 'Draft'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                    : 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                }`}>
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Administrative Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Recent Administrative Activity</span>
            </h3>
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activityLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-indigo-300">{log.actor_email}</span>
                  <span>{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-300 font-medium">{log.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
