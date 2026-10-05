import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { sortListings } from "@/lib/ranking";
import type { ListingFeed } from "@/lib/data";
import LeaderboardRow from "@/components/LeaderboardRow";

type LeaderboardProps = {
  feed: ListingFeed;
  compact?: boolean;
};

export default function Leaderboard({ feed, compact = false }: LeaderboardProps) {
  const listings = sortListings(feed.listings);

  return (
    <>
      {feed.notice && <div className="data-note"><Info size={13} />{feed.notice}</div>}
      <div className="leaderboard">
        <div className="leaderboard-head" aria-hidden="true">
          <span>Rank</span><span>Product</span><span>Category</span><span>Website</span><span style={{ textAlign: "right" }}>Rank value</span>
        </div>
        {listings.length ? listings.slice(0, compact ? 5 : 500).map((listing, index) => (
          <LeaderboardRow key={listing.id} listing={listing} rank={index + 1} index={index} demo={feed.source === "demo"} />
        )) : (
          <div className="leaderboard-empty">No listings in this category yet. Be the first to submit one.</div>
        )}
      </div>
      {compact && (
        <div className="browse-footer">
          <Link className="button button-quiet button-small" href="/categories">Explore all listings <ArrowRight size={14} /></Link>
        </div>
      )}
    </>
  );
}