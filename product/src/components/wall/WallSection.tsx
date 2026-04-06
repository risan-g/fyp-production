import CreatePostForm from "./CreatePostForm";
import WallFeed from "./WallFeed";

/**
 * Server Component that acts as the data-fetcher and wrapper for The Wall.
 */
export default async function WallSection({ spotifyArtistId, currentUserId }: { spotifyArtistId: string, currentUserId?: string }) {

  const mockPosts: any[] = [];

  return (
    <div className="mt-24 pt-12 border-t-[3px] border-black">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-5xl text-black font-serif font-black uppercase tracking-tighter flex items-center gap-4">
          <span className="w-4 h-4 bg-accent-red flex-shrink-0 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></span>
          THE WALL
        </h2>
      </div>

      <CreatePostForm spotifyArtistId={spotifyArtistId} />

      {/* The Feed */}
      <WallFeed
        posts={mockPosts}
        currentUserId={currentUserId}
        spotifyArtistId={spotifyArtistId}
      />
    </div>
  );
}
