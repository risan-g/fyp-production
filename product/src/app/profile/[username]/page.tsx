import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Key,
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
} from "react";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();
  const username = decodeURIComponent(params.username);

  const { data: profile } = await (await supabase)
    .from("profiles")
    .select("id, username, created_at")
    .ilike("username", username)
    .single();

  if (!profile) {
    return notFound();
  }

  const { data: reviews } = await (await supabase)
    .from("album_reviews")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16 border-b border-neutral-800 pb-12">
          <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center text-5xl font-bold text-neutral-500 mb-6 ring-4 ring-black">
            {profile.username[0].toUpperCase()}
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            @{profile.username}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs uppercase tracking-widest font-bold">
            <span>est. {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
