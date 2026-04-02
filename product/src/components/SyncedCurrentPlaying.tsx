"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * A headless component that runs in the NavBar. 
 * It periodically fetches Spotify playback status and "broadcasts" it to the Supabase database.
 */
export default function SyncedCurrentPlaying() {
  const supabase = createClient();
  const lastTrackRef = useRef<string | null>(null);

  useEffect(() => {
    async function syncStatus() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        const token = sessionData.session?.provider_token;

        if (!user || !token) return;

        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          const data = await res.json();
          const trackId = data.item?.id;

          if (trackId === lastTrackRef.current) return;

          await supabase.from("spotify_signals").upsert({
            user_id: user.id,
            track_name: data.item?.name,
            artist_name: data.item?.artists?.[0]?.name,
            is_playing: data.is_playing,
            updated_at: new Date().toISOString(),
          });

          lastTrackRef.current = trackId;
        }
      } catch (err) {
      }
    }

    const timer = setInterval(syncStatus, 30000);
    syncStatus();

    return () => clearInterval(timer);
  }, [supabase]);

  return null;
}
