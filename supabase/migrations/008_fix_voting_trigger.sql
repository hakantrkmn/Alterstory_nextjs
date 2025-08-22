-- Fix the update_story_counters function to properly handle different table contexts
-- This prevents the "parent_id" field error when voting on stories

CREATE OR REPLACE FUNCTION update_story_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update like/dislike counts when votes change
  IF TG_TABLE_NAME = 'story_votes' THEN
    UPDATE public.stories SET
      like_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND vote_type = 'like'),
      dislike_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND vote_type = 'dislike'),
      updated_at = NOW()
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  END IF;

  -- Update comment count when comments change
  IF TG_TABLE_NAME = 'comments' THEN
    UPDATE public.stories SET
      comment_count = (SELECT COUNT(*) FROM public.comments WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)),
      updated_at = NOW()
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  END IF;

  -- Update continuation count when new story is added
  -- Only check parent_id if we're in the stories table context
  IF TG_TABLE_NAME = 'stories' THEN
    -- Check if NEW record exists and has parent_id field
    IF NEW IS NOT NULL AND NEW.parent_id IS NOT NULL THEN
      UPDATE public.stories SET
        continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = NEW.parent_id),
        updated_at = NOW()
      WHERE id = NEW.parent_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
