-- Mirror Supabase Auth users into public.profiles for the admin panel.
-- Stores only operational profile data, never passwords or provider tokens.

CREATE OR REPLACE FUNCTION public.sync_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'user_name'
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(COALESCE(v_full_name, '')), ''),
    NULLIF(TRIM(COALESCE(v_avatar_url, '')), ''),
    'customer',
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = public.profiles.role,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_auth_user_profile_on_auth_users ON auth.users;
CREATE TRIGGER sync_auth_user_profile_on_auth_users
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_profile();

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  role,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(u.email, ''),
  NULLIF(TRIM(COALESCE(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'user_name',
    ''
  )), ''),
  NULLIF(TRIM(COALESCE(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture',
    ''
  )), ''),
  'customer',
  COALESCE(u.created_at, now()),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  role = public.profiles.role,
  updated_at = now();
