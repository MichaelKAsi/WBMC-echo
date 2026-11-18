ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled_at ON public.announcements(scheduled_at);