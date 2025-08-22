-- Fix voting trigger function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION update_story_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_story_id UUID;
  like_count_new INTEGER;
  dislike_count_new INTEGER;
BEGIN
  -- Get the story ID from either NEW or OLD record
  target_story_id := COALESCE(NEW.story_id, OLD.story_id);
  
  -- Calculate current vote counts
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'like'),
    COUNT(*) FILTER (WHERE vote_type = 'dislike')
  INTO like_count_new, dislike_count_new
  FROM public.story_votes 
  WHERE story_id = target_story_id;
  
  -- Update vote counts for the story (SECURITY DEFINER bypasses RLS)
  UPDATE public.stories SET
    like_count = like_count_new,
    dislike_count = dislike_count_new,
    updated_at = NOW()
  WHERE id = target_story_id;
  
  RAISE NOTICE 'Updated vote counts for story %, likes: %, dislikes: %', 
    target_story_id, like_count_new, dislike_count_new;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
