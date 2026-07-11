import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/publicEnv";

const supabaseUrl = publicEnv.supabaseUrl;
const supabaseAnonKey = publicEnv.supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const supabaseNotConfiguredMessage = "Supabase no está configurado.";
