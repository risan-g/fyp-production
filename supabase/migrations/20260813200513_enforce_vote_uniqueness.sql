-- SEC-01D: Enforce vote uniqueness at the database layer

-- Create unique index to enforce that a user can have at most one vote per post
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_post_unique_idx
ON public.votes (user_id, post_id)
WHERE post_id IS NOT NULL;

-- Create unique index to enforce that a user can have at most one vote per comment
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_comment_unique_idx
ON public.votes (user_id, comment_id)
WHERE comment_id IS NOT NULL;
