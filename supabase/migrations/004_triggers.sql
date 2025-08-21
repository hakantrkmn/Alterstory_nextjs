-- Create triggers

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updating story counters
CREATE TRIGGER update_story_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.story_votes
  FOR EACH ROW EXECUTE FUNCTION update_story_counters();

CREATE TRIGGER update_story_comment_counts
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_story_counters();

CREATE TRIGGER update_story_continuation_counts
  AFTER INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_story_counters();

-- Triggers for updating updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_votes_updated_at
  BEFORE UPDATE ON public.story_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();