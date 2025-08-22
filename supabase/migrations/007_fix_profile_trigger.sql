-- Fix profile creation trigger to work without email verification
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Email verification'dan bağımsız olarak profile oluştur
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Anonymous User')
  )
  ON CONFLICT (id) DO NOTHING; -- Eğer zaten varsa çakışmayı önle
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

