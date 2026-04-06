import DBControl from "./DBControl";
import Link from "next/link";

/**
 * preview of a submission.
 */
export default function PostCard({ post, currentUserId, spotifyArtistId }: { post: any, currentUserId?: string, spotifyArtistId: string }) {
  const score = post.score || 0;
  const userVote = post.userVote || 0;

  return (
    <div className="flex gap-4 border-[3px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 transition-all group">

      {/* Vote control */}
      <div className="shrink-0 mt-1">
        <DBControl
          entityId={post.id}
          entityType="post"
          initialScore={score}
          initialUserVote={userVote}
          spotifyArtistId={spotifyArtistId}
        />
      </div>

      {/* Post Content */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* User & Time */}
        <div className="flex items-center gap-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-black/50 border-b-[2px] border-black/10 pb-2">
          <Link href={`/profile/${post.profiles?.username}`} className="font-bold text-black border-b-[2px] border-transparent hover:border-black transition-all">
            {post.profiles?.username || "UNKNOWN"}
          </Link>
          <span className="w-1 h-1 bg-black/30"></span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>

        {/* Title */}
        <h3 className="font-sans font-black text-2xl uppercase mb-3 leading-tight group-hover:underline decoration-accent-red decoration-4 underline-offset-4 cursor-pointer">
          {post.title}
        </h3>

        {/* Content Preview */}
        <p className="font-serif text-lg leading-relaxed text-black line-clamp-3 bg-neutral-50 p-4 border-[2px] border-black">
          {post.content}
        </p>

        {/* Thread link */}
        <div className="mt-4 flex justify-end">
          <button className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-4 py-2 border-[2px] border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            VIEW THREAD →
          </button>
        </div>
      </div>
    </div>
  );
}
