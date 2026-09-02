BEGIN;
SELECT plan(35);

-- 1. Tables exist
SELECT has_table('profiles'::name, 'profiles table should exist');
SELECT has_table('follows'::name, 'follows table should exist');
SELECT has_table('artist_follows'::name, 'artist_follows table should exist');
SELECT has_table('walls'::name, 'walls table should exist');
SELECT has_table('posts'::name, 'posts table should exist');
SELECT has_table('comments'::name, 'comments table should exist');
SELECT has_table('reviews'::name, 'reviews table should exist');
SELECT has_table('votes'::name, 'votes table should exist');

-- 2. Removed Spotify integration tables do not exist
SELECT hasnt_table('spotify_signals'::name, 'spotify_signals should not exist');
SELECT hasnt_table('spotify_top_artists'::name, 'spotify_top_artists should not exist');
SELECT hasnt_table('published_playlists'::name, 'published_playlists should not exist');

-- 3. Expected functions exist
SELECT has_function('public'::name, 'handle_new_user'::name, 'handle_new_user function should exist');
SELECT has_function('public'::name, 'get_sync_count'::name, ARRAY['uuid'::name], 'get_sync_count function should exist');
SELECT has_function('public'::name, 'get_hottest_albums'::name, ARRAY['integer'::name], 'get_hottest_albums function should exist');
SELECT has_function('public'::name, 'rls_auto_enable'::name, 'rls_auto_enable function should exist');

-- 4. Avatars bucket exists
SELECT is((SELECT count(*) FROM storage.buckets WHERE id = 'avatars'), 1::bigint, 'avatars bucket should exist');

-- 5. RLS is enabled on every expected public table
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles'), true, 'profiles RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'follows'), true, 'follows RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'artist_follows'), true, 'artist_follows RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'walls'), true, 'walls RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'posts'), true, 'posts RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'comments'), true, 'comments RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'reviews'), true, 'reviews RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE relname = 'votes'), true, 'votes RLS enabled');

-- 6. Required primary keys, foreign keys, unique constraints, and indexes
SELECT has_pk('profiles'::name, 'profiles pk exists');
SELECT has_pk('posts'::name, 'posts pk exists');
SELECT has_fk('public'::name, 'posts'::name, 'posts user_id is fk');
SELECT has_index('public'::name, 'walls'::name, 'walls_spotify_artist_id_key'::name, ARRAY['spotify_artist_id'::name], 'walls_spotify_artist_id_key exists'::text);
SELECT has_index('public'::name, 'artist_follows'::name, 'idx_artist_follows_spotify_id'::name, ARRAY['spotify_artist_id'::name], 'artist_follows index');

-- 7. Vote uniqueness constraints exist
SELECT has_index('public'::name, 'votes'::name, 'idx_unique_vote_post'::name, ARRAY['user_id'::name, 'post_id'::name], 'votes_user_post_idx exists');
SELECT has_index('public'::name, 'votes'::name, 'idx_unique_vote_comment'::name, ARRAY['user_id'::name, 'comment_id'::name], 'votes_user_comment_idx exists');

-- 8. Expected triggers exist
SELECT has_trigger('auth'::name, 'users'::name, 'on_auth_user_created'::name, 'on_auth_user_created exists');
SELECT is((SELECT count(*) FROM pg_event_trigger WHERE evtname = 'ensure_rls'), 1::bigint, 'ensure_rls event trigger exists');

-- 9. Security-definer functions have hardened search_path
SELECT is(
    (SELECT proconfig FROM pg_proc WHERE proname = 'handle_new_user'),
    ARRAY['search_path=""'],
    'handle_new_user has hardened search_path'
);
SELECT is(
    (SELECT proconfig FROM pg_proc WHERE proname = 'get_sync_count'),
    ARRAY['search_path=""'],
    'get_sync_count has no search_path hardened'
);

SELECT * FROM finish();
ROLLBACK;
