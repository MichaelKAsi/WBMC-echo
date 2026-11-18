
-- Auto-link mentorship applications to profiles and grant mentor/mentee roles

-- Backfill: link existing applications to profiles by email
UPDATE public.mentorship_applications ma
SET matched_user_id = p.user_id,
    user_id = COALESCE(ma.user_id, p.user_id),
    updated_at = now()
FROM public.profiles p
WHERE ma.matched_user_id IS NULL
  AND lower(p.email) = lower(ma.email);

-- Backfill: grant mentor/mentee roles for linked applications
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT ma.matched_user_id, 'mentor'::public.app_role
FROM public.mentorship_applications ma
WHERE ma.matched_user_id IS NOT NULL
  AND (ma.role = 'mentor' OR (ma.selected_both AND ma.role = 'both') OR ma.starting_role = 'mentor')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT ma.matched_user_id, 'mentee'::public.app_role
FROM public.mentorship_applications ma
WHERE ma.matched_user_id IS NOT NULL
  AND (ma.role = 'mentee' OR (ma.selected_both AND ma.role = 'both') OR ma.starting_role = 'mentee')
ON CONFLICT (user_id, role) DO NOTHING;

-- Helper: grant roles for a single application row
CREATE OR REPLACE FUNCTION public.grant_mentorship_roles(_user_id uuid, _role text, _starting_role text, _selected_both boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  IF _role = 'mentor' OR (_selected_both AND _role = 'both') OR _starting_role = 'mentor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentor'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  IF _role = 'mentee' OR (_selected_both AND _role = 'both') OR _starting_role = 'mentee' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentee'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Trigger fn: when a new profile is created, link any pending mentorship applications by email
CREATE OR REPLACE FUNCTION public.auto_match_mentorship_application_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app RECORD;
BEGIN
  IF NEW.email IS NULL THEN RETURN NEW; END IF;

  FOR app IN
    SELECT id, role, starting_role, selected_both
    FROM public.mentorship_applications
    WHERE matched_user_id IS NULL
      AND lower(email) = lower(NEW.email)
  LOOP
    UPDATE public.mentorship_applications
    SET matched_user_id = NEW.user_id,
        user_id = COALESCE(user_id, NEW.user_id),
        updated_at = now()
    WHERE id = app.id;

    PERFORM public.grant_mentorship_roles(NEW.user_id, app.role, app.starting_role, app.selected_both);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_match_mentorship_from_profile ON public.profiles;
CREATE TRIGGER trg_auto_match_mentorship_from_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_match_mentorship_application_from_profile();

-- Trigger fn: when a new mentorship application is submitted, link to existing profile by email + grant roles
CREATE OR REPLACE FUNCTION public.auto_link_mentorship_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched uuid;
BEGIN
  IF NEW.matched_user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT user_id INTO matched FROM public.profiles
    WHERE lower(email) = lower(NEW.email) LIMIT 1;

    IF matched IS NOT NULL THEN
      NEW.matched_user_id := matched;
      IF NEW.user_id IS NULL THEN NEW.user_id := matched; END IF;
    END IF;
  END IF;

  IF NEW.matched_user_id IS NOT NULL THEN
    PERFORM public.grant_mentorship_roles(NEW.matched_user_id, NEW.role, NEW.starting_role, NEW.selected_both);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_link_mentorship_application ON public.mentorship_applications;
CREATE TRIGGER trg_auto_link_mentorship_application
BEFORE INSERT ON public.mentorship_applications
FOR EACH ROW EXECUTE FUNCTION public.auto_link_mentorship_application();
