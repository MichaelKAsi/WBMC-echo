
GRANT SELECT, INSERT ON public.membership_applications TO authenticated;
GRANT INSERT ON public.membership_applications TO anon;
GRANT ALL ON public.membership_applications TO service_role;

CREATE POLICY "Users can view their own applications"
ON public.membership_applications
FOR SELECT
TO authenticated
USING (matched_user_id = auth.uid());
