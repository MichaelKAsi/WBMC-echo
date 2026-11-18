
-- Add image_url column to announcements
ALTER TABLE public.announcements ADD COLUMN image_url text;

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-images', 'announcement-images', true);

-- Storage policies
CREATE POLICY "Anyone can view announcement images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated users can upload announcement images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated users can delete announcement images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcement-images');
