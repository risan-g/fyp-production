BEGIN;
SELECT plan(6);

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test1@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000002', 'test2@local.test');

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000001"}', true);

-- 1. Follower-owned creation
SELECT results_eq(
    $$ INSERT INTO public.follows (follower_id, following_id) VALUES ('00000000-0000-0000-0000-100000000001', '00000000-0000-0000-0000-100000000002') RETURNING follower_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can create a follow where they are the follower'
);

-- 2. Follower-owned deletion
SELECT results_eq(
    $$ DELETE FROM public.follows WHERE follower_id = '00000000-0000-0000-0000-100000000001' AND following_id = '00000000-0000-0000-0000-100000000002' RETURNING follower_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can delete their own outgoing follow'
);

-- 3. Cannot assign another user as owner
SELECT throws_ok(
    $$ INSERT INTO public.follows (follower_id, following_id) VALUES ('00000000-0000-0000-0000-100000000002', '00000000-0000-0000-0000-100000000001') $$,
    '42501',
    NULL,
    'User cannot create a follow where they are not the follower'
);

-- 4. Followee decline behaviour
-- Setup pending follow from 2 -> 1
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000002"}', true);
INSERT INTO public.follows (follower_id, following_id, status) VALUES ('00000000-0000-0000-0000-100000000002', '00000000-0000-0000-0000-100000000001', 'pending');
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000001"}', true);
SELECT results_eq(
    $$ DELETE FROM public.follows WHERE follower_id = '00000000-0000-0000-0000-100000000002' AND following_id = '00000000-0000-0000-0000-100000000001' RETURNING follower_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000002'::uuid) $$,
    'User can decline/delete an incoming follow'
);

-- 5. artist_follows ownership creation
SELECT results_eq(
    $$ INSERT INTO public.artist_follows (user_id, spotify_artist_id, artist_name) VALUES ('00000000-0000-0000-0000-100000000001', 'artist1', 'Artist') RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can add an artist follow for themselves'
);

-- 6. artist_follows non-owner denial
SELECT throws_ok(
    $$ INSERT INTO public.artist_follows (user_id, spotify_artist_id, artist_name) VALUES ('00000000-0000-0000-0000-100000000002', 'artist1', 'Artist') $$,
    '42501',
    NULL,
    'User cannot add an artist follow for someone else'
);

SELECT * FROM finish();
ROLLBACK;
