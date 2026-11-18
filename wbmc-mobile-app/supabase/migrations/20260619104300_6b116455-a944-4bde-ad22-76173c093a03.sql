
CREATE TABLE public.mentorship_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  bio TEXT,
  interests TEXT,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee', 'both')),
  avatar_url TEXT,
  max_mentees INTEGER,
  sessions_per_month INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_applications TO authenticated;
GRANT INSERT ON public.mentorship_applications TO anon;
GRANT ALL ON public.mentorship_applications TO service_role;

ALTER TABLE public.mentorship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a mentorship application"
  ON public.mentorship_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own mentorship application"
  ON public.mentorship_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentorship application"
  ON public.mentorship_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mentorship applications"
  ON public.mentorship_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all mentorship applications"
  ON public.mentorship_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentorship applications"
  ON public.mentorship_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_mentorship_applications_updated_at
  BEFORE UPDATE ON public.mentorship_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_bible_notes_updated_at();

-- Also flag the user's profile as wanting mentorship when they register
UPDATE public.profiles SET wants_mentorship = wants_mentorship;
