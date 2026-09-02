BEGIN;
SELECT plan(3);

-- Setup test users
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test1@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000002', 'test2@local.test');

-- 1. Anonymous / Public Reads
SET ROLE anon;
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.profiles WHERE id IN ('00000000-0000-0000-0000-100000000001', '00000000-0000-0000-0000-100000000002') $$,
    $$ VALUES (2::integer) $$,
    'Anonymous users can read all profiles'
);
RESET ROLE;

-- 2. Authenticated owner update behaviour
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000001"}', true);

SELECT results_eq(
    $$ UPDATE public.profiles SET bio = 'Valid Update' WHERE id = '00000000-0000-0000-0000-100000000001' RETURNING id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'Authenticated user can update their own profile'
);

-- 3. Authenticated non-owner rejection
SELECT results_eq(
    $$ UPDATE public.profiles SET bio = 'Hacked' WHERE id = '00000000-0000-0000-0000-100000000002' RETURNING id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000002'::uuid) LIMIT 0 $$,
    'Authenticated user cannot update another profile'
);

SELECT * FROM finish();
ROLLBACK;
