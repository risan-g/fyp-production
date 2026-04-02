"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CurrentlyPlaying({ targetUserId, isOwnProfile }: { targetUserId: string, isOwnProfile: boolean }) {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getTrack() {
      try {
        if (isOwnProfile) {
          // Fetch directly from Spotify for the owner (broadcaster mode)
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.provider_token;

          if (!token) {
            setLoading(false);
            return;
          }

          const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 200) {
            const data = await res.json();
            setTrack(data);
          } else {
            setTrack(null);
          }
        } else {
          // Fetch from the broadcast signal table (listener mode)
          const { data, error } = await supabase
            .from("spotify_signals")
            .select("*")
            .eq("user_id", targetUserId)
            .single();

          if (!error && data) {
            const lastUpdated = new Date(data.updated_at).getTime();
            const now = new Date().getTime();
            const fiveMinutes = 5 * 60 * 1000;

            if (now - lastUpdated < fiveMinutes && data.is_playing) {
              setTrack({
                item: {
                  name: data.track_name,
                  artists: [{ name: data.artist_name }]
                }
              });
            } else {
              setTrack(null);
            }
          } else {
            setTrack(null);
          }
        }
      } catch (err) {
        console.error("CurrentlyPlaying Error:", err);
      } finally {
        setLoading(false);
      }
    }

    getTrack();
    const interval = setInterval(getTrack, 30000);
    return () => clearInterval(interval);
  }, [supabase, isOwnProfile, targetUserId]);

  if (loading) return null;
  if (!track || !track.item) return null;

  return (
    <div className="w-full border-2 border-black p-3 font-mono text-[10px] my-4 bg-gray-50">
      <div className="font-bold uppercase">
        <span className="text-green-500">NOW PLAYING:</span> {track.item.name} - {track.item.artists[0].name}
      </div>
    </div>
  );
}
