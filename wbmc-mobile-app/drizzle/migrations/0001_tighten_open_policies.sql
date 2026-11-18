
-- gallery_slides
DROP POLICY IF EXISTS "Anyone can delete gallery slides" ON public.gallery_slides;
DROP POLICY IF EXISTS "Anyone can insert gallery slides" ON public.gallery_slides;
DROP POLICY IF EXISTS "Anyone can view gallery slides" ON public.gallery_slides;
CREATE POLICY "View approved or own or admin gallery slides" ON public.gallery_slides FOR SELECT
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff can insert gallery slides" ON public.gallery_slides FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND (submitted_by IS NULL OR submitted_by = auth.uid()));
CREATE POLICY "Admins can delete gallery slides" ON public.gallery_slides FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- videos
DROP POLICY IF EXISTS "Anyone can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;
CREATE POLICY "View approved or own or admin videos" ON public.videos FOR SELECT
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff can insert videos" ON public.videos FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND (submitted_by IS NULL OR submitted_by = auth.uid()));
CREATE POLICY "Admins can delete videos" ON public.videos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- applications
DROP POLICY IF EXISTS "Anyone can submit a mentorship application" ON public.mentorship_applications;
CREATE POLICY "Submit own mentorship application" ON public.mentorship_applications FOR INSERT
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid())
    AND (matched_user_id IS NULL OR matched_user_id = auth.uid())
    AND status = 'pending');

DROP POLICY IF EXISTS "Anyone can submit application" ON public.membership_applications;
CREATE POLICY "Submit own membership application" ON public.membership_applications FOR INSERT
  WITH CHECK ((matched_user_id IS NULL OR matched_user_id = auth.uid())
    AND status <> 'approved');

-- likes / comments: signed-in only
DROP POLICY IF EXISTS "Anyone can view pastor post comments" ON public.pastor_post_comments;
CREATE POLICY "Signed-in users can view pastor post comments" ON public.pastor_post_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can view pastor post likes" ON public.pastor_post_likes;
CREATE POLICY "Signed-in users can view pastor post likes" ON public.pastor_post_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can view likes" ON public.video_likes;
CREATE POLICY "Signed-in users can view video likes" ON public.video_likes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can view comments" ON public.video_comments;
CREATE POLICY "Signed-in users can view video comments" ON public.video_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- storage
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
CREATE POLICY "Users upload own marketplace images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketplace-images' AND (storage.foldername(name))[1] = (select auth.uid()::text));

DROP POLICY IF EXISTS "Authenticated users can delete announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload announcement images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload gallery images" ON storage.objects;
CREATE POLICY "Staff upload announcement images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'announcement-images' AND owner_id = (select auth.uid()::text)
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
CREATE POLICY "Staff delete announcement images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'announcement-images' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Staff upload gallery images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery-images' AND owner_id = (select auth.uid()::text)
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
CREATE POLICY "Staff delete gallery images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery-images' AND (owner_id = (select auth.uid()::text) OR public.has_role(auth.uid(),'admin')));
