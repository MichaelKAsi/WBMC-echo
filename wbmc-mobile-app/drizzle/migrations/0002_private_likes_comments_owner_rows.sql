
DROP POLICY IF EXISTS "Signed-in users can view pastor post comments" ON public.pastor_post_comments;
DROP POLICY IF EXISTS "Signed-in users can view pastor post likes" ON public.pastor_post_likes;
DROP POLICY IF EXISTS "Signed-in users can view video likes" ON public.video_likes;
DROP POLICY IF EXISTS "Signed-in users can view video comments" ON public.video_comments;
CREATE POLICY "Users view own pastor post comments" ON public.pastor_post_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own pastor post likes" ON public.pastor_post_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own video likes" ON public.video_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own video comments" ON public.video_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_video_like_count(_video_id text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN 0 ELSE (SELECT count(*)::int FROM public.video_likes WHERE video_id = _video_id) END
$$;

CREATE OR REPLACE FUNCTION public.get_video_comments(_video_id text)
RETURNS TABLE(id uuid, video_id text, content text, user_name text, created_at timestamptz, user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.video_id, c.content, c.user_name, c.created_at,
         CASE WHEN c.user_id = auth.uid() THEN c.user_id ELSE NULL END
  FROM public.video_comments c
  WHERE c.video_id = _video_id AND auth.uid() IS NOT NULL
  ORDER BY c.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.get_pastor_post_stats(_post_ids uuid[])
RETURNS TABLE(post_id uuid, like_count integer, comment_count integer, liked_by_me boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    (SELECT count(*)::int FROM public.pastor_post_likes l WHERE l.post_id = p.id),
    (SELECT count(*)::int FROM public.pastor_post_comments c WHERE c.post_id = p.id),
    EXISTS (SELECT 1 FROM public.pastor_post_likes l WHERE l.post_id = p.id AND l.user_id = auth.uid())
  FROM unnest(_post_ids) AS p(id)
  WHERE auth.uid() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_pastor_post_comments(_post_id uuid)
RETURNS TABLE(id uuid, post_id uuid, content text, user_name text, created_at timestamptz, user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.post_id, c.content, c.user_name, c.created_at,
         CASE WHEN c.user_id = auth.uid() THEN c.user_id ELSE NULL END
  FROM public.pastor_post_comments c
  WHERE c.post_id = _post_id AND auth.uid() IS NOT NULL
  ORDER BY c.created_at ASC
$$;

REVOKE ALL ON FUNCTION public.get_video_like_count(text), public.get_video_comments(text), public.get_pastor_post_stats(uuid[]), public.get_pastor_post_comments(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_video_like_count(text), public.get_video_comments(text), public.get_pastor_post_stats(uuid[]), public.get_pastor_post_comments(uuid) TO authenticated;
