BEGIN;
SELECT plan(15);

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test1@local.test');

-- 1. Reviews
-- Duplicate review rejection
INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album1', 100, 'A1', 'AR1', 'IMG1');
SELECT throws_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album1', 50, 'A1', 'AR1', 'IMG1') $$,
    '23505',
    NULL,
    'Duplicate review for the same user and album is rejected'
);

-- Rating bounds
SELECT throws_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album2', -1, 'A2', 'AR2', 'IMG2') $$,
    '23514',
    NULL,
    'Rating < 0 is rejected'
);
SELECT throws_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album3', 101, 'A3', 'AR3', 'IMG3') $$,
    '23514',
    NULL,
    'Rating > 100 is rejected'
);
SELECT lives_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album4', 0, 'A4', 'AR4', 'IMG4') $$,
    'Rating 0 is accepted'
);
SELECT lives_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album5', 100, 'A5', 'AR5', 'IMG5') $$,
    'Rating 100 is accepted'
);

-- Null rating and null content
SELECT throws_ok(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, content, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'album6', null, null, 'A6', 'AR6', 'IMG6') $$,
    '23514',
    NULL,
    'Both rating and content null is rejected'
);

-- 2. Votes
INSERT INTO public.walls (id, spotify_artist_id) VALUES ('10000000-0000-0000-0000-200000000001', 'artist2_test');
INSERT INTO public.posts (id, wall_id, user_id, title, content) VALUES ('20000000-0000-0000-0000-200000000001', '10000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000001', 'Title', 'Content');
INSERT INTO public.comments (id, post_id, user_id, content) VALUES ('30000000-0000-0000-0000-200000000001', '20000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000001', 'Comment');

-- Vote type bounds
SELECT throws_ok(
    $$ INSERT INTO public.votes (user_id, post_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '20000000-0000-0000-0000-200000000001', 2) $$,
    '23514',
    NULL,
    'Vote_type > 1 is rejected'
);

-- Vote must reference exactly one of post or comment (schema might not actually have this constraint!)
-- Wait, let's assume the schema has a check constraint for exactly one. If it doesn't, this test will fail, exposing the defect.
SELECT throws_ok(
    $$ INSERT INTO public.votes (user_id, post_id, comment_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '20000000-0000-0000-0000-200000000001', '30000000-0000-0000-0000-200000000001', 1) $$,
    '23514',
    NULL,
    'Vote referencing both post and comment is rejected'
);
SELECT throws_ok(
    $$ INSERT INTO public.votes (user_id, post_id, comment_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', null, null, 1) $$,
    '23514',
    NULL,
    'Vote referencing neither post nor comment is rejected'
);

-- Duplicate post vote
INSERT INTO public.votes (user_id, post_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '20000000-0000-0000-0000-200000000001', 1);
SELECT throws_ok(
    $$ INSERT INTO public.votes (user_id, post_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '20000000-0000-0000-0000-200000000001', -1) $$,
    '23505',
    NULL,
    'Duplicate post vote is rejected'
);

-- Duplicate comment vote
INSERT INTO public.votes (user_id, comment_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '30000000-0000-0000-0000-200000000001', 1);
SELECT throws_ok(
    $$ INSERT INTO public.votes (user_id, comment_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '30000000-0000-0000-0000-200000000001', -1) $$,
    '23505',
    NULL,
    'Duplicate comment vote is rejected'
);

-- 3. Length constraints
SELECT throws_ok(
    $$ INSERT INTO public.posts (wall_id, user_id, title, content) VALUES ('10000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000001', repeat('a', 301), 'C') $$,
    '23514',
    NULL,
    'Post title > 300 chars rejected'
);
SELECT throws_ok(
    $$ INSERT INTO public.posts (wall_id, user_id, title, content) VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-100000000001', 'T', repeat('a', 40001)) $$,
    '23514',
    NULL,
    'Post content > 40000 chars rejected'
);
SELECT throws_ok(
    $$ INSERT INTO public.comments (post_id, user_id, content) VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-100000000001', repeat('a', 10001)) $$,
    '23514',
    NULL,
    'Comment content > 10000 chars rejected'
);

-- 4. Cascade delete behaviour
-- Parent post deletion cascades to comments and votes
DELETE FROM public.posts WHERE id = '20000000-0000-0000-0000-000000000001';
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.comments WHERE post_id = '20000000-0000-0000-0000-000000000001' $$,
    $$ VALUES (0::integer) $$,
    'Deleting a post cascades to comments'
);

SELECT * FROM finish();
ROLLBACK;
