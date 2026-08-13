"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas (module-private) ---
const userIdSchema = z.string().uuid("Invalid user ID.");

/**
 * Fetch "Sync Requests"
 */
export async function getSyncRequests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get IDs of everyone who follows the current user
  const { data: followers, error: followersError } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", user.id);

  if (followersError || !followers || followers.length === 0) return [];

  // Get IDs of everyone the current user follows
  const { data: following, error: followingError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followingError) return [];

  const myFollowingIds = new Set(following.map((f) => f.following_id));

  const pendingRequestIds = followers
    .map((f) => f.follower_id)
    .filter((id) => !myFollowingIds.has(id));

  // If there are no pending requests, stop here
  if (pendingRequestIds.length === 0) return [];

  // Get the profiles directly using the pending IDs
  // This completely bypasses the complex foreign key join that was crashing
  const { data: requests, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", pendingRequestIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  return requests;
}

/**
 * Decline a Sync Request
 * Action: Removes the target user from your followers list.
 * @param targetUserId The ID of the user who requested to follow you
 */
export async function declineSyncRequest(rawTargetUserId: string) {
  // 1. Validation
  const targetUserId = userIdSchema.parse(rawTargetUserId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  // Delete the specific row where THEY follow ME
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", targetUserId)
    .eq("following_id", user.id);

  if (error) {
    console.error("Error declining request:", error);
    return { success: false };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
