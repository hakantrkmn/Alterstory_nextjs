-- Create indexes for better query performance

-- Stories table indexes
CREATE INDEX idx_stories_parent_id ON public.stories(parent_id);
CREATE INDEX idx_stories_story_root_id ON public.stories(story_root_id);
CREATE INDEX idx_stories_author_id ON public.stories(author_id);
CREATE INDEX idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX idx_stories_like_count ON public.stories(like_count DESC);
CREATE INDEX idx_stories_level_position ON public.stories(level, position);

-- Story contributions indexes
CREATE INDEX idx_story_contributions_user_story ON public.story_contributions(user_id, story_root_id);
CREATE INDEX idx_story_contributions_story_id ON public.story_contributions(story_id);
CREATE INDEX idx_story_contributions_user_id ON public.story_contributions(user_id);

-- Story votes indexes
CREATE INDEX idx_story_votes_story_user ON public.story_votes(story_id, user_id);
CREATE INDEX idx_story_votes_story_id ON public.story_votes(story_id);
CREATE INDEX idx_story_votes_user_id ON public.story_votes(user_id);

-- Comments indexes
CREATE INDEX idx_comments_story_id ON public.comments(story_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Profiles indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- Admin users indexes
CREATE INDEX idx_admin_users_username ON public.admin_users(username);
CREATE INDEX idx_admin_users_last_login ON public.admin_users(last_login DESC);