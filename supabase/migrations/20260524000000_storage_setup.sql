
-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, '{image/*}')
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up RLS policies for storage.objects
-- Allow public access to all avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
-- Note: The current implementation puts files in an 'avatars/' folder within the 'avatars' bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'avatars'
);

-- Allow users to update or delete their own avatars
-- The filename starts with user_id, so we check if the filename contains the user_id
CREATE POLICY "Users can update or delete own avatars"
ON storage.objects FOR ALL
USING ( 
    auth.role() = 'authenticated' AND 
    bucket_id = 'avatars' AND
    name LIKE 'avatars/' || auth.uid()::text || '%'
);
