set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_continuation_counts_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update continuation count for the parent story when a continuation is deleted
  IF OLD.parent_id IS NOT NULL THEN
    UPDATE public.stories SET
      continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = OLD.parent_id),
      updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;
  
  RETURN OLD;
END;
$function$
;


