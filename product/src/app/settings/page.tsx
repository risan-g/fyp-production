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
    .select("id, is_private, username, avatar_url, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="bg-background text-black min-h-screen pt-24 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col pt-12">
        <h1 className="text-6xl font-serif font-black uppercase tracking-tighter mb-12 border-b-[4px] border-black pb-6">
          &quot;SETTINGS&quot;
        </h1>
        <SettingsClient
          userId={profile?.id || ""}
          initialUsername={profile?.username || ""}
          initialEmail={user.email || ""}
          initialAvatarUrl={profile?.avatar_url || null}
          initialPrivacy={profile?.is_private ?? false}
          initialBio={profile?.bio || ""}
        />
      </div>
    </main>
  );
}
