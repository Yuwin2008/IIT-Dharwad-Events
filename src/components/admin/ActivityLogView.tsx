import React from 'react';
import { dataStore } from '../../lib/dataStore';
import { Activity, ShieldCheck, Clock, User } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const logs = dataStore.getActivityLogs();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <span>Administrative Audit & Security Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit trail recording administrative modifications across events, clubs, announcements, and privilege assignments.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Logged Operations ({logs.length})
          </span>
          <span className="text-slate-400">Chronological timestamp</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      {log.action}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                      log.target_type === 'admin'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                        : log.target_type === 'event'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : log.target_type === 'announcement'
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}>
                      {log.target_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1 font-mono text-indigo-300">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{log.actor_email}</span>
                    </span>
                    {log.target_id && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-slate-400">ID: {log.target_id.slice(0, 16)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
