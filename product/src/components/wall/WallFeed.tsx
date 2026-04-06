"use client";
import PostCard from "./PostCard";

/**
 * Renders the list of posts. 
 * Handles the state when an artist has no noise yet.
 */
export default function WallFeed({ posts, currentUserId, spotifyArtistId }: { posts: any[], currentUserId?: string, spotifyArtistId: string }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="border-[3px] border-black border-dashed py-24 text-center bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <span className="text-black/50 font-mono text-sm uppercase font-bold tracking-[0.2em]">NO NOISE YET. BE THE FIRST.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          spotifyArtistId={spotifyArtistId}
        />
      ))}
    </div>
  );
}
