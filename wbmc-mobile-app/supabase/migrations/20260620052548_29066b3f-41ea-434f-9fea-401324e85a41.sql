
-- Allow authenticated users to view approved mentors (limited fields enforced in client query)
CREATE POLICY "Authenticated can view approved mentors"
ON public.mentorship_applications
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  AND (role = 'mentor' OR (selected_both = true AND starting_role = 'mentor'))
);

-- Connections table: a mentee requests to connect with a mentor
CREATE TABLE public.mentorship_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_user_id uuid NOT NULL,
  mentor_application_id uuid NOT NULL REFERENCES public.mentorship_applications(id) ON DELETE CASCADE,
  mentor_user_id uuid,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentee_user_id, mentor_application_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_connections TO authenticated;
GRANT ALL ON public.mentorship_connections TO service_role;

ALTER TABLE public.mentorship_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentee can view own connection requests"
ON public.mentorship_connections FOR SELECT TO authenticated
USING (auth.uid() = mentee_user_id);

CREATE POLICY "Mentor can view connections to them"
ON public.mentorship_connections FOR SELECT TO authenticated
USING (auth.uid() = mentor_user_id);

CREATE POLICY "Admins can view all connections"
ON public.mentorship_connections FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentee can create connection request"
ON public.mentorship_connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = mentee_user_id);

CREATE POLICY "Mentee can cancel own request"
ON public.mentorship_connections FOR DELETE TO authenticated
USING (auth.uid() = mentee_user_id);

CREATE POLICY "Mentor can update connection status"
ON public.mentorship_connections FOR UPDATE TO authenticated
USING (auth.uid() = mentor_user_id);

CREATE POLICY "Admins can update connections"
ON public.mentorship_connections FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mentorship_connections_updated_at
BEFORE UPDATE ON public.mentorship_connections
FOR EACH ROW EXECUTE FUNCTION public.update_bible_notes_updated_at();
