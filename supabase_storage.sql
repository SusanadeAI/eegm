-- ==========================================
-- EEMG STORAGE BUCKET SETUP
-- Run this in your Supabase SQL Editor to create the 'ministry-assets' bucket
-- ==========================================

-- 1. Insert the public bucket 'ministry-assets'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ministry-assets', 
    'ministry-assets', 
    true, 
    52428800, -- 50MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow the public to view/download gallery photos
DROP POLICY IF EXISTS "Public View Ministry Assets" ON storage.objects;
CREATE POLICY "Public View Ministry Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ministry-assets' );

-- 3. Allow authenticated admins to upload gallery photos
DROP POLICY IF EXISTS "Admin Upload Ministry Assets" ON storage.objects;
CREATE POLICY "Admin Upload Ministry Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'ministry-assets' );

-- 4. Allow authenticated admins to delete gallery photos
DROP POLICY IF EXISTS "Admin Delete Ministry Assets" ON storage.objects;
CREATE POLICY "Admin Delete Ministry Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'ministry-assets' );

-- 5. Allow authenticated admins to update/overwrite photos
DROP POLICY IF EXISTS "Admin Update Ministry Assets" ON storage.objects;
CREATE POLICY "Admin Update Ministry Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'ministry-assets' );
