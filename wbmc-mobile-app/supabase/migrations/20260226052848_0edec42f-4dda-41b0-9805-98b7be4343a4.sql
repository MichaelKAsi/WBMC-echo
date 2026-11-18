
-- Create gallery-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);

-- Allow anyone to view gallery images
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

-- Allow authenticated users to upload gallery images
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete gallery images
CREATE POLICY "Authenticated users can delete gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');
