// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null
