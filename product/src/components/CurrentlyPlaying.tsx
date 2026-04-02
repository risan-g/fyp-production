"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CurrentlyPlaying() {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getSpotifyTrack() {
      try {
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getSpotifyTrack();
    const interval = setInterval(getSpotifyTrack, 30000); // poll time. (30 secs).
    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) return null;
  if (!track || !track.item) return null;

  return (
    <div className="w-full border-2 border-black p-3 font-mono text-[10px] my-4 bg-gray-50">
      <div className="font-bold uppercase">
        <span className="text-green-500">NOW PLAYING ON SPOTIFY:</span> {track.item.name} - {track.item.artists[0].name}
      </div>
    </div>
  );
}
