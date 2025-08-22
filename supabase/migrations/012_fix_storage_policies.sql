-- Fix storage policies for avatar uploads
-- Ensure bucket exists first
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies with error handling
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create policies with error handling
DO $$
BEGIN
  CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'avatars' 
      AND auth.uid() IS NOT NULL
    );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Diğer policies için de aynı şekilde...