
-- Create hymns table for Difela tsa Sione
CREATE TABLE public.hymns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hymn_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hymns ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view hymns"
ON public.hymns
FOR SELECT
USING (true);

-- Authenticated users can manage hymns
CREATE POLICY "Authenticated users can insert hymns"
ON public.hymns
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hymns"
ON public.hymns
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete hymns"
ON public.hymns
FOR DELETE
USING (true);

-- Add full text search index
CREATE INDEX idx_hymns_search ON public.hymns USING GIN (to_tsvector('simple', title || ' ' || lyrics));
CREATE INDEX idx_hymns_number ON public.hymns (hymn_number);
