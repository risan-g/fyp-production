"use server";

import { createClient } from "../../lib/supabase/server"; // Ensure this path matches your structure
import { revalidatePath } from "next/cache";

/**
 * Server Action: Toggle Follow Status.
 *
 * This function handles the "Sync" logic between two users.
 * It checks the current relationship status in the database and either:
 * 1. Creates a new connection (Follow) if none exists.
 * 2. Removes an existing connection (Unfollow) if one is found.
 *
 */
export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient();

  /**
   * Get Current Session
   * We verify the user is authenticated before allowing any social actions.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to sync.");
  }

  /**
   * Check Existing Relationship
   * Queries the 'follows' table to see if the current user is
   * already tracking the target user.
   */
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();

  if (existingFollow) {
    /**
     * Unfollow Logic
     * If a relationship row exists, we delete it to sever the connection.
     * This handles the "Unsync" action.
     */
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    if (error) throw new Error(error.message);
  } else {
    /**
     * Follow Logic
     * If no row exists, we insert a new record.
     * We dynamically decide if it's 'pending' or 'accepted' based on their privacy state.
     */
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", targetUserId)
      .single();

    const followStatus = targetProfile?.is_private ? "pending" : "accepted";

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
      status: followStatus,
    });

    if (error) throw new Error(error.message);
  }

  /**
   * Revalidate Cache
   */
  revalidatePath("/profile");
}
