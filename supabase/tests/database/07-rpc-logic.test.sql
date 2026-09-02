BEGIN;
SELECT plan(8);

-- Setup test users
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test1@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000002', 'test2@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000003', 'test3@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000004', 'test4@local.test');
-- Create private profile for user 4
UPDATE public.profiles SET is_private = true WHERE id = '00000000-0000-0000-0000-100000000004';

-- 1. get_sync_count tests
-- No relationships
SELECT results_eq(
    $$ SELECT public.get_sync_count('00000000-0000-0000-0000-100000000001') $$,
    $$ VALUES (0::integer) $$,
    'No relationships yields 0 syncs'
);

-- One-way
INSERT INTO public.follows (follower_id, following_id, is_approved, status) VALUES ('00000000-0000-0000-0000-100000000001', '00000000-0000-0000-0000-100000000002', true, 'accepted');
SELECT results_eq(
    $$ SELECT public.get_sync_count('00000000-0000-0000-0000-100000000001') $$,
    $$ VALUES (0::integer) $$,
    'One-way relationship yields 0 syncs'
);

-- Reciprocal
INSERT INTO public.follows (follower_id, following_id, is_approved, status) VALUES ('00000000-0000-0000-0000-100000000002', '00000000-0000-0000-0000-100000000001', true, 'accepted');
SELECT results_eq(
    $$ SELECT public.get_sync_count('00000000-0000-0000-0000-100000000001') $$,
    $$ VALUES (1::integer) $$,
    'Reciprocal accepted relationship yields 1 sync'
);

-- Pending reciprocal (User 3 follows User 1 accepted, User 1 follows User 3 pending)
INSERT INTO public.follows (follower_id, following_id, is_approved, status) VALUES ('00000000-0000-0000-0000-100000000003', '00000000-0000-0000-0000-100000000001', true, 'accepted');
INSERT INTO public.follows (follower_id, following_id, is_approved, status) VALUES ('00000000-0000-0000-0000-100000000001', '00000000-0000-0000-0000-100000000003', false, 'pending');
SELECT results_eq(
    $$ SELECT public.get_sync_count('00000000-0000-0000-0000-100000000001') $$,
    $$ VALUES (1::integer) $$,
    'Pending reciprocal relationship does not count towards syncs'
);


-- Insert reviews
INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url, created_at) VALUES 
('00000000-0000-0000-0000-100000000001', 'album1', 100, 'A1', 'AR1', 'IMG1', now()), -- Inside window, public
('00000000-0000-0000-0000-100000000002', 'album1', 80, 'A1', 'AR1', 'IMG1', now()),  -- Inside window, public
('00000000-0000-0000-0000-100000000003', 'album2', 50, 'A2', 'AR2', 'IMG2', now() - interval '48 hours'), -- Outside window
('00000000-0000-0000-0000-100000000004', 'album3', 100, 'A3', 'AR3', 'IMG3', now()); -- Inside window, private profile

-- Check aggregation (album1 should have 2 reviews, average 90)
SELECT results_eq(
    $$ SELECT album_id, "logCount", average FROM public.get_hottest_albums(24) WHERE album_id = 'album1' $$,
    $$ VALUES ('album1'::text, 2::bigint, 90.0::numeric) $$,
    'Aggregation correctly counts reviews and averages ratings'
);

-- Check timeframe filtering (album2 should not be included)
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.get_hottest_albums(24) WHERE album_id = 'album2' $$,
    $$ VALUES (0::integer) $$,
    'Reviews outside timeframe are excluded'
);

-- Check private profile exclusion (album3 should not be included)
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.get_hottest_albums(24) WHERE album_id = 'album3' $$,
    $$ VALUES (0::integer) $$,
    'Private profiles are excluded from hottest albums'
);

-- Check empty dataset by isolating state
DELETE FROM public.reviews;
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.get_hottest_albums(24) $$,
    $$ VALUES (0::integer) $$,
    'Empty dataset yields 0 hottest albums'
);

SELECT * FROM finish();
ROLLBACK;
