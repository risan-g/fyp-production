import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_private, username, avatar_url, show_currently_playing")
    .eq("id", user.id)
    .single();

  const { data: identitiesData } = await supabase.auth.getUserIdentities();
  const spotifyIdentity = identitiesData?.identities?.find(id => id.provider === "spotify");
  const isSpotifyLinked = !!spotifyIdentity;
  const spotifyUsername = spotifyIdentity?.identity_data?.preferred_username || spotifyIdentity?.identity_data?.name || null;
  const spotifyEmail = spotifyIdentity?.identity_data?.email || null;

  return (
    <main className="bg-background text-black min-h-screen pt-24 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col pt-12">
        <h1 className="text-6xl font-serif font-black uppercase tracking-tighter mb-12 border-b-[4px] border-black pb-6">
          "SETTINGS"
        </h1>
        <SettingsClient
          userId={profile?.id || ""}
          initialUsername={profile?.username || ""}
          initialEmail={user.email || ""}
          initialAvatarUrl={profile?.avatar_url || null}
          initialPrivacy={profile?.is_private ?? false}
          isSpotifyLinked={isSpotifyLinked}
          initialSpotifyUsername={spotifyUsername}
          initialSpotifyEmail={spotifyEmail}
          initialShowCurrentlyPlaying={profile?.show_currently_playing ?? true}
        />
      </div>
    </main>
  );
}
