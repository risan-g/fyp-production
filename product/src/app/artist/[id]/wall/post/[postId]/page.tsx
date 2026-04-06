import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import DBControl from "@/components/wall/DBControl";
import CommentThread from "@/components/wall/CommentThread";
import GlobalReplyForm from "@/components/wall/GlobalReplyForm";

async function fetchArtist(id: string) {
  return await fetchSpotifyData(`https://api.spotify.com/v1/artists/${id}`);
}

/**
 * Shows the full conversation for a single thread.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string, postId: string }>;
}) {
  const { id, postId } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch Post, Comments, and Artist data
  const [artist, postRes, commentsRes] = await Promise.all([
    fetchArtist(id),
    supabase
      .from("posts")
      .select(`
        *,
        profiles (username),
        votes (vote_type, user_id)
      `)
      .eq("id", postId)
      .single(),
    supabase
      .from("comments")
      .select(`
        *,
        profiles (username),
        votes (vote_type, user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
  ]);

  const post = postRes.data;
  if (!post || !artist || artist.error) return notFound();

  // Process Post Score
  const postScore = post.votes?.reduce((acc: number, v: any) => acc + v.vote_type, 0) || 0;
  const postUserVote = post.votes?.find((v: any) => v.user_id === currentUser?.id)?.vote_type || 0;

  // Process Comments Data for dB scores and user votes
  const processedComments = commentsRes.data?.map((comment: any) => {
    const score = comment.votes?.reduce((acc: number, v: any) => acc + v.vote_type, 0) || 0;
    const userVote = comment.votes?.find((v: any) => v.user_id === currentUser?.id)?.vote_type || 0;
    return { ...comment, score, userVote };
  }) || [];

  const artistImage = artist.images?.[0]?.url;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Thread Header */}
      <div className="border-b-[3px] border-black bg-neutral-100 p-6">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-black/40 mb-4">
            <Link href={`/artist/${id}`} className="hover:text-black transition-all">{artist.name}</Link>
            <span>/</span>
            <Link href={`/artist/${id}/wall`} className="hover:text-black transition-all">THE WALL</Link>
            <span>/</span>
            <span className="text-black">CONVERSATION</span>
          </nav>

          <div className="flex gap-6 items-start mt-8">
            <DBControl
              entityId={post.id}
              entityType="post"
              initialScore={postScore}
              initialUserVote={postUserVote}
              spotifyArtistId={id}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-6xl font-sans font-black uppercase tracking-tighter leading-tight mb-4">
                {post.title}
              </h1>
              <div className="bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                <p className="font-serif text-xl leading-relaxed text-black whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-black/50">
                <span>POSTED BY {post.profiles?.username || "UNKNOWN"}</span>
                <span>•</span>
                <span suppressHydrationWarning>{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMENTS SECTION */}

      <div className="max-w-4xl mx-auto px-6 mt-12">
        <GlobalReplyForm postId={postId} spotifyArtistId={id} />

        <CommentThread
          comments={processedComments}
          spotifyArtistId={id}
        />
      </div>
    </div>
  );
}
