import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { AdminOverview } from '../components/admin/AdminOverview';
import { ManageEvents } from '../components/admin/ManageEvents';
import { ManageAnnouncements } from '../components/admin/ManageAnnouncements';
import { ManageClubs } from '../components/admin/ManageClubs';
import { ManageClubAdmins } from '../components/admin/ManageClubAdmins';
import { ActivityLogView } from '../components/admin/ActivityLogView';
import { SqlMigrationModal } from '../components/admin/SqlMigrationModal';
import { 
  LayoutDashboard, 
  Calendar, 
  Megaphone, 
  Building2, 
  Users, 
  Activity, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { EventItem } from '../types';

interface AdminDashboardViewProps {
  initialTab?: string;
  onPreviewEvent: (event: EventItem) => void;
  onNavigateStudentDashboard: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  initialTab = 'overview',
  onPreviewEvent,
  onNavigateStudentDashboard,
}) => {
  const { user, isSuperAdmin, isClubAdmin, canAccessAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);

  // Security Guard: double-check permission
  if (!canAccessAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-rose-900/40 rounded-2xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrative Access Prohibited</h2>
        <p className="text-xs text-slate-400">
          This portal section is restricted to authorized Club Administrators and the designated Super Administrator.
        </p>
        <button
          onClick={onNavigateStudentDashboard}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
        >
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Admin Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-6 sticky top-20">
          {/* Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isSuperAdmin 
                ? 'bg-purple-950/70 border border-purple-600/40 text-purple-300' 
                : 'bg-amber-950/70 border border-amber-600/40 text-amber-300'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                isSuperAdmin ? 'text-purple-400' : 'text-amber-400'
              }`}>
                {isSuperAdmin ? 'Super Administrator' : 'Club Administrator'}
              </span>
              <span className="text-xs font-mono text-slate-300 truncate block">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Manage Events</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'announcements'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4" />
                <span>Manage Circulars</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'clubs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Clubs Management</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* SUPER ADMIN ONLY: Manage Club Admins */}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                  activeTab === 'admins'
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-950 font-semibold'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Manage Club Admins</span>
                </div>
                <span className="text-[10px] bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-700/50">
                  Super
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'activity'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Activity Audit Log</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                activeTab === 'account'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4" />
                <span>Admin Account</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          {/* Quick link back to student dashboard */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={onNavigateStudentDashboard}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-indigo-400 hover:bg-indigo-950/30 text-xs font-semibold transition-colors"
            >
              <span>Switch to Student View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Administrative Content Viewport */}
        <main className="lg:col-span-9">
          {activeTab === 'overview' && (
            <AdminOverview
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSqlModal={() => setSqlModalOpen(true)}
            />
          )}

          {activeTab === 'events' && (
            <ManageEvents onPreviewEvent={onPreviewEvent} />
          )}

          {activeTab === 'announcements' && (
            <ManageAnnouncements />
          )}

          {activeTab === 'clubs' && (
            <ManageClubs />
          )}

          {activeTab === 'admins' && (
            <ManageClubAdmins />
          )}

          {activeTab === 'activity' && (
            <ActivityLogView />
          )}

          {activeTab === 'account' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Administrative Account Details
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Institutional authority and role configuration
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Authenticated Email</span>
                  <span className="font-mono font-semibold text-white">{user?.email}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">System Role</span>
                  <span className={`font-semibold capitalize ${
                    isSuperAdmin ? 'text-purple-400' : 'text-amber-400'
                  }`}>
                    {isSuperAdmin ? 'Designated Super Administrator' : 'Assigned Club Administrator'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Database RLS Scope</span>
                  <span className="text-slate-300">
                    {isSuperAdmin ? 'ALL TABLES (Global)' : 'Assigned Club UUIDs'}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSqlModalOpen(true)}
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View PostgreSQL Row Level Security (RLS) Definitions</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Supabase SQL Modal */}
      <SqlMigrationModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />
    </div>
  );
};
