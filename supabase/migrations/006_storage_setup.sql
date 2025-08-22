-- Create storage bucket for avatars (with duplicate key check)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (with error handling for local development)
DO $$
BEGIN
  -- Try to create storage policies, ignore if they fail (local development)
  BEGIN
    CREATE POLICY "Users can upload own avatar" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid() IS NOT NULL
      );
  EXCEPTION WHEN OTHERS THEN
    -- Policy might already exist or storage not ready in local
    NULL;
  END;

  BEGIN
    CREATE POLICY "Users can update own avatar" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid() IS NOT NULL
      );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "Users can delete own avatar" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid() IS NOT NULL
      );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    CREATE POLICY "Anyone can view avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;