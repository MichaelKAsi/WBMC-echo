-- Create marketplace_items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('services', 'products')),
  subcategory TEXT,
  image_url TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert marketplace items" 
ON public.marketplace_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete marketplace items" 
ON public.marketplace_items 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can update marketplace items" 
ON public.marketplace_items 
FOR UPDATE 
USING (true);