ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS birth_year;

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
    birth_date,
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
    NULLIF(NEW.raw_user_meta_data->>'birth_date','')::DATE,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE((NEW.raw_user_meta_data->>'is_wbmc_member')::BOOLEAN, false)
  );
  RETURN NEW;
END;
$function$;