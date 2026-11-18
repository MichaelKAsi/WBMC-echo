
-- Add 'kids' to app_role enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'kids'
      AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'kids';
  END IF;
END$$;

-- Add parent contact fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_full_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS is_kids_account boolean NOT NULL DEFAULT false;

-- Update role trigger to assign 'kids' role when signup metadata flags it
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN COALESCE((NEW.raw_user_meta_data->>'is_kids_account')::boolean, false) THEN 'kids'::public.app_role
      ELSE 'general_user'::public.app_role
    END
  );
  RETURN NEW;
END;
$function$;

-- Update profile trigger to capture parent details + kids flag
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    mentorship_role,
    is_kids_account,
    parent_full_name,
    parent_email,
    parent_phone
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
    NULLIF(NEW.raw_user_meta_data->>'mentorship_role',''),
    COALESCE((NEW.raw_user_meta_data->>'is_kids_account')::boolean, false),
    NEW.raw_user_meta_data->>'parent_full_name',
    NEW.raw_user_meta_data->>'parent_email',
    NEW.raw_user_meta_data->>'parent_phone'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
