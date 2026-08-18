-- SEC-01A/B: Harden avatars storage bucket

-- A. Replace broad INSERT policy with user-namespace policy
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;

CREATE POLICY "Users can upload their own avatars."
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '-%')
);

-- B. Harden UPDATE policy
-- A user may only target objects they own, and the resulting object name
-- must remain inside their own UUID-prefixed namespace.
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;

CREATE POLICY "Users can update their own avatar."
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() = owner
  AND name LIKE (auth.uid()::text || '-%')
);

-- C. Restrict avatar uploads at bucket level.
-- 5 MiB maximum; SVG and non-image content deliberately excluded.
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'avatars';