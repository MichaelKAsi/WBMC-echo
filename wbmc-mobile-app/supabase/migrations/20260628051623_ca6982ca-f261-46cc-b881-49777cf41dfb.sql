CREATE OR REPLACE FUNCTION public.add_self_mentorship_role(_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _role NOT IN ('mentor'::public.app_role, 'mentee'::public.app_role, 'church_member'::public.app_role) THEN
    RAISE EXCEPTION 'Role not allowed via this function';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_self_mentorship_role(public.app_role) TO authenticated;