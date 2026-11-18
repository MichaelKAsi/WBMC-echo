
-- Add status column to content tables for approval workflow
ALTER TABLE public.announcements ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.gallery_slides ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.videos ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add submitted_by to track who added content
ALTER TABLE public.announcements ADD COLUMN submitted_by UUID;
ALTER TABLE public.gallery_slides ADD COLUMN submitted_by UUID;
ALTER TABLE public.videos ADD COLUMN submitted_by UUID;
