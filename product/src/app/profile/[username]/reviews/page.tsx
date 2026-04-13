import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * Forces the page to re-render on every request to ensure
 * the latest community reviews are always displayed.
 */
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

/**
 * AllReviewsPage (Server Component)
 * Renders a paginated list of all reviews written by a specific user.
 * Supports chronological sorting (Newest/Oldest).
 */
export default async function AllReviewsPage(props: {
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
  const currentSort = searchParams.sort || "newest";

  // Mapping sort keys to database columns
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: "created_at", ascending: false },
    oldest: { column: "created_at", ascending: true },
  };

  const { column, ascending } = sortMap[currentSort] || sortMap.newest;

  /**
   * Pagination Logic
   */
  let currentPage = 1;
  if (searchParams.page && !isNaN(Number(searchParams.page))) {
    currentPage = parseInt(searchParams.page);
    if (currentPage < 1) currentPage = 1;
  }
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Retrieve user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .single();

  if (!profile) return notFound();

  /**
   * Database Query:
   * Fetch reviews from the unified table where 'content' exists.
   */
  const { data: reviews, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("user_id", profile.id)
    .not("content", "is", null)
    .neq("content", "")
    .order(column, { ascending })
    .range(from, to);

  const totalReviews = count || 0;
  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

  /**
   * PaginationControls Component
   */
  const PaginationControls = () => {
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const baseLink = `/profile/${params.username}/reviews?sort=${currentSort}`;

    return (
      <div className="flex items-center justify-between border-t-[3px] border-black pt-6 mt-12 mb-8">
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
   * Sort Controls — Welded Segmented Bar
   */
  const SortControls = () => {
    const options = [
      { key: "newest", label: "NEWEST" },
      { key: "oldest", label: "OLDEST" },
    ];

    return (
      <div className="flex items-center gap-4 mb-8">
        <span className="text-[10px] text-black/40 font-mono font-bold uppercase tracking-[0.2em] shrink-0">SORT:</span>
        <div className="flex border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          {options.map((opt, i) => {
            const isActive = currentSort === opt.key;
            return (
              <Link
                key={opt.key}
                href={`/profile/${params.username}/reviews?sort=${opt.key}`}
                className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-4 py-2.5 transition-colors text-center border-black ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                } ${i === 0 ? "border-r-[2px]" : ""}`}
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
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-16 border-b-[3px] border-black pb-8">
          <Link
            href={`/profile/${params.username}`}
            className="group flex items-center justify-center w-12 h-12 border-[3px] border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            <span className="text-xl font-black">&larr;</span>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-5xl font-serif font-black uppercase tracking-tighter text-black">&quot;REVIEWS&quot;</h1>
            <p className="text-[10px] text-black/50 font-mono font-bold uppercase tracking-[0.2em] mt-1">
              WRITTEN BY {profile.username.toUpperCase()} &bull; {totalReviews} TOTAL
            </p>
          </div>
        </div>

        {totalReviews > 0 && <SortControls />}
        {totalReviews > 0 && <PaginationControls />}

        {/* Dynamic Reviews List */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group bg-white border-[3px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 border-b-[2px] border-black/10 pb-6">
                  <div className="flex gap-4 items-center">
                    <Link href={`/album/${review.album_id}`} className="shrink-0">
                      {review.album_image_url ? (
                        <div className="w-16 h-16 border-[2px] border-black relative">
                          <img
                            src={review.album_image_url}
                            alt={review.album_name}
                            className="w-full h-full object-cover relative z-10"
                          />
                          <div className="absolute top-1 left-1 w-full h-full bg-black/10 z-0"></div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 border-[2px] border-black bg-neutral-100 flex items-center justify-center">
                          <span className="text-[10px] font-mono font-bold text-black/40">N/A</span>
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col">
                      <Link
                        href={`/album/${review.album_id}`}
                        className="text-xl font-bold font-sans uppercase tracking-tight text-black hover:underline decoration-accent-red decoration-2 underline-offset-4"
                      >
                        {review.album_name || "UNKNOWN ALBUM"}
                      </Link>
                      <span className="text-[10px] text-black/60 font-mono uppercase tracking-widest mt-1">
                        {review.artist_name || "UNKNOWN ARTIST"}
                      </span>
                      <span className="text-[10px] text-black/40 font-mono uppercase tracking-[0.2em] mt-1">
                        {new Date(review.created_at).toLocaleDateString(undefined, { dateStyle: "long" }).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative score badge */}
                  {review.rating !== null && (
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-black font-black text-3xl font-sans tracking-tighter underline decoration-accent-red decoration-4">{review.rating}</span>
                      <span className="text-[10px] font-sans tracking-tighter font-bold text-black/40">/100</span>
                    </div>
                  )}
                </div>

                {/* Review text */}
                <div className="relative">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent-red">&quot;REVIEW&quot;</div>
                  <p className="text-black text-lg font-serif leading-relaxed whitespace-pre-wrap border-[2px] border-black p-6 pl-8 bg-neutral-50 break-words">
                    {review.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-[3px] border-black border-dashed bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <p className="text-black/50 text-xs font-mono font-bold uppercase tracking-[0.2em]">NO REVIEWS FOUND.</p>
          </div>
        )}

        {totalReviews > 0 && <PaginationControls />}
      </div>
    </div>
  );
}
