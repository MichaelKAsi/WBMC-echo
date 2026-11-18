
DROP POLICY IF EXISTS "Authenticated users can insert hymns" ON public.hymns;
DROP POLICY IF EXISTS "Authenticated users can update hymns" ON public.hymns;
CREATE POLICY "Staff can insert hymns" ON public.hymns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Staff can update hymns" ON public.hymns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
CREATE POLICY "Admins or managers can insert announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND submitted_by = auth.uid() AND status = 'pending'));
CREATE POLICY "Admins or submitting managers can update announcements" ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'manager') AND submitted_by = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'manager') AND submitted_by = auth.uid() AND status = 'pending'));
