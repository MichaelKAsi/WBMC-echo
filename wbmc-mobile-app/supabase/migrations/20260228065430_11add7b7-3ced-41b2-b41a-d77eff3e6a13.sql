
-- Add status column to marketplace_items
ALTER TABLE public.marketplace_items ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Update existing items to approved
UPDATE public.marketplace_items SET status = 'approved';
