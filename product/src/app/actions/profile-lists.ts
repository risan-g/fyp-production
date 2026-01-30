"use server";

import { createClient } from "@/lib/supabase/server";

// Batch size for the Infinite Scroll.
const PAGE_SIZE = 10;

/**
 * Fetch a page of artists for the Rotation list.
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

  // Get the connection IDs (Who is this user following?)
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .range(from, to);

  if (followsError) {
    console.error("Error fetching syncs:", followsError);
    return [];
  }

  if (!follows || follows.length === 0) return [];

  const followingIds = follows.map((f) => f.following_id);

  // Fetch the actual Profile Data
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", followingIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  // Check Relationship Context
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  let mySyncsSet = new Set<string>(); // I follow them
  let followersSet = new Set<string>(); // They follow me

  if (currentUser) {
    // Do I follow them?
    const { data: mySyncs } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUser.id)
      .in("following_id", followingIds);

    if (mySyncs) {
      mySyncs.forEach((s) => mySyncsSet.add(s.following_id));
    }

    // Do they follow me? (Critical for "SYNCED" vs "PENDING")
    const { data: theirSyncs } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", currentUser.id)
      .in("follower_id", followingIds);

    if (theirSyncs) {
      theirSyncs.forEach((s) => followersSet.add(s.follower_id));
    }
  }

  // Merge and Return
  return follows
    .map((f) => {
      const profile = profiles.find((p) => p.id === f.following_id);
      if (!profile) return null;

      return {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        // Do I follow this person? (Used for <SyncButton /> state)
        is_synced: mySyncsSet.has(profile.id),
        // Do they follow me? (Used to determine Sync vs Pending)
        is_following_me: followersSet.has(profile.id),
        // Prevents showing a 'Follow' button for yourself
        is_me: currentUser?.id === profile.id,
      };
    })
    .filter(Boolean);
}
