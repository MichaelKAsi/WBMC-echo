
ALTER TABLE public.announcements
ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
