import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * Ensures the page is dynamically rendered on every request to
 * reflect real-time changes in the user's rating library.
 */
export const dynamic = "force-dynamic";

// Standardised number of items to display per page for consistent layout
const ITEMS_PER_PAGE = 12;

export default async function AllRatingsPage(props: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const username = decodeURIComponent(params.username);

  /**
   * Sort Logic Selection
   */
  const currentSort = searchParams.sort || "highest";
  
  // Mapping sort keys to database columns and ordering
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    highest: { column: "rating", ascending: false },
    lowest: { column: "rating", ascending: true },
    newest: { column: "created_at", ascending: false },
    oldest: { column: "created_at", ascending: true },
  };

  const { column, ascending } = sortMap[currentSort] || sortMap.highest;

  /**
   * Pagination
   */
  let currentPage = 1;
  if (searchParams.page && !isNaN(Number(searchParams.page))) {
    currentPage = parseInt(searchParams.page);
    if (currentPage < 1) currentPage = 1;
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Verify that the profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .single();

  if (!profile) return notFound();

  /**
   * Fetch ratings from 'reviews' table where rating is NOT null.
   */
  const { data: ratings, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("user_id", profile.id)
    .not("rating", "is", null) // Filter out unrated reviews
    .order(column, { ascending })
    .range(from, to);

  const totalRatings = count || 0;
  const totalPages = Math.ceil(totalRatings / ITEMS_PER_PAGE);

  /**
   * Pagination Controls Component
   */
  const PaginationControls = () => {
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const baseLink = `/profile/${params.username}/ratings?sort=${currentSort}`;

    return (
      <div className="flex items-center justify-between border-t-[3px] border-black pt-6 mt-8 mb-8">
        {hasPrev ? (
          <Link
            href={`${baseLink}&page=${currentPage - 1}`}
            className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-black px-4 py-2 border-[3px] border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            &larr; PREV
          </Link>
        ) : (
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-black/30 px-4 py-2 border-[3px] border-black/20 cursor-not-allowed">
            &larr; PREV
          </span>
        )}

        <span className="text-[10px] text-black/60 font-mono font-bold uppercase tracking-[0.2em]">
          PAGE {currentPage} OF {totalPages || 1}
        </span>

        {hasNext ? (
          <Link
            href={`${baseLink}&page=${currentPage + 1}`}
            className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-black px-4 py-2 border-[3px] border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            NEXT &rarr;
          </Link>
        ) : (
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-black/30 px-4 py-2 border-[3px] border-black/20 cursor-not-allowed">
            NEXT &rarr;
          </span>
        )}
      </div>
    );
  };

  /**
   * Sort Controls — Joined Segmented Control Bar (Responsive)
   */
  const SortControls = () => {
    const options = [
      { key: "highest", label: "HIGHEST" },
      { key: "lowest", label: "LOWEST" },
      { key: "newest", label: "NEWEST" },
      { key: "oldest", label: "OLDEST" },
    ];

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8">
        <span className="text-[10px] text-black/40 font-mono font-bold uppercase tracking-[0.2em] shrink-0">SORT:</span>
        <div className="grid grid-cols-2 sm:flex border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full sm:w-auto">
          {options.map((opt, i) => {
            const isActive = currentSort === opt.key;
            
            // Border Logic:
            // Mobile (2x2 grid): 
            // - Right border on items 0 and 2 (first column)
            // - Bottom border on items 0 and 1 (first row)
            // Desktop (1x4 row):
            // - Right border on items 0, 1, 2
            // - No bottom borders
            
            return (
              <Link
                key={opt.key}
                href={`/profile/${params.username}/ratings?sort=${opt.key}`}
                className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-3 py-2.5 sm:px-4 sm:py-2 transition-colors text-center border-black ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                } ${
                  // Right borders
                  (i % 2 === 0) ? "border-r-[2px]" : "sm:border-l-0"
                } ${
                  // Desktop specific right border for item 2 (which is index 1)
                  (i === 1) ? "sm:border-r-[2px]" : ""
                } ${
                  // Bottom borders (Mobile only)
                  (i < 2) ? "border-b-[2px] sm:border-b-0" : ""
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black min-h-screen p-8">
      <div className="max-w-4xl mx-auto pt-24">
        {/* Navigation Header */}
        <div className="flex items-center gap-6 mb-16 border-b-[3px] border-black pb-8">
          <Link
            href={`/profile/${params.username}`}
            className="group flex items-center justify-center w-12 h-12 border-[3px] border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            <span className="text-xl font-black">
              &larr;
            </span>
          </Link>

          <div className="flex flex-col">
            <h1 className="text-5xl font-serif font-black uppercase tracking-tighter text-black">&quot;ARCHIVE&quot;</h1>
            <p className="text-[10px] text-black/50 font-mono font-bold uppercase tracking-[0.2em] mt-1">
              ARCHIVED BY {profile.username.toUpperCase()} &bull; {totalRatings} TOTAL
            </p>
          </div>
        </div>

        {totalRatings > 0 && <SortControls />}
        {totalRatings > 0 && <PaginationControls />}

        {/* Visual Ratings Grid */}
        {ratings && ratings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {ratings.map((rating) => (
              <Link
                href={`/album/${rating.album_id}`}
                key={rating.id}
                className="group flex flex-col gap-3"
              >
                <div className="relative aspect-square bg-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
                  {/* Image rendering */}
                  {rating.album_image_url ? (
                    <img
                      src={rating.album_image_url}
                      alt={rating.album_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-neutral-100">
                      <span className="text-xs text-black font-mono font-bold uppercase">
                        {rating.album_name || "UNKNOWN"}
                      </span>
                    </div>
                  )}

                  {/* Rating Badge Overlay */}
                  <div className="absolute top-0 right-0 bg-white px-2 py-1 text-xs font-mono font-bold text-black border-l-[3px] border-b-[3px] border-black shadow-[-2px_2px_0px_rgba(0,0,0,1)]">
                    {rating.rating}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-sm font-sans text-black uppercase tracking-tight truncate group-hover:text-accent-red transition-colors">
                    {rating.album_name}
                  </span>
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-[10px] text-black/50 font-mono uppercase tracking-widest truncate shrink">
                      {rating.artist_name}
                    </span>
                    <span className="text-[9px] text-black/30 font-mono tabular-nums shrink-0 uppercase">
                      {new Date(rating.created_at).toLocaleDateString("en-GB", { 
                        day: "2-digit", 
                        month: "2-digit", 
                        year: "2-digit" 
                      }).replace(/\//g, ".")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-[3px] border-black border-dashed bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <p className="text-black/50 text-xs font-mono font-bold uppercase tracking-[0.2em]">NO RATINGS FOUND.</p>
          </div>
        )}

        {totalRatings > 0 && <PaginationControls />}
      </div>
    </div>
  );
}
