-- Fix server-side trigger issues

-- Drop and recreate the trigger function with SECURITY DEFINER
DROP FUNCTION IF EXISTS update_story_counters() CASCADE;

CREATE OR REPLACE FUNCTION update_story_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update like/dislike counts
  IF TG_TABLE_NAME = 'story_votes' THEN
    UPDATE public.stories SET
      like_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND vote_type = 'like'),
      dislike_count = (SELECT COUNT(*) FROM public.story_votes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND vote_type = 'dislike'),
      updated_at = NOW()
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  END IF;

  -- Update comment count
  IF TG_TABLE_NAME = 'comments' THEN
    UPDATE public.stories SET
      comment_count = (SELECT COUNT(*) FROM public.comments WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)),
      updated_at = NOW()
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  END IF;

  -- Update continuation count for stories table operations
  IF TG_TABLE_NAME = 'stories' THEN
    -- Handle INSERT: update parent's continuation count
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
      UPDATE public.stories SET
        continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = NEW.parent_id),
        updated_at = NOW()
      WHERE id = NEW.parent_id;
    END IF;
    
    -- Handle UPDATE: update both old and new parent's continuation count
    IF TG_OP = 'UPDATE' THEN
      -- Update old parent's count if parent_id changed
      IF OLD.parent_id IS NOT NULL AND (OLD.parent_id != NEW.parent_id OR NEW.parent_id IS NULL) THEN
        UPDATE public.stories SET
          continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = OLD.parent_id),
          updated_at = NOW()
        WHERE id = OLD.parent_id;
      END IF;
      
      -- Update new parent's count
      IF NEW.parent_id IS NOT NULL AND (OLD.parent_id != NEW.parent_id OR OLD.parent_id IS NULL) THEN
        UPDATE public.stories SET
          continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = NEW.parent_id),
          updated_at = NOW()
        WHERE id = NEW.parent_id;
      END IF;
    END IF;
    
    -- Handle DELETE: update parent's continuation count
    IF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
      UPDATE public.stories SET
        continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = OLD.parent_id),
        updated_at = NOW()
      WHERE id = OLD.parent_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_story_continuation_counts ON public.stories;
CREATE TRIGGER update_story_continuation_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_story_counters();
