CREATE OR REPLACE FUNCTION public.get_hottest_albums(p_hours integer DEFAULT 24)
RETURNS TABLE (
  album_id text,
  name text,
  artist text,
  image text,
  "logCount" bigint,
  average numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT 
    r.album_id,
    (array_agg(r.album_name ORDER BY r.created_at DESC))[1] AS name,
    (array_agg(r.artist_name ORDER BY r.created_at DESC))[1] AS artist,
    (array_agg(r.album_image_url ORDER BY r.created_at DESC))[1] AS image,
    COUNT(*) AS "logCount",
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE p.is_private = false
    AND (p_hours IS NULL OR r.created_at >= (now() - make_interval(hours => p_hours)))
  GROUP BY r.album_id
  ORDER BY "logCount" DESC, average DESC, r.album_id ASC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.get_hottest_albums(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_hottest_albums(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hottest_albums(integer) TO service_role;
