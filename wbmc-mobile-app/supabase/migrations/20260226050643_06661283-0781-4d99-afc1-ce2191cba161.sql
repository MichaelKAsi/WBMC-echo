
-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('announcement', 'reminder')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (true);
