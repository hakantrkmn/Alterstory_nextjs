-- Trigger function to create notification when someone comments on a story
CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  story_author_id UUID;
  commenter_name TEXT;
  story_title TEXT;
BEGIN
  -- Don't create notification if user is commenting on their own story
  IF NEW.user_id = (
    SELECT author_id FROM public.stories WHERE id = NEW.story_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Get story author ID and title
  SELECT author_id, title INTO story_author_id, story_title
  FROM public.stories 
  WHERE id = NEW.story_id;

  -- Get commenter's display name
  SELECT display_name INTO commenter_name
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Create notification for story author
  PERFORM create_notification(
    story_author_id,
    'comment',
    'New comment on your story',
    commenter_name || ' commented on your story "' || story_title || '"',
    jsonb_build_object(
      'story_id', NEW.story_id,
      'comment_id', NEW.id,
      'commenter_id', NEW.user_id,
      'commenter_name', commenter_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS comment_notification_trigger ON public.comments;
CREATE OR REPLACE FUNCTION handle_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
  commenter_name TEXT;
  story_title TEXT;
  mention_pattern TEXT;
  mentioned_username TEXT;
BEGIN
  -- Look for @username mentions in the comment
  mention_pattern := '@([a-zA-Z0-9_]+)';
  
  -- Find mentioned users and create notifications
  FOR mentioned_username IN
    SELECT (regexp_matches(NEW.content, mention_pattern, 'g'))[1]
  LOOP
    -- Get mentioned user ID
    SELECT id INTO mentioned_user_id
    FROM public.profiles 
    WHERE username = mentioned_username
    AND id != NEW.user_id;  -- Don't notify self-mentions
    
    -- If user found, create notification
    IF mentioned_user_id IS NOT NULL THEN
      -- Get commenter's display name
      SELECT display_name INTO commenter_name
      FROM public.profiles 
      WHERE id = NEW.user_id;

      -- Get story title
      SELECT title INTO story_title
      FROM public.stories 
      WHERE id = NEW.story_id;

      -- Create mention notification
      PERFORM create_notification(
        mentioned_user_id,
        'mention',
        'You were mentioned in a comment',
        commenter_name || ' mentioned you in a comment on "' || story_title || '"',
        jsonb_build_object(
          'story_id', NEW.story_id,
          'comment_id', NEW.id,
          'commenter_id', NEW.user_id,
          'commenter_name', commenter_name
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment mentions
DROP TRIGGER IF EXISTS comment_mention_trigger ON public.comments;
CREATE TRIGGER comment_mention_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_mentions();
