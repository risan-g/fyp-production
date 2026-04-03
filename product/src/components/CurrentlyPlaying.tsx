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

    async function fetchData() {
      try {
        let currentTrack = null;
        let isLive = false;
        if (isOwnProfile) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.provider_token;

          if (token) {
            const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 200) {
              const data = await res.json();
              if (data.item && data.is_playing) {
                currentTrack = data;
                isLive = true;
                setStatus(null);
              }
            } else if (res.status === 204) {
              setStatus("SPOTIFY ACTIVE: NOTHING PLAYING RIGHT NOW.");
            }
          } else {
            setStatus("SPOTIFY LINKED BUT SESSION EXPIRED. RE-LOGIN VIA SPOTIFY.");
          }
        }

        // If no live track found (or if not own profile), check database fallback
        if (!isLive) {
          const { data, error } = await supabase
            .from("spotify_signals")
            .select("*")
            .eq("user_id", targetUserId)
            .single();

          if (!error && data) {
            const updatedAt = new Date(data.updated_at);
            const now = new Date();
            // live:  if updated in the last 2 minutes and is_playing was true
            isLive = (now.getTime() - updatedAt.getTime()) < 120000 && data.is_playing;

            currentTrack = {
              item: {
                name: data.track_name,
                artists: [{ name: data.artist_name }]
              },
              is_live: isLive
            };
          }
        } else {
          currentTrack = {
            ...currentTrack,
            is_live: true
          };
        }

        setTrack(currentTrack);
      } catch (err) {
        console.error("CurrentlyPlaying Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [supabase, isOwnProfile, targetUserId, showCurrentlyPlaying]);

  if (loading) return null;
  if (!showCurrentlyPlaying) return null;

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
        {track.is_live ? (
          <span className="text-green-500">NOW PLAYING:</span>
        ) : (
          <span className="text-black/40">LAST PLAYED:</span>
        )}
        {" "}{track.item.name} - {track.item.artists[0].name}
      </div>
    </div>
  );
}
