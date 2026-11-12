import React from 'react';
import { ShieldAlert, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../lib/authContext';

interface UnauthorizedViewProps {
  onNavigate: (route: string) => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The route <code className="text-slate-300 font-mono">/admin</code> is strictly restricted to designated Institute Super Administrators and officially assigned Club Admin accounts.
          </p>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
          Current Session: <strong className="text-slate-200">{user?.email || 'Unauthenticated'}</strong>
          <span className="block mt-0.5">Assigned Role: <span className="capitalize text-slate-300 font-semibold">{user?.role || 'Guest'}</span></span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-950"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Student Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Campus Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
