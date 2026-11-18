ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_mentorship boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentorship_role text;

-- Update trigger to read mentorship fields from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    first_name,
    last_name,
    birth_date,
    phone_number,
    is_wbmc_member,
    wants_mentorship,
    mentorship_role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE((NEW.raw_user_meta_data->>'is_wbmc_member')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'wants_mentorship')::boolean, false),
    NULLIF(NEW.raw_user_meta_data->>'mentorship_role','')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;