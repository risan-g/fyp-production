"use client";

import { useState } from "react";
import FeedToggle from "@/components/home/FeedToggle";
import ReviewFeed from "@/components/home/ReviewFeed";

interface HomeFeedClientProps {
    user: any;
}

/**
 * Manages the state for the Toggle (Global vs Synced).
 */
export default function HomeFeedClient({ user }: HomeFeedClientProps) {
    const [activeFeed, setActiveFeed] = useState<"global" | "synced">("global");

    return (
        <div className="flex flex-col gap-6">
            {/* Feed Toggle (Global | Synced) */}
            <FeedToggle activeFeed={activeFeed} onChange={setActiveFeed} />

            {/* The Feed Stream */}
            <ReviewFeed
                feedType={activeFeed}
                optimisticReview={null}
                user={user}
            />
        </div>
    );
}
