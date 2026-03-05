import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star } from "lucide-react";

/**
 * HottestAlbums (Server Component)
 * 
 * Determines the top 5 highest-rated albums from the last 24 hours.
 */
export async function getHottestAlbums() {
    const supabase = await createClient();
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: recentReviews, error } = await supabase
        .from("reviews")
        .select("album_id, album_name, artist_name, album_image_url, rating")
        .gte("created_at", yesterday.toISOString());

    if (error || !recentReviews || recentReviews.length === 0) {
        return [];
    }

    const aggregator: Record<string, {
        album_id: string;
        name: string;
        artist: string;
        image: string;
        totalRating: number;
        ratingCount: number;
        logCount: number;
    }> = {};

    recentReviews.forEach((r) => {
        if (!aggregator[r.album_id]) {
            aggregator[r.album_id] = {
                album_id: r.album_id,
                name: r.album_name,
                artist: r.artist_name,
                image: r.album_image_url,
                totalRating: 0,
                ratingCount: 0,
                logCount: 0
            };
        }
        aggregator[r.album_id].logCount += 1;
        if (r.rating !== null) {
            aggregator[r.album_id].totalRating += r.rating;
            aggregator[r.album_id].ratingCount += 1;
        }
    });

    return Object.values(aggregator)
        .map(a => ({
            ...a,
            average: a.ratingCount > 0 ? Number((a.totalRating / a.ratingCount).toFixed(1)) : 0
        }))
        .sort((a, b) => {
            if (b.logCount === a.logCount) {
                return b.average - a.average;
            }
            return b.logCount - a.logCount;
        })
        .slice(0, 5);
}

export default async function HottestAlbums() {
    const hottest = await getHottestAlbums();

    if (hottest.length === 0) {
        return (
            <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col min-h-[300px]">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black/60 mb-6 font-bold">"HOTTEST ALBUMS"</h3>
                <div className="flex-1 flex items-center justify-center text-black/60 text-xs font-mono uppercase tracking-widest text-center font-bold">
                    [NO DATA / 24H]
                </div>
            </div>
        );
    }

    return (
        <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
                <h3 className="font-mono text-sm uppercase tracking-widest text-black flex items-center gap-2 font-bold">
                    <Star className="w-5 h-5 text-accent-red fill-accent-red" />
                    "HOTTEST"
                </h3>
                <span className="text-[10px] text-black/60 font-mono uppercase tracking-widest">24H_CYCLE</span>
            </div>

            <div className="flex flex-col gap-4 mt-2">
                {hottest.map((album, index) => (
                    <Link
                        href={`/album/${album.album_id}`}
                        key={album.album_id}
                        className="flex items-center gap-3 group"
                    >
                        <span className="text-black/40 font-mono text-xl font-black w-6 text-center group-hover:text-accent-red transition-colors">
                            {index + 1}
                        </span>

                        {/* Artwork */}
                        <div className="w-14 h-14 border-2 border-black bg-black shrink-0 relative">
                            {album.image ? (
                                <img src={album.image} alt={album.name} className="w-full h-full object-cover transition-all z-10 relative" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-mono">N/A</div>
                            )}
                            <div className="absolute top-1 left-1 w-full h-full bg-black/10 -z-0"></div>
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 px-2 border-l-2 border-black/10">
                            <span className="text-black font-black text-sm uppercase truncate group-hover:underline decoration-accent-red decoration-2 underline-offset-2">
                                {album.name}
                            </span>
                            <span className="text-black/60 font-mono text-[10px] uppercase tracking-widest truncate">
                                {album.artist}
                            </span>
                        </div>

                        <div className="flex flex-col items-end justify-center shrink-0">
                            {album.average > 0 ? (
                                <span className="text-black font-black text-lg">{album.average}</span>
                            ) : (
                                <span className="text-black font-black text-lg text-black/20">--</span>
                            )}
                            <span className="text-black/50 font-mono text-[10px] uppercase tracking-widest font-bold">
                                {album.logCount} {album.logCount === 1 ? 'LOG' : 'LOGS'}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
