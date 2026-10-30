import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || (import.meta.env.VITE_SUPABASE_URL as string);
  const key = customKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.warn('Supabase initialization failed, falling back to local storage engine:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return Boolean(url && key && !url.includes('placeholder'));
}
