DROP POLICY IF EXISTS "Anyone can view marketplace items" ON public.marketplace_items;
CREATE POLICY "Authenticated users can view marketplace items"
ON public.marketplace_items
FOR SELECT
TO authenticated
USING (true);
REVOKE SELECT ON public.marketplace_items FROM anon;
GRANT SELECT ON public.marketplace_items TO authenticated;