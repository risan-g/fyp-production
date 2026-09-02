import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import NewPostButton from "@/components/wall/NewPostButton";
import WallFeed from "@/components/wall/WallFeed";


async function fetchArtist(id: string) {
  return await fetchSpotifyData(`${process.env.SPOTIFY_API_BASE_URL || 'https://api.spotify.com'}/v1/artists/${id}`);
}

interface PostVote {
  vote_type: number;
  user_id: string;
}

interface PostWithRelations {
  id: string;
  wall_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  votes: PostVote[];
  comments: { count: number }[];
}

export interface WallFeedPost extends PostWithRelations {
  score: number;
  userVote: 1 | -1 | 0;
  replyCount: number;
}

/**
 * THE WALL PAGE
 */
export default async function WallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch Artist and Wall data in parallel
  const [artist, { data: wall }] = await Promise.all([
    fetchArtist(id),
    supabase.from("walls").select("id").eq("spotify_artist_id", id).single()
  ]);

  if (!artist || artist.error) return notFound();

  let postsData: WallFeedPost[] = [];

  if (wall) {
    // Fetch all posts with their profiles, votes, and comment count
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (username, avatar_url),
        votes (vote_type, user_id),
        comments(count)
      `)
      .eq("wall_id", wall.id)
      .order("created_at", { ascending: false });

    // Process the data for dB scores and engagement
    if (posts) {
      const rawPosts = posts as unknown as PostWithRelations[];
      postsData = rawPosts.map((post) => {
        const score = post.votes?.reduce((acc: number, v: PostVote) => acc + v.vote_type, 0) || 0;
        const userVote = (post.votes?.find((v: PostVote) => v.user_id === currentUser?.id)?.vote_type || 0) as 1 | -1 | 0;
        const replyCount = post.comments?.[0]?.count || 0;
        return { ...post, score, userVote, replyCount };
      });
    }
  }

  const artistImage = artist.images?.[0]?.url;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* DynamicHeader */}
      <div className="border-b-[3px] border-black bg-black text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-4">
            <Link
              href={`/artist/${id}`}
              className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:text-accent-red transition-all flex items-center gap-2"
            >
              BACK TO PROFILE
            </Link>
          </div>

          <div className="flex items-center gap-4 border-[3px] border-white p-4 bg-white text-black shadow-[8px_8px_0px_rgba(255,0,0,1)]">
            {artistImage && (
              <img src={artistImage} alt={artist.name} className="w-12 h-12 object-cover border-[2px] border-black grayscale" />
            )}
            <div className="flex flex-col">
              <span className="text-xl font-sans font-black uppercase leading-none">{artist.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 relative">
        <NewPostButton spotifyArtistId={id} />

        {/* The Community Feed */}
        <WallFeed
          posts={postsData}
          currentUserId={currentUser?.id}
          spotifyArtistId={id}
        />
      </div>

    </div>
  );
}
