-- Fix continuation counts for all stories
-- This script updates the continuation_count field for all stories based on actual continuations

-- Update continuation counts for all parent stories
UPDATE public.stories 
SET continuation_count = (
  SELECT COUNT(*) 
  FROM public.stories AS continuations 
  WHERE continuations.parent_id = public.stories.id
),
updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT parent_id 
  FROM public.stories 
  WHERE parent_id IS NOT NULL
);

-- Also update root stories that have continuations
UPDATE public.stories 
SET continuation_count = (
  SELECT COUNT(*) 
  FROM public.stories AS continuations 
  WHERE continuations.story_root_id = public.stories.id 
  AND continuations.level > 0
),
updated_at = NOW()
WHERE level = 0 
AND story_root_id = id;
