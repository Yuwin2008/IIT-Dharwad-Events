-- ==============================================================================
-- IIT DHARWAD CAMPUS EVENTS PORTAL
-- Comprehensive Supabase PostgreSQL Migration with Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create CLUBS Table
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL DEFAULT 'Technical',
    description TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create CLUB_ADMINS Table
CREATE TABLE IF NOT EXISTS public.club_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, club_id)
);

-- 5. Create EVENTS Table
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

-- 6. Create ANNOUNCEMENTS Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE, -- NULL indicates Campus-wide
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

-- 7. Create ACTIVITY_LOGS Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_admins_user ON public.club_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_club_admins_club ON public.club_admins(club_id);
CREATE INDEX IF NOT EXISTS idx_events_club ON public.events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_announcements_club ON public.announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs(actor_id);

-- 8. HELPER SECURITY DEFINER FUNCTIONS (Prevents RLS recursion)
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

CREATE OR REPLACE FUNCTION public.is_any_club_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.club_admins
    WHERE user_id = auth.uid()
  );
$$;

-- 9. AUTO-PROFILE TRIGGER ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate institutional domain
  IF NOT (NEW.email ILIKE '%@iitdh.ac.in') THEN
    RAISE EXCEPTION 'Only @iitdh.ac.in institutional emails are allowed.';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CLUBS Policies
CREATE POLICY "Clubs are viewable by everyone or authenticated"
  ON public.clubs FOR SELECT
  USING (true);

CREATE POLICY "Only Super Admin can insert clubs"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Only Super Admin can update clubs"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Only Super Admin can delete clubs"
  ON public.clubs FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- CLUB_ADMINS Policies
CREATE POLICY "Admins and Super Admin can view club admin assignments"
  ON public.club_admins FOR SELECT
  TO authenticated
  USING (public.is_super_admin() OR user_id = auth.uid());

CREATE POLICY "Only Super Admin can assign club admins"
  ON public.club_admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Only Super Admin can remove club admins"
  ON public.club_admins FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- EVENTS Policies
CREATE POLICY "Published events are viewable by all authenticated users"
  ON public.events FOR SELECT
  USING (status = 'Published' OR public.is_club_admin(club_id));

CREATE POLICY "Super Admin and assigned Club Admins can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_admin(club_id));

CREATE POLICY "Super Admin and assigned Club Admins can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

CREATE POLICY "Super Admin and assigned Club Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.is_club_admin(club_id));

-- ANNOUNCEMENTS Policies
CREATE POLICY "Published announcements are viewable by all"
  ON public.announcements FOR SELECT
  USING (
    status = 'Published'
    OR (club_id IS NOT NULL AND public.is_club_admin(club_id))
    OR (club_id IS NULL AND public.is_super_admin())
  );

CREATE POLICY "Club Admins can insert club announcements and Super Admin can insert all"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    (type = 'Campus-wide Announcement' AND public.is_super_admin())
    OR (type = 'Club Announcement' AND club_id IS NOT NULL AND public.is_club_admin(club_id))
  );

CREATE POLICY "Admins can update permitted announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    (club_id IS NULL AND public.is_super_admin())
    OR (club_id IS NOT NULL AND public.is_club_admin(club_id))
  )
  WITH CHECK (
    (club_id IS NULL AND public.is_super_admin())
    OR (club_id IS NOT NULL AND public.is_club_admin(club_id))
  );

CREATE POLICY "Admins can delete permitted announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    (club_id IS NULL AND public.is_super_admin())
    OR (club_id IS NOT NULL AND public.is_club_admin(club_id))
  );

-- ACTIVITY_LOGS Policies
CREATE POLICY "Only authorized admins can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_any_club_admin());

CREATE POLICY "Admins can record activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id AND public.is_any_club_admin());
