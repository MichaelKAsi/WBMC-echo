ALTER TABLE public.mentorship_applications
  ADD COLUMN IF NOT EXISTS selected_both boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starting_role text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS education_level text;