DROP TABLE IF EXISTS public.spotify_signals;
DROP TABLE IF EXISTS public.spotify_top_artists;
DROP TABLE IF EXISTS public.published_playlists;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS show_currently_playing,
  DROP COLUMN IF EXISTS show_top_artists,
  DROP COLUMN IF EXISTS show_playlists,
  DROP COLUMN IF EXISTS spotify_id,
  DROP COLUMN IF EXISTS spotify_url;
