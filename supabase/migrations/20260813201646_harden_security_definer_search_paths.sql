-- SEC-01E: Harden SECURITY DEFINER search paths

CREATE OR REPLACE FUNCTION public.get_sync_count(target_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT count(*)::integer
  FROM public.follows f1
  WHERE f1.follower_id = target_user_id
    AND f1.is_approved = true
    AND EXISTS (
      SELECT 1
      FROM public.follows f2
      WHERE f2.follower_id = f1.following_id
        AND f2.following_id = target_user_id
        AND f2.is_approved = true
    );
$function$;

ALTER FUNCTION public.handle_new_user()
SET search_path = '';