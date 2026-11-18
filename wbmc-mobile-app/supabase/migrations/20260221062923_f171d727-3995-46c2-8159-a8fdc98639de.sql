
-- Add user_id column to marketplace_items
ALTER TABLE public.marketplace_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can delete marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Anyone can insert marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Anyone can update marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Anyone can view marketplace items" ON public.marketplace_items;

-- Everyone can view
CREATE POLICY "Anyone can view marketplace items"
ON public.marketplace_items FOR SELECT
USING (true);

-- Authenticated users can insert their own items
CREATE POLICY "Authenticated users can insert own items"
ON public.marketplace_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own items
CREATE POLICY "Users can update own items"
ON public.marketplace_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own items
CREATE POLICY "Users can delete own items"
ON public.marketplace_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
