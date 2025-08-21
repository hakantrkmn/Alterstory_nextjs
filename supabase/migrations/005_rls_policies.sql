-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Stories policies
CREATE POLICY "Anyone can read stories" ON public.stories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = author_id);

-- Story contributions policies
CREATE POLICY "Anyone can view story contributions" ON public.story_contributions
  FOR SELECT USING (true);

CREATE POLICY "Users can create own contributions" ON public.story_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Story votes policies
CREATE POLICY "Anyone can view story votes" ON public.story_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.story_votes
  FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Admin users policies (only accessible via functions)
CREATE POLICY "No direct access to admin users" ON public.admin_users
  FOR ALL USING (false);