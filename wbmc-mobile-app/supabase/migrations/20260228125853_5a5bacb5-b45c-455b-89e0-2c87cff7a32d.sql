-- Add mobile_images column to gallery_slides
ALTER TABLE public.gallery_slides
ADD COLUMN mobile_images text[] NOT NULL DEFAULT '{}'::text[];