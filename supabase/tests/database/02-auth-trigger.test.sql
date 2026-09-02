BEGIN;
SELECT plan(5);

-- 1. Create a local auth user and check if profile is created via handle_new_user()
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test@local.test');
SELECT is(
    (SELECT count(*) FROM public.profiles WHERE id = '00000000-0000-0000-0000-100000000001'),
    1::bigint,
    'Profile should be auto-created by handle_new_user()'
);

-- 2. Deleting Auth user produces intended profile lifecycle (cascade delete)
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-100000000001';
SELECT is(
    (SELECT count(*) FROM public.profiles WHERE id = '00000000-0000-0000-0000-100000000001'),
    0::bigint,
    'Profile should be deleted when auth user is deleted'
);

-- 3. Anonymous users cannot perform protected profile mutations
SET ROLE anon;
PREPARE anon_update AS UPDATE public.profiles SET bio = 'Hacked' WHERE id = '00000000-0000-0000-0000-000000000001';
-- Wait, anon doesn't even have UPDATE grant on profiles. Or if they do, RLS blocks it.
-- Let's just check if it raises an error or affects 0 rows.
-- Actually, we can check policy or just attempt the update and check the result.
-- Let's use throws_ok if permission denied, or just check 0 rows updated.
-- To test rows updated in pgtap, we can check the table state.
SELECT results_eq(
    $$ UPDATE public.profiles SET bio = 'Hacked' WHERE id = '00000000-0000-0000-0000-000000000001' RETURNING 1 $$,
    $$ VALUES (1) LIMIT 0 $$,
    'Anon cannot update profiles'
);

-- 4. Authenticated users can update their own profile, but not others
RESET ROLE;
-- Setup test users
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000002', 'test2@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000003', 'test3@local.test');

-- Impersonate user 2
SET ROLE authenticated;
-- Supabase relies on auth.uid(), which reads from request.jwt.claims
-- We can mock this using set_config
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000002"}', true);

SELECT results_eq(
    $$ UPDATE public.profiles SET bio = 'Valid Update' WHERE id = '00000000-0000-0000-0000-100000000002' RETURNING id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000002'::uuid) $$,
    'Authenticated user can update their own profile'
);

SELECT results_eq(
    $$ UPDATE public.profiles SET bio = 'Hacked 3' WHERE id = '00000000-0000-0000-0000-100000000003' RETURNING id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000003'::uuid) LIMIT 0 $$,
    'Authenticated user cannot update another user profile'
);

SELECT * FROM finish();
ROLLBACK;
