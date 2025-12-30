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
 * Uses unified 'reviews' table and cached metadata.
 */
export default async function AllReviewsPage(props: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const username = decodeURIComponent(params.username);

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
   * Cached metadata allows us to skip API calls.
   */
  const { data: reviews, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("user_id", profile.id)
    .not("content", "is", null)
    .neq("content", "")
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalReviews = count || 0;
  const totalPages = Math.ceil(totalReviews / ITEMS_PER_PAGE);

  /**
   * PaginationControls Component
   */
  const PaginationControls = () => {
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return (
      <div className="flex items-center justify-center gap-8 border-t border-neutral-800 pt-8 mt-12 pb-12">
        {hasPrev ? (
          <Link
            href={`/profile/${params.username}/reviews?page=${currentPage - 1}`}
            className="text-sm font-bold text-white hover:text-neutral-400 transition-colors px-6 py-3 bg-neutral-900 rounded-full"
          >
            ← Previous
          </Link>
        ) : (
          <span className="text-sm font-bold text-neutral-700 px-6 py-3 cursor-not-allowed">
            ← Previous
          </span>
        )}
        <span className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
          Page {currentPage} of {totalPages || 1}
        </span>
        {hasNext ? (
          <Link
            href={`/profile/${params.username}/reviews?page=${currentPage + 1}`}
            className="text-sm font-bold text-white hover:text-neutral-400 transition-colors px-6 py-3 bg-neutral-900 rounded-full"
          >
            Next →
          </Link>
        ) : (
          <span className="text-sm font-bold text-neutral-700 px-6 py-3 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-16 border-b border-neutral-800 pb-8">
          <Link
            href={`/profile/${params.username}`}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <span className="text-xl group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight">Reviews</h1>
            <p className="text-neutral-500 text-sm uppercase tracking-widest font-medium mt-1">
              Written by {profile.username} • {totalReviews} Total
            </p>
          </div>
        </div>

        {/* Dynamic Reviews Grid */}
        {reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 hover:border-neutral-600 transition-colors h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-start">
                    <Link
                      href={`/album/${review.album_id}`}
                      className="shrink-0"
                    >
                      {review.album_image_url ? (
                        <img
                          src={review.album_image_url}
                          alt={review.album_name}
                          className="w-16 h-16 rounded-md object-cover shadow-lg opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-800 rounded-md flex items-center justify-center">
                          <span className="text-[10px] text-neutral-600">
                            N/A
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col">
                      <Link
                        href={`/album/${review.album_id}`}
                        className="text-xl font-bold text-white hover:underline decoration-neutral-500 underline-offset-4 line-clamp-1"
                      >
                        {review.album_name || "Unknown"}
                      </Link>
                      <span className="text-sm text-neutral-500 font-medium">
                        {review.artist_name || "Unknown"}
                      </span>
                      {/* Formatting the timestamp */}
                      <span className="text-xs text-neutral-600 tabular-nums mt-1">
                        {new Date(review.created_at).toLocaleDateString(
                          undefined,
                          { dateStyle: "long" }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative score badge */}
                  {review.rating !== null && (
                    <div className="bg-white text-black font-bold px-3 py-1 rounded text-sm shadow-lg shrink-0">
                      {review.rating}
                    </div>
                  )}
                </div>

                {/* Qualitative review text */}
                <div className="pl-[80px]">
                  <p className="text-neutral-300 text-base leading-relaxed whitespace-pre-wrap border-l-2 border-neutral-800 pl-4 break-words">
                    {review.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-neutral-800 rounded-xl">
            <p className="text-neutral-500">No reviews found.</p>
          </div>
        )}
        {/* Render pagination footer */}
        {totalReviews > 0 && <PaginationControls />}
      </div>
    </div>
  );
}
