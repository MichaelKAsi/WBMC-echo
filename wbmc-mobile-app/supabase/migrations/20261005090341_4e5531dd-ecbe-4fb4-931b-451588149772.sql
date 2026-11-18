ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_gallery_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_gallery_opt_in boolean NOT NULL DEFAULT false;

CREATE TABLE public.gallery_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id uuid NOT NULL UNIQUE,
  sms_count integer NOT NULL DEFAULT 0,
  email_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_notifications TO authenticated;
GRANT ALL ON public.gallery_notifications TO service_role;
ALTER TABLE public.gallery_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view gallery notifications" ON public.gallery_notifications
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));