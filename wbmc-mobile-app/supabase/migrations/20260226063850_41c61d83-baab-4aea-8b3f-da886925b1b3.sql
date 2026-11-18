
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;

-- Recreate as permissive policies
CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (true);
