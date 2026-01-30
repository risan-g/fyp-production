"use server";

import { createClient } from "@/lib/supabase/server";

// Batch size for the Infinite Scroll.
const PAGE_SIZE = 10;

/**
 * Fetch a page of artists for the Rotation list.
 *
 */
export async function getRotationList(userId: string, page: number = 0) {
  const supabase = await createClient();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Get the list of artists this user follows
  const { data: artists, error } = await supabase
    .from("artist_follows")
    .select("spotify_artist_id, artist_name, artist_image_url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching rotation:", error);
    return [];
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let myFollowsSet = new Set<string>();

  if (currentUser && artists.length > 0) {
    // Extract IDs from the fetched page to scope our check
    const artistIds = artists.map((a) => a.spotify_artist_id);

    const { data: myFollows } = await supabase
      .from("artist_follows")
      .select("spotify_artist_id")
      .eq("user_id", currentUser.id)
      .in("spotify_artist_id", artistIds);

    if (myFollows) {
      myFollows.forEach((f) => myFollowsSet.add(f.spotify_artist_id));
    }
  }

  // Combine the Artist Data with the Relationship Context
  return artists.map((artist) => ({
    ...artist,
    // Flag used by <RotationButton /> to determine initial state
    is_in_my_rotation: myFollowsSet.has(artist.spotify_artist_id),
  }));
}

/**
 * Fetch a page of users for the Sync list.
 */
export async function getSyncList(userId: string, page: number = 0) {
  const supabase = await createClient();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch the people the target user follows
  const { data: follows, error } = await supabase
    .from("follows")
    .select(
      `
      following_id,
      profiles!follows_following_id_fkey (
        id,
        username,
        avatar_url
      )
    `,
    )
    .eq("follower_id", userId)
    .range(from, to);

  if (error) {
    console.error("Error fetching syncs:", error);
    return [];
  }

  const syncs = follows.map((f: any) => f.profiles);

  // 2. Check if user is syncing with these people?
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  let mySyncsSet = new Set<string>();

  if (currentUser && syncs.length > 0) {
    const syncIds = syncs.map((s: any) => s.id);

    const { data: mySyncs } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", syncIds);

    if (mySyncs) {
      mySyncs.forEach((s) => mySyncsSet.add(s.following_id));
    }
  }

  // Merge and Return
  return syncs.map((profile: any) => ({
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    // Do I follow this person? (Used for <SyncButton /> state)
    is_synced: mySyncsSet.has(profile.id),
    // Prevents showing a 'Follow' button for yourself
    is_me: currentUser?.id === profile.id,
  }));
}
