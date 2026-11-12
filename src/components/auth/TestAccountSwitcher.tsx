import React from 'react';
import { useAuth } from '../../lib/authContext';
import { Shield, UserCheck, GraduationCap, LogOut } from 'lucide-react';

export const TestAccountSwitcher: React.FC = () => {
  const { user, switchTestAccount, logout } = useAuth();

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-slate-300">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-medium">Evaluation Role Switcher:</span>
        {user ? (
          <span className="text-slate-200">
            Active as <strong className="text-indigo-300 font-semibold">{user.email}</strong> 
            <span className="text-slate-400"> (Role: {user.role === 'super_admin' ? 'Super Admin' : user.role === 'club_admin' ? 'Club Admin' : 'Normal Student'})</span>
          </span>
        ) : (
          <span className="text-slate-400">Logged out (Public Guest)</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => switchTestAccount('super_admin')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
            user?.role === 'super_admin'
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
              : 'hover:bg-slate-800 text-slate-300 border border-slate-700/60'
          }`}
          title="Super Administrator (ec26bt032@iitdh.ac.in)"
        >
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Super Admin</span>
        </button>

        <button
          onClick={() => switchTestAccount('club_admin')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
            user?.role === 'club_admin'
              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
              : 'hover:bg-slate-800 text-slate-300 border border-slate-700/60'
          }`}
          title="Club Admin (coding_admin@iitdh.ac.in - Coding Club)"
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Club Admin</span>
        </button>

        <button
          onClick={() => switchTestAccount('normal')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
            user?.role === 'normal'
              ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40'
              : 'hover:bg-slate-800 text-slate-300 border border-slate-700/60'
          }`}
          title="Normal Student (student26@iitdh.ac.in)"
        >
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normal Student</span>
        </button>

        {user && (
          <button
            onClick={() => logout()}
            className="px-2 py-1 rounded text-rose-300 hover:bg-rose-950/40 transition-colors flex items-center gap-1 border border-rose-900/50"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};
