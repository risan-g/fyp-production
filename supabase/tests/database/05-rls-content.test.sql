BEGIN;
SELECT plan(13);

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000001', 'test1@local.test');
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-100000000002', 'test2@local.test');

-- Wall and post for context
INSERT INTO public.walls (id, spotify_artist_id) VALUES ('10000000-0000-0000-0000-200000000001', 'artist2_test');
INSERT INTO public.posts (id, wall_id, user_id, title, content) VALUES ('20000000-0000-0000-0000-200000000001', '10000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000002', 'Title', 'Content');

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-100000000001"}', true);

-- 1. Wall INSERT behaviour
SELECT results_eq(
    $$ INSERT INTO public.walls (spotify_artist_id) VALUES ('artist2') RETURNING spotify_artist_id $$,
    $$ VALUES ('artist2'::text) $$,
    'Authenticated users can create walls'
);

-- 2. Wall UPDATE/DELETE denial
SELECT results_eq(
    $$ UPDATE public.walls SET spotify_artist_id = 'hacked' WHERE spotify_artist_id = 'artist2_test' RETURNING spotify_artist_id $$,
    $$ VALUES ('hacked'::text) LIMIT 0 $$,
    'Walls UPDATE is denied'
);
SELECT results_eq(
    $$ DELETE FROM public.walls WHERE spotify_artist_id = 'artist2_test' RETURNING spotify_artist_id $$,
    $$ VALUES ('artist2_test'::text) LIMIT 0 $$,
    'Walls DELETE is denied'
);

-- 3. Post INSERT ownership
SELECT results_eq(
    $$ INSERT INTO public.posts (wall_id, user_id, title, content) VALUES ('10000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000001', 'T', 'C') RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can insert their own post'
);

-- 4. Post UPDATE denial
SELECT results_eq(
    $$ UPDATE public.posts SET title = 'Hacked' WHERE user_id = '00000000-0000-0000-0000-100000000001' RETURNING title $$,
    $$ VALUES ('Hacked'::text) LIMIT 0 $$,
    'Posts UPDATE is denied'
);

-- 5. Post DELETE ownership
SELECT results_eq(
    $$ DELETE FROM public.posts WHERE user_id = '00000000-0000-0000-0000-100000000001' RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can delete their own post'
);

-- 6. Comment INSERT ownership
SELECT results_eq(
    $$ INSERT INTO public.comments (id, post_id, user_id, content) VALUES ('30000000-0000-0000-0000-200000000001', '20000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-100000000001', 'C') RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can insert their own comment'
);

-- 7. Comment UPDATE ownership
SELECT results_eq(
    $$ UPDATE public.comments SET content = 'U' WHERE id = '30000000-0000-0000-0000-200000000001' RETURNING content $$,
    $$ VALUES ('U'::text) $$,
    'User can update their own comment'
);

-- 8. Comment DELETE ownership
SELECT results_eq(
    $$ DELETE FROM public.comments WHERE id = '30000000-0000-0000-0000-200000000001' RETURNING id $$,
    $$ VALUES ('30000000-0000-0000-0000-200000000001'::uuid) $$,
    'User can delete their own comment'
);

-- 9. Review INSERT ownership
SELECT results_eq(
    $$ INSERT INTO public.reviews (user_id, album_id, rating, album_name, artist_name, album_image_url) VALUES ('00000000-0000-0000-0000-100000000001', 'al', 10, 'an', 'arn', 'aim') RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can insert their own review'
);

-- 10. Review UPDATE ownership
SELECT results_eq(
    $$ UPDATE public.reviews SET rating = 20 WHERE user_id = '00000000-0000-0000-0000-100000000001' RETURNING rating $$,
    $$ VALUES (20::integer) $$,
    'User can update their own review'
);

-- 11. Vote INSERT ownership
SELECT results_eq(
    $$ INSERT INTO public.votes (user_id, post_id, vote_type) VALUES ('00000000-0000-0000-0000-100000000001', '20000000-0000-0000-0000-000000000001', 1) RETURNING user_id $$,
    $$ VALUES ('00000000-0000-0000-0000-100000000001'::uuid) $$,
    'User can insert their own vote'
);

-- 12. Vote UPDATE denial
SELECT results_eq(
    $$ UPDATE public.votes SET vote_type = -1 WHERE user_id = '00000000-0000-0000-0000-100000000001' RETURNING vote_type $$,
    $$ VALUES (-1::smallint) LIMIT 0 $$,
    'Votes UPDATE is denied'
);

SELECT * FROM finish();
ROLLBACK;
