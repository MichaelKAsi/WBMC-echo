-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS is_wbmc_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS membership_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_application_data JSONB;

-- Update the new-user trigger function to capture new metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    first_name,
    last_name,
    birth_year,
    phone_number,
    is_wbmc_member
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'))
    ),
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(NEW.raw_user_meta_data->>'birth_year','')::INTEGER,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE((NEW.raw_user_meta_data->>'is_wbmc_member')::BOOLEAN, false)
  );
  RETURN NEW;
END;
$function$;