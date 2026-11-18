-- Replace pastor_posts delete/update policies to allow admins as well
DROP POLICY IF EXISTS "Pastors can delete own posts" ON public.pastor_posts;
DROP POLICY IF EXISTS "Pastors can update own posts" ON public.pastor_posts;

CREATE POLICY "Pastors and admins can delete posts"
ON public.pastor_posts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_role(auth.uid(), 'pastor'::app_role))
);

CREATE POLICY "Pastors and admins can update posts"
ON public.pastor_posts
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = user_id AND has_role(auth.uid(), 'pastor'::app_role))
);

-- Cascade delete likes and comments when a pastor post is removed
ALTER TABLE public.pastor_post_likes
  DROP CONSTRAINT IF EXISTS pastor_post_likes_post_id_fkey;
ALTER TABLE public.pastor_post_likes
  ADD CONSTRAINT pastor_post_likes_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.pastor_posts(id) ON DELETE CASCADE;

ALTER TABLE public.pastor_post_comments
  DROP CONSTRAINT IF EXISTS pastor_post_comments_post_id_fkey;
ALTER TABLE public.pastor_post_comments
  ADD CONSTRAINT pastor_post_comments_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.pastor_posts(id) ON DELETE CASCADE;