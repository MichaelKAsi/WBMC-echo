
-- Create building fund table
CREATE TABLE public.building_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_amount numeric NOT NULL DEFAULT 0,
  goal_amount numeric NOT NULL DEFAULT 1000000,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.building_fund ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can view building fund"
ON public.building_fund FOR SELECT
USING (true);

-- Only admins can update (for now allow authenticated users; will tighten later)
CREATE POLICY "Authenticated users can update building fund"
ON public.building_fund FOR UPDATE
TO authenticated
USING (true);

-- Seed with initial data
INSERT INTO public.building_fund (current_amount, goal_amount) VALUES (270000, 1000000);
