-- Validation script to check Supabase setup
-- Run this in the Supabase SQL editor to verify everything is set up correctly

-- Check if all tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check if all indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if storage bucket exists
SELECT 
  id,
  name,
  public
FROM storage.buckets;

-- Check if admin user exists
SELECT 
  username,
  created_at
FROM public.admin_users;

-- Test platform stats function
SELECT get_platform_stats();

-- Verify triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;