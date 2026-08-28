import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public environment variables.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });
}

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
