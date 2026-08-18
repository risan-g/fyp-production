import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchSpotifyData } from "@/lib/spotify";
import DBControl from "@/components/wall/DBControl";
import CommentThread from "@/components/wall/CommentThread";
import GlobalReplyForm from "@/components/wall/GlobalReplyForm";
import DeletePostButton from "@/components/wall/DeletePostButton";
import FormattedText from "@/components/wall/FormattedText";

interface VoteRecord {
  vote_type: number;
  user_id: string;
}

interface CommentWithProfileAndVotes {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  is_voided?: boolean;
  profiles: { username: string; avatar_url: string | null } | null;
  votes: VoteRecord[];
}

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
        profiles (username, avatar_url),
        votes (vote_type, user_id)
      `)
      .eq("id", postId)
      .single(),
    supabase
      .from("comments")
      .select(`
        *,
        profiles (username, avatar_url),
        votes (vote_type, user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
  ]);

  const post = postRes.data;
  if (!post || !artist || artist.error) return notFound();

  // Process Post Score
  const postVotes = (post.votes || []) as VoteRecord[];
  const postScore = postVotes.reduce((acc: number, v: VoteRecord) => acc + v.vote_type, 0);
  const postUserVote = (postVotes.find((v: VoteRecord) => v.user_id === currentUser?.id)?.vote_type || 0) as 1 | -1 | 0;

  // Process Comments Data for dB scores and user votes
  const commentsList = (commentsRes.data || []) as unknown as CommentWithProfileAndVotes[];
  const processedComments = commentsList.map((comment) => {
    const commentVotes = comment.votes || [];
    const score = commentVotes.reduce((acc: number, v: VoteRecord) => acc + v.vote_type, 0);
    const userVote = (commentVotes.find((v: VoteRecord) => v.user_id === currentUser?.id)?.vote_type || 0) as 1 | -1 | 0;
    return { ...comment, score, userVote };
  });

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
                  <FormattedText text={post.content} />
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-black/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white border-[2px] border-black flex items-center justify-center overflow-hidden shrink-0">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt={post.profiles.username}
                        className="w-full h-full object-cover grayscale"
                      />
                    ) : (
                      <span className="text-[8px] font-bold text-black">
                        {post.profiles?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <span>POSTED BY {post.profiles?.username || "UNKNOWN"}</span>
                </div>
                <span>•</span>
                <span suppressHydrationWarning>{new Date(post.created_at).toLocaleString()}</span>

                {currentUser?.id === post.user_id && (
                  <>
                    <span>•</span>
                    <DeletePostButton postId={post.id} spotifyArtistId={id} />
                  </>
                )}
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
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}
