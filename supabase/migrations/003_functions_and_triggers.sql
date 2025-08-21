-- Function to update story counters
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

  -- Update continuation count when new story is added
  IF TG_TABLE_NAME = 'stories' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.stories SET
      continuation_count = (SELECT COUNT(*) FROM public.stories WHERE parent_id = NEW.parent_id),
      updated_at = NOW()
    WHERE id = NEW.parent_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Anonymous User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cascade delete user and all related data
CREATE OR REPLACE FUNCTION delete_user_cascade(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all user's stories (cascade will handle related data)
  DELETE FROM public.stories WHERE author_id = user_id_param;
  
  -- Delete user profile (cascade will handle auth.users)
  DELETE FROM public.profiles WHERE id = user_id_param;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cascade delete story and all its continuations
CREATE OR REPLACE FUNCTION delete_story_cascade(story_id_param UUID)
RETURNS VOID AS $$
DECLARE
  child_story RECORD;
BEGIN
  -- Recursively delete all child stories
  FOR child_story IN 
    SELECT id FROM public.stories WHERE parent_id = story_id_param
  LOOP
    PERFORM delete_story_cascade(child_story.id);
  END LOOP;
  
  -- Delete the story itself (cascade will handle votes, comments, contributions)
  DELETE FROM public.stories WHERE id = story_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_stories', (SELECT COUNT(*) FROM public.stories),
    'total_comments', (SELECT COUNT(*) FROM public.comments),
    'total_votes', (SELECT COUNT(*) FROM public.story_votes),
    'active_users_today', (
      SELECT COUNT(DISTINCT author_id) 
      FROM public.stories 
      WHERE created_at >= CURRENT_DATE
    ),
    'stories_created_today', (
      SELECT COUNT(*) 
      FROM public.stories 
      WHERE created_at >= CURRENT_DATE
    ),
    'root_stories', (SELECT COUNT(*) FROM public.stories WHERE parent_id IS NULL),
    'total_continuations', (SELECT COUNT(*) FROM public.stories WHERE parent_id IS NOT NULL)
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin login function
CREATE OR REPLACE FUNCTION admin_login(username_param VARCHAR, password_param VARCHAR)
RETURNS TABLE(id UUID, username VARCHAR, last_login TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  -- Update last login and return admin info if credentials are correct
  RETURN QUERY
  UPDATE public.admin_users 
  SET last_login = NOW()
  WHERE admin_users.username = username_param 
    AND admin_users.password_hash = crypt(password_param, admin_users.password_hash)
  RETURNING admin_users.id, admin_users.username, admin_users.last_login;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;