GRANT UPDATE ON public.gallery_slides TO authenticated;
GRANT UPDATE ON public.videos TO authenticated;
CREATE POLICY "Admins can update gallery slides" ON public.gallery_slides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update videos" ON public.videos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));