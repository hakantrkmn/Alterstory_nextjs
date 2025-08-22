-- Fix voting trigger with a dedicated function
-- This creates a separate function for voting to avoid conflicts with other triggers

-- Drop only the voting trigger (keep other triggers intact)
DROP TRIGGER IF EXISTS update_story_vote_counts ON public.story_votes;

-- Create a dedicated function for voting updates only
CREATE OR REPLACE FUNCTION update_story_vote_counts_only()
RETURNS TRIGGER AS $$
DECLARE
  target_story_id UUID;
  like_count_new INTEGER;
  dislike_count_new INTEGER;
BEGIN
  -- Get the story ID from either NEW or OLD record
  target_story_id := COALESCE(NEW.story_id, OLD.story_id);
  
  -- Calculate current vote counts using a single query for better performance
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'like'),
    COUNT(*) FILTER (WHERE vote_type = 'dislike')
  INTO like_count_new, dislike_count_new
  FROM public.story_votes 
  WHERE story_id = target_story_id;
  
  -- Update vote counts for the story
  UPDATE public.stories SET
    like_count = like_count_new,
    dislike_count = dislike_count_new,
    updated_at = NOW()
  WHERE id = target_story_id;
  
  RAISE NOTICE 'Updated vote counts for story %, likes: %, dislikes: %', 
    target_story_id, like_count_new, dislike_count_new;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the new voting trigger
CREATE TRIGGER update_story_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.story_votes
  FOR EACH ROW EXECUTE FUNCTION update_story_vote_counts_only();

-- Fix existing vote counts for all stories
UPDATE public.stories SET
  like_count = (
    SELECT COUNT(*) 
    FROM public.story_votes 
    WHERE story_id = stories.id AND vote_type = 'like'
  ),
  dislike_count = (
    SELECT COUNT(*) 
    FROM public.story_votes 
    WHERE story_id = stories.id AND vote_type = 'dislike'
  ),
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT story_id 
  FROM public.story_votes
);
