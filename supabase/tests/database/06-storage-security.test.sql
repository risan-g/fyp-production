BEGIN;
SELECT plan(5);

-- 1. Avatars bucket is public-read and 5MiB, specific mime types
SELECT results_eq(
    $$ SELECT public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'avatars' $$,
    $$ VALUES (true, 5242880::bigint, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]) $$,
    'Avatars bucket configuration is correct'
);

-- Since pgTAP tests run as postgres superuser or we can set role, testing storage RLS directly requires manipulating auth.uid()
-- Let's test the existence of policies on storage.objects

-- 2. Authenticated users may insert into their own UUID-prefixed namespace
SELECT is(
    (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatar images are publicly accessible.' AND cmd = 'SELECT'),
    1::bigint,
    'Bucket is public-read (SELECT policy)'
);

-- 3. Insert Policy Check
SELECT is(
    (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own avatars.' AND cmd = 'INSERT' AND roles = '{authenticated}'),
    1::bigint,
    'Users can upload their own avatar policy exists'
);

-- 4. Update Policy Check
SELECT is(
    (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own avatar.' AND cmd = 'UPDATE' AND roles = '{authenticated}'),
    1::bigint,
    'Users can update their own avatar policy exists'
);

-- 5. Delete Policy Check (Should be 0 if not exists)
SELECT is(
    (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND cmd = 'DELETE' AND roles = '{authenticated}'),
    0::bigint,
    'Users cannot delete their own avatar (no policy)'
);

SELECT * FROM finish();
ROLLBACK;
