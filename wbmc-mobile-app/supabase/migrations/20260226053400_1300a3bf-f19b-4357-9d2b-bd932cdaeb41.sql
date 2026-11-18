
-- Drop the restrictive update policy
DROP POLICY "Authenticated users can update building fund" ON public.building_fund;

-- Create a proper permissive update policy
CREATE POLICY "Authenticated users can update building fund"
ON public.building_fund
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
