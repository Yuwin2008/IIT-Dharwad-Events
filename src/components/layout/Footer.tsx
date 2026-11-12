import React from 'react';
import { Mail, MapPin, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/supabase';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenSqlMigration?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSqlMigration }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Institute Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                IITDh
              </div>
              <div>
                <span className="font-bold text-white text-sm block">IIT Dharwad</span>
                <span className="text-[11px] text-slate-400">Campus Events Portal</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Unified institutional platform for technical clubs, workshops, hackathons, and campus activities at Indian Institute of Technology Dharwad.
            </p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Permanent Campus, Chikkamalligawad, Dharwad, Karnataka 580007</span>
            </div>
          </div>

          {/* Col 2: Fast Navigation */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Home Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/events')}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Campus Events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/clubs')}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Technical Clubs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/announcements')}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Announcements
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Student Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Clubs & Domains */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Clubs & Domains
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/clubs')}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-indigo-400 font-semibold">Technical:</span>
                  <span>Coding, Robotics, AI & 5 more</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/clubs')}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-purple-400 font-semibold">Cultural:</span>
                  <span>UDGHOSH, Music, EUNOIA & 5 more</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/clubs')}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-emerald-400 font-semibold">Sports:</span>
                  <span>Football, Cricket, Chess & 8 more</span>
                </button>
              </li>
              <li className="pt-1">
                <a href="mailto:events@iitdh.ac.in" className="text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>General: events@iitdh.ac.in</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Institute & Database Access */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Institutional Governance
            </h4>
            <p className="text-slate-400 text-xs mb-3">
              Role-Based Access Control enforced with Supabase RLS and institutional single sign-on.
            </p>
            <div className="space-y-2">
              <a
                href="https://www.iitdh.ac.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>iitdh.ac.in (Main Institute Portal)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {onOpenSqlMigration && (
                <button
                  onClick={onOpenSqlMigration}
                  className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View Supabase Schema & SQL</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 Indian Institute of Technology Dharwad. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Designated Super Admin: <code className="text-slate-300">{SUPER_ADMIN_EMAIL}</code></span>
            <span>·</span>
            <span>Campus Network v2026.11</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
