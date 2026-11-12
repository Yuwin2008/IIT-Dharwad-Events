import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldCheck, ExternalLink } from 'lucide-react';
import { SUPABASE_URL } from '../../lib/supabase';

interface SqlMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlMigrationModal: React.FC<SqlMigrationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'migration' | 'seed'>('migration');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const migrationSql = `-- ==============================================================================
-- IIT DHARWAD CAMPUS EVENTS PORTAL
-- Supabase PostgreSQL Migration with Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL DEFAULT 'Technical',
    description TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CLUB_ADMINS
CREATE TABLE IF NOT EXISTS public.club_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, club_id)
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Technical',
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    venue TEXT NOT NULL DEFAULT 'To be announced',
    registration_url TEXT,
    registration_deadline TIMESTAMPTZ,
    poster_url TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Club Announcement' CHECK (type IN ('Club Announcement', 'Campus-wide Announcement')),
    external_url TEXT,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Published')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND lower(email) = 'ec26bt032@iitdh.ac.in'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(target_club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.club_admins
    WHERE user_id = auth.uid()
    AND club_id = target_club_id
  );
$$;

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs viewable by everyone" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Super Admin insert clubs" ON public.clubs FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "Events viewable if published or club admin" ON public.events FOR SELECT USING (status = 'Published' OR public.is_club_admin(club_id));
CREATE POLICY "Manage events by club admin" ON public.events FOR ALL USING (public.is_club_admin(club_id));`;

  const seedSql = `-- ==============================================================================
-- DATABASE SEED DATA (IIT Dharwad Technical, Cultural & Sports Clubs)
-- ==============================================================================

INSERT INTO public.clubs (name, domain, description, email)
VALUES
  -- Technical
  ('Electronics Club', 'Technical', 'Embedded systems, IoT, and PCB fabrication', 'electronicsclub@iitdh.ac.in'),
  ('InGene Motorsport', 'Technical', 'Formula student electric race car development', 'ingene@iitdh.ac.in'),
  ('Robotics Club', 'Technical', 'Autonomous mobile robotics, ROS2, and UAVs', 'robotics@iitdh.ac.in'),
  ('Abhikalpa Design Club', 'Technical', 'UI/UX, 3D modeling, and product design', 'abhikalpa.dc@iitdh.ac.in'),
  ('Coding Club', 'Technical', 'Competitive coding, open source, and hackathons', 'codingclub@iitdh.ac.in'),
  ('AI Club', 'Technical', 'Machine learning, NLP, and foundation models', 'aiclub@iitdh.ac.in'),
  ('Finance Club', 'Technical', 'Quantitative finance and algorithmic trading', 'finance.club@iitdh.ac.in'),
  ('Space Data Science Club', 'Technical', 'Satellite imagery and astrophysics data', 'space.ds.club@iitdh.ac.in'),

  -- Cultural
  ('Prabodhini Club', 'Cultural', 'Cultural heritage, traditional arts, and Indian languages', 'prabodhini.club@iitdh.ac.in'),
  ('UDGHOSH IITDh', 'Cultural', 'Official dramatics, theatre and street play society', 'dramatics@iitdh.ac.in'),
  ('Fine Arts Club', 'Cultural', 'Sketching, painting, digital art, and sculptures', 'finearts@iitdh.ac.in'),
  ('The Sapphire Dance Club', 'Cultural', 'Classical, contemporary, hip-hop, and fusion dance', 'sapphire.danceclub@iitdh.ac.in'),
  ('Music Club', 'Cultural', 'Acoustic, rock, classical and indie music ensembles', 'musicclub@iitdh.ac.in'),
  ('Quiz Club', 'Cultural', 'Trivia, general knowledge, sci-tech, and pop culture quizzing', 'quizclub@iitdh.ac.in'),
  ('| EUNOIA |', 'Cultural', 'Literary and debating society, poetry slams and MUNs', 'literaryclub@iitdh.ac.in'),
  ('Photography and Films Club', 'Cultural', 'Cinematography, documentary filmmaking and photography', 'paf@iitdh.ac.in'),

  -- Sports
  ('Football Club', 'Sports', 'Collegiate football team training and tournaments', 'footballclub@iitdh.ac.in'),
  ('Badminton Club', 'Sports', 'Indoor badminton coaching and collegiate leagues', 'badmintonclub@iitdh.ac.in'),
  ('Table-Tennis Club', 'Sports', 'Table tennis training, spin drills and tournaments', 'tabletennisclub@iitdh.ac.in'),
  ('Tennis Club', 'Sports', 'Hard-court tennis training and inter-collegiate events', 'tennisclub@iitdh.ac.in'),
  ('Cricket Club', 'Sports', 'Institute cricket team, leagues and net practice', 'cricketclub@iitdh.ac.in'),
  ('Volleyball Club', 'Sports', 'Volleyball court drills and championships', 'volleyballclub@iitdh.ac.in'),
  ('Chess Club', 'Sports', 'Rapid, blitz, classical chess and FIDE tournament prep', 'chessclub@iitdh.ac.in'),
  ('Hockey Club', 'Sports', 'Field hockey stick handling, tactics and training', 'hockeyclub@iitdh.ac.in'),
  ('Athletics Club', 'Sports', 'Track and field sprints, middle-distance and field sports', 'athleticsclub@iitdh.ac.in'),
  ('Basketball Club', 'Sports', 'Basketball squad drills, 3v3 and 5v5 tournaments', 'basketballclub@iitdh.ac.in'),
  ('Squash Club', 'Sports', 'Squash court coaching, fitness and tournaments', 'squashclub@iitdh.ac.in')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    email = EXCLUDED.email,
    domain = EXCLUDED.domain;`;

  const currentCode = activeTab === 'migration' ? migrationSql : seedSql;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Supabase PostgreSQL Setup
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Database Migration & RLS Script
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy this SQL into your Supabase Dashboard SQL Editor (<code className="text-indigo-300 font-mono">{SUPABASE_URL}</code>)
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('migration')}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === 'migration'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Schema & RLS Policies (migration.sql)
            </button>
            <button
              onClick={() => setActiveTab('seed')}
              className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === 'seed'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Seed Data (seed.sql)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="mb-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy SQL Script</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950/70">
          <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
            {currentCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Files also saved in <code className="text-slate-300">/supabase/migrations/</code> and <code className="text-slate-300">/supabase/seed.sql</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
