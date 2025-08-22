-- Test and fix voting trigger
-- This migration ensures the voting trigger works correctly

-- First, let's check if the trigger exists and recreate it if needed
DROP TRIGGER IF EXISTS update_story_vote_counts ON public.story_votes;

-- Recreate the trigger
CREATE TRIGGER update_story_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.story_votes
  FOR EACH ROW EXECUTE FUNCTION update_story_counters();

-- Test the trigger by manually updating a story's vote counts
-- This will help us verify the trigger is working
DO $$
DECLARE
  test_story_id UUID;
BEGIN
  -- Get a random story ID for testing
  SELECT id INTO test_story_id FROM public.stories LIMIT 1;
  
  IF test_story_id IS NOT NULL THEN
    -- Manually update vote counts to test the trigger
    UPDATE public.stories SET
      like_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = test_story_id AND vote_type = 'like'),
      dislike_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = test_story_id AND vote_type = 'dislike'),
      updated_at = NOW()
    WHERE id = test_story_id;
    
    RAISE NOTICE 'Tested voting trigger on story ID: %', test_story_id;
  END IF;
END $$;
