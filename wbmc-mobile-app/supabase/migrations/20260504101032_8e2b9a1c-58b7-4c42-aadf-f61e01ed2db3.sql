-- Add new role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mentor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mentee';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'church_member';

-- Add developer application fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS developer_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS developer_reason text,
  ADD COLUMN IF NOT EXISTS developer_skills text,
  ADD COLUMN IF NOT EXISTS developer_applied_at timestamp with time zone;