import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://numlejvshprzcwlyxgne.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_fvdRt4cbzcJv7s3aejRWPg_ugW48OPk';

export const SUPER_ADMIN_EMAIL = 'ec26bt032@iitdh.ac.in';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export const IITDH_EMAIL_REGEX = /^[a-z0-9._%+-]+@iitdh\.ac\.in$/;

export const normalizeEmail = (email: string): string => {
  return email ? email.trim().toLowerCase() : '';
};

export const isIITDHEmail = (email: string): boolean => {
  if (!email) return false;
  return IITDH_EMAIL_REGEX.test(normalizeEmail(email));
};
