-- Seed data for development and testing

-- Insert a default admin user (password: admin123)
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf')));

-- Note: User profiles will be created automatically via trigger when users sign up
-- Stories, votes, and comments will be created through the application interface