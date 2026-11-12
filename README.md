# IIT DHARWAD CAMPUS EVENTS PORTAL

A production-ready, role-based Campus Events & Technical Clubs Portal built for the **Indian Institute of Technology Dharwad**.

---

## 1. Project Overview & Features

- **Institutional Authentication**: Email verification and sign-in restricted to `@iitdh.ac.in` domain accounts.
- **Dual Dashboards with RBAC**:
  - **Normal Dashboard (`/dashboard`)**: For all registered students to browse events, filter competitions, view club charters, and read campus announcements.
  - **Admin Dashboard (`/admin`)**: Restricted via server-side authorization and Supabase Row Level Security (RLS) to the Super Admin and officially assigned Club Admins.
- **Featured Event: VIBE-A-THON**:
  - Organized by Coding Club.
  - Full eligibility, submission rules (Submission deadline: 14 November 2026), and registration status (Registration closed on 9 November 2026).
- **Official Student Clubs Directory (27 Clubs across 3 Domains)**:
  - **Technical (8)**: Electronics Club, InGene Motorsport, Robotics Club, Abhikalpa Design Club, Coding Club, AI Club, Finance Club, Space Data Science Club.
  - **Cultural (8)**: Prabodhini Club, UDGHOSH IITDh, Fine Arts Club, The Sapphire Dance Club, Music Club, Quiz Club, | EUNOIA |, Photography and Films Club.
  - **Sports (11)**: Football Club, Badminton Club, Table-Tennis Club, Tennis Club, Cricket Club, Volleyball Club, Chess Club, Hockey Club, Athletics Club, Basketball Club, Squash Club.
- **Club Admin Assignment Engine**:
  - Super Admin can search registered accounts, assign administrators to one or more clubs, and revoke privileges with confirmation.
- **Auditing & Activity Logs**:
  - Immutable audit logs recording all event, club, announcement, and admin provisioning actions.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Database & Auth**: Supabase PostgreSQL, Supabase Authentication, Supabase Row Level Security (RLS)
- **Tooling**: Vite 8, ES2022

---

## 3. Environment Variables Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://numlejvshprzcwlyxgne.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_fvdRt4cbzcJv7s3aejRWPg_ugW48OPk"

# Next.js / Server Fallback Variables
NEXT_PUBLIC_SUPABASE_URL="https://numlejvshprzcwlyxgne.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_fvdRt4cbzcJv7s3aejRWPg_ugW48OPk"

# Designated Super Admin Email
VITE_SUPER_ADMIN_EMAIL="ec26bt032@iitdh.ac.in"
```

---

## 4. Database Setup & Supabase Migrations

The database migration and seed scripts are located in:
- `supabase/migrations/20261112_init_campus_portal.sql`
- `supabase/seed.sql`

### How to apply in your Supabase Dashboard:

1. Open your Supabase project: [https://supabase.com/dashboard/project/numlejvshprzcwlyxgne](https://supabase.com/dashboard/project/numlejvshprzcwlyxgne)
2. Navigate to the **SQL Editor** tab on the left menu.
3. Open `supabase/migrations/20261112_init_campus_portal.sql`, paste the contents into the SQL Editor, and click **Run**.
4. Open `supabase/seed.sql`, paste the contents, and click **Run**.
5. All tables (`profiles`, `clubs`, `club_admins`, `events`, `announcements`, `activity_logs`), indexes, triggers, and Row Level Security policies will be instantiated.

*(Note: The portal also contains an interactive Schema & SQL modal accessible from the footer or Admin Overview for 1-click clipboard copying).*

---

## 5. Super Admin Provisioning Instructions

The designated Super Admin email is:
`ec26bt032@iitdh.ac.in`

### Security Mechanism:
Super Admin privileges are NOT assigned by an unverified form checkbox or client flag.
In `supabase/migrations/20261112_init_campus_portal.sql`, the PostgreSQL function `public.is_super_admin()` verifies the authenticated UID against the trusted institutional email:

```sql
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
```

---

## 6. Row Level Security (RLS) Policy Documentation

- **`profiles`**:
  - `SELECT`: Allowed for all authenticated institutional users.
  - `UPDATE`: Enforces `auth.uid() = id`.
- **`clubs`**:
  - `SELECT`: Public / authenticated.
  - `INSERT / UPDATE / DELETE`: Only `is_super_admin()`.
- **`club_admins`**:
  - `SELECT`: `is_super_admin() OR user_id = auth.uid()`.
  - `INSERT / DELETE`: Only `is_super_admin()`.
- **`events`**:
  - `SELECT`: `status = 'Published' OR is_club_admin(club_id)`.
  - `INSERT / UPDATE / DELETE`: `is_club_admin(club_id)`.
- **`announcements`**:
  - `SELECT`: `status = 'Published' OR is_club_admin(club_id)`.
  - `INSERT / UPDATE / DELETE`: `is_super_admin()` for campus-wide, `is_club_admin(club_id)` for club announcements.
- **`activity_logs`**:
  - `SELECT`: Only administrators (`is_any_club_admin()`).
  - `INSERT`: Enforces `auth.uid() = actor_id`.

---

## 7. Test Accounts for Evaluation

Use the **Evaluation Role Switcher** bar at the top of the interface:

1. **Super Administrator**: `ec26bt032@iitdh.ac.in`
   - Access: Both dashboards, full club management, admin provisioning, campus-wide announcements.
2. **Club Administrator**: `coding_admin@iitdh.ac.in`
   - Access: Normal dashboard + Admin dashboard scoped strictly to Coding Club.
3. **Normal Student**: `student26@iitdh.ac.in`
   - Access: Normal dashboard only. Admin link is hidden; direct navigation to `/admin` results in HTTP 403 Unauthorized Access.

---

## 8. Local Development & Production Build

### Install dependencies:
```bash
npm install
```

### Start development server:
```bash
npm run dev
```
Accessible at `http://localhost:3000`.

### Type check and lint:
```bash
npm run lint
```

### Build for production:
```bash
npm run build
```
