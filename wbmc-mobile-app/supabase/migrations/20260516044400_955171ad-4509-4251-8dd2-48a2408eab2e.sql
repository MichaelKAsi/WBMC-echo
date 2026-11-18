
CREATE TABLE public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  cell_number text,
  work_number text,
  date_of_birth date,
  gender text,
  marital_status text,
  address text,
  city text,
  postal_code text,
  previous_church text,
  is_baptized boolean DEFAULT false,
  wants_baptism boolean DEFAULT false,
  spouse jsonb,
  family_members jsonb,
  serving_ministries jsonb,
  declaration boolean DEFAULT false,
  signature text,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'in_app',
  matched_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_membership_apps_email_lower ON public.membership_applications (lower(email));
CREATE INDEX idx_membership_apps_name_lower ON public.membership_applications (lower(full_name));

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
ON public.membership_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
ON public.membership_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
ON public.membership_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
ON public.membership_applications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_membership_apps_updated_at
BEFORE UPDATE ON public.membership_applications
FOR EACH ROW EXECUTE FUNCTION public.update_bible_notes_updated_at();

-- Function: when a profile is created/updated, auto-match against membership_applications by email
CREATE OR REPLACE FUNCTION public.auto_match_membership_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.membership_applications
    SET matched_user_id = NEW.user_id,
        status = 'approved',
        updated_at = now()
    WHERE matched_user_id IS NULL
      AND lower(email) = lower(NEW.email);

    IF FOUND THEN
      UPDATE public.profiles
      SET is_wbmc_member = true,
          membership_status = 'approved',
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_match_membership
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_match_membership_application();
