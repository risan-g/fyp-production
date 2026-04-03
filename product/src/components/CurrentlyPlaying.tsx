"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CurrentlyPlayingProps {
  targetUserId: string;
  isOwnProfile: boolean;
  showCurrentlyPlaying?: boolean;
}

export default function CurrentlyPlaying({ targetUserId, isOwnProfile, showCurrentlyPlaying = true }: CurrentlyPlayingProps) {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!showCurrentlyPlaying) {
      setLoading(false);
      return;
    }

    async function getTrack() {
      try {
        if (isOwnProfile) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.provider_token;

          if (!token) {
            setStatus("SPOTIFY LINKED BUT SESSION EXPIRED. RE-LOGIN VIA SPOTIFY.");
            setLoading(false);
            return;
          }

          const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 200) {
            const data = await res.json();
            setTrack(data);
            setStatus(null);
          } else if (res.status === 204) {
            setTrack(null);
            setStatus("SPOTIFY ACTIVE: NOTHING PLAYING RIGHT NOW.");
          } else {
            console.error("Spotify API Error:", res.status);
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
  }, [supabase, isOwnProfile, targetUserId, showCurrentlyPlaying]);

  if (loading) return null;
  if (!showCurrentlyPlaying) return null;

  // If nothing is playing, and it's the owner's profile, show a status if we have one
  if (!track || !track.item) {
    if (isOwnProfile && status) {
      return (
        <div className="w-full border-[2px] border-black/10 p-3 font-mono text-[9px] my-4 bg-neutral-50/50 text-black/40 uppercase tracking-widest text-center">
          {status}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-full border-2 border-black p-3 font-mono text-[10px] my-4 bg-gray-50">
      <div className="font-bold uppercase">
        <span className="text-green-500">NOW PLAYING:</span> {track.item.name} - {track.item.artists[0].name}
      </div>
    </div>
  );
}
