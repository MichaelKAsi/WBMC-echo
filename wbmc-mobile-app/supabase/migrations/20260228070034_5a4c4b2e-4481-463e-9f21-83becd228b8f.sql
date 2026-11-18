
-- Allow admins to update marketplace items (for approval/rejection)
CREATE POLICY "Admins can update marketplace items"
ON public.marketplace_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
