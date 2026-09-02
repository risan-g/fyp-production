-- supabase/seed.sql

-- Auth Users
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'user1@local.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"user1"}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'user2@local.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"user2"}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'user3@local.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"user3"}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'user4@local.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"user4"}', now(), now(), '', '', '', '');

INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub":"00000000-0000-0000-0000-000000000001","email":"user1@local.test"}', 'email', now(), now(), now(), gen_random_uuid()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub":"00000000-0000-0000-0000-000000000002","email":"user2@local.test"}', 'email', now(), now(), now(), gen_random_uuid()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{"sub":"00000000-0000-0000-0000-000000000003","email":"user3@local.test"}', 'email', now(), now(), now(), gen_random_uuid()),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{"sub":"00000000-0000-0000-0000-000000000004","email":"user4@local.test"}', 'email', now(), now(), now(), gen_random_uuid());

-- Update Profiles (created by trigger)
UPDATE public.profiles SET bio = 'User 1 Bio', avatar_url = 'avatar1.png' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET bio = 'User 2 Bio' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET bio = 'User 3 Bio' WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET is_private = true, bio = 'Private User' WHERE id = '00000000-0000-0000-0000-000000000004';

-- Social Graph (follows)
INSERT INTO public.follows (follower_id, following_id, is_approved, status) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', true, 'accepted'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', true, 'accepted'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', true, 'accepted'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', false, 'pending');

-- Rotations (artist_follows)
INSERT INTO public.artist_follows (user_id, spotify_artist_id, artist_name, artist_image_url) VALUES
('00000000-0000-0000-0000-000000000001', '3TVXtAsR1Inumwj472S9r4', 'Artist A', 'url1'),
('00000000-0000-0000-0000-000000000002', '3TVXtAsR1Inumwj472S9r4', 'Artist A', 'url1');

-- Walls
INSERT INTO public.walls (id, spotify_artist_id) VALUES
('10000000-0000-0000-0000-000000000001', '3TVXtAsR1Inumwj472S9r4');

-- Posts
INSERT INTO public.posts (id, wall_id, user_id, title, content) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Post 1', 'Content 1');

-- Comments
INSERT INTO public.comments (id, post_id, user_id, parent_id, content) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', null, 'Comment 1 on Post 1'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Reply to Comment 1');

-- Votes
INSERT INTO public.votes (user_id, post_id, comment_id, vote_type) VALUES
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', null, 1),
('00000000-0000-0000-0000-000000000001', null, '30000000-0000-0000-0000-000000000001', -1);

-- Reviews
INSERT INTO public.reviews (user_id, album_id, rating, content, album_name, artist_name, album_image_url, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'album-id-1', 90, null, 'Album A', 'Artist A', 'url', now(), now()),
('00000000-0000-0000-0000-000000000002', 'album-id-1', null, 'Great content!', 'Album A', 'Artist A', 'url', now(), now()),
('00000000-0000-0000-0000-000000000003', 'album-id-1', 80, 'Old review', 'Album A', 'Artist A', 'url', now() - interval '48 hours', now() - interval '48 hours'),
('00000000-0000-0000-0000-000000000004', 'album-id-1', 100, null, 'Album A', 'Artist A', 'url', now(), now());
