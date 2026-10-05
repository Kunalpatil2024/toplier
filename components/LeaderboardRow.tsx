import Link from "next/link";
import { ArrowUpRight, Crown, ExternalLink } from "lucide-react";
import type { CSSProperties } from "react";
import type { Listing } from "@/types/database";
import ListingAvatar from "@/components/ListingAvatar";

type LeaderboardRowProps = {
  listing: Listing;
  rank: number;
  index: number;
  demo: boolean;
};

export default function LeaderboardRow({ listing, rank, index, demo }: LeaderboardRowProps) {
  const rowStyle = { "--row-index": index } as CSSProperties;
  const websiteHost = new URL(listing.website_url).hostname.replace(/^www\./, "");
  const category = listing.displayCategory ?? listing.category;

  return (
    <article className={`leaderboard-row ${rank === 1 ? "is-leader" : ""}`} style={rowStyle}>
      <div className="rank-cell">
        {rank === 1 ? <Crown size={15} strokeWidth={1.8} /> : <span className="mono">{String(rank).padStart(2, "0")}</span>}
      </div>
      <Link className="listing-main" href={`/listing/${listing.id}`}>
        <ListingAvatar name={listing.name} logoUrl={listing.logo_url} />
        <span style={{ minWidth: 0 }}>
          <span className="listing-title">{listing.name}</span>
          <span className="listing-caption">
            <span className="caption-desktop">{demo ? "Preview listing" : "Listed on Toplier"}</span>
            <span className="caption-mobile">{demo ? "Preview" : "Listed"} · {category} · {websiteHost}</span>
          </span>
        </span>
      </Link>
      <div><span className="category-chip">{category}</span></div>
      <a className="website-link" href={listing.website_url} target="_blank" rel="noreferrer">
        {websiteHost} <ExternalLink size={11} />
      </a>
      <div className="rank-value mono">
        {rank === 1 && <strong>#1&nbsp; </strong>}
        ₹{listing.rank_value.toLocaleString("en-IN")}
        <ArrowUpRight className="row-arrow" size={13} />
      </div>
    </article>
  );
}