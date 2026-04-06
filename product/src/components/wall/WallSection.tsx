import { createClient } from "@/lib/supabase/server";
import CreatePostForm from "./CreatePostForm";
import WallFeed from "./WallFeed";

/**
 * Server Component that acts as the data-fetcher and wrapper for The Wall.
 */
export default async function WallSection({ spotifyArtistId, currentUserId }: { spotifyArtistId: string, currentUserId?: string }) {
  const supabase = await createClient();

  // Get the wall ID if it exists.
  const { data: wall } = await supabase
    .from("walls")
    .select("id")
    .eq("spotify_artist_id", spotifyArtistId)
    .single();

  let postsData: any[] = [];

  if (wall) {
    // Fetch all posts with their profiles and votes in one query
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (username),
        votes (vote_type, user_id)
      `)
      .eq("wall_id", wall.id)
      .order("created_at", { ascending: false });

    // Process to calculate Net dB scores and User Vote state
    if (posts) {
      postsData = posts.map((post: any) => {
        const score = post.votes?.reduce((acc: number, v: any) => acc + v.vote_type, 0) || 0;
        const userVote = post.votes?.find((v: any) => v.user_id === currentUserId)?.vote_type || 0;
        return { ...post, score, userVote };
      });
    }
  }

  return (
    <div className="mt-24 pt-12 border-t-[3px] border-black">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-5xl text-black font-serif font-black uppercase tracking-tighter flex items-center gap-4">
          <span className="w-4 h-4 bg-accent-red flex-shrink-0 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></span>
          THE WALL
        </h2>
      </div>

      <CreatePostForm spotifyArtistId={spotifyArtistId} />

      <WallFeed
        posts={postsData}
        currentUserId={currentUserId}
        spotifyArtistId={spotifyArtistId}
      />
    </div>
  );
}
