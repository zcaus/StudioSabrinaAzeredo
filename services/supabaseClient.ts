import { createClient } from '@supabase/supabase-js';

// Credenciais configuradas diretamente conforme solicitado
const SUPABASE_URL = "https://pmmlbjplbwjydppsmvlb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbWxianBsYndqeWRwcHNtdmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ1MjcsImV4cCI6MjA4MDQxMDUyN30.cMS-2eB0DPRS8bQHRMrEcTfJf77Qw61xV9DX5Ud3o0k";

export const getSupabase = () => {
  if (SUPABASE_URL && SUPABASE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return null;
};