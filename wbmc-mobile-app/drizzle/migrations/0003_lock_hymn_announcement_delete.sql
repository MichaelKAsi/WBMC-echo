
DROP POLICY IF EXISTS "Authenticated users can delete hymns" ON public.hymns;
CREATE POLICY "Staff can delete hymns" ON public.hymns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;
CREATE POLICY "Admins or submitting managers can delete announcements" ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'manager') AND submitted_by = auth.uid()));
