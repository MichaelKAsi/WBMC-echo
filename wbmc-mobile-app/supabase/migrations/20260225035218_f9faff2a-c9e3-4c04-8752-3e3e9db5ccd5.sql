
-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-images', 'marketplace-images', true);

-- Allow anyone to view marketplace images
CREATE POLICY "Public read access for marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

-- Allow authenticated users to upload marketplace images
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own marketplace images
CREATE POLICY "Users can delete own marketplace images"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);
