-- Fix story_contributions table access issues
-- This ensures proper RLS policies and field access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view story contributions" ON public.story_contributions;
DROP POLICY IF EXISTS "Users can create own contributions" ON public.story_contributions;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can view story contributions" ON public.story_contributions
  FOR SELECT USING (true);

CREATE POLICY "Users can create own contributions" ON public.story_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure the table has proper structure
ALTER TABLE public.story_contributions 
  ALTER COLUMN story_root_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN story_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_story_contributions_user_root 
  ON public.story_contributions(user_id, story_root_id);
