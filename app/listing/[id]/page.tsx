import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, Trophy } from "lucide-react";
import ClimbModal from "@/components/ClimbModal";
import Leaderboard from "@/components/Leaderboard";
import ListingAvatar from "@/components/ListingAvatar";
import { MINIMUM_INCREMENT } from "@/lib/constants";
import { getListingDetail } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getCurrentRank, getRequiredRankValue, sortListings } from "@/lib/ranking";

type ListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

function getSafeExternalUrl(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const nextUrl = new URL(url);
    return nextUrl.protocol === "http:" || nextUrl.protocol === "https:" ? nextUrl.toString() : "#";
  } catch {
    return "#";
  }
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getListingDetail(id);
  return { title: detail?.listing.name ?? "Listing" };
}

export default async function ListingPage({ params, searchParams }: ListingPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const detail = await getListingDetail(id);
  if (!detail) notFound();

  const supabase = detail.demo ? null : await getSupabaseServerClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const sorted = sortListings(detail.listings);
  const currentRank = getCurrentRank(sorted, detail.listing.id);
  const requiredAmount = getRequiredRankValue(sorted, detail.listing.id, MINIMUM_INCREMENT);
  const currentLeader = sorted[0];
  const isCurrentLeader = currentRank === 1;
  const isOwner = Boolean(user && detail.listing.owner_id === user.id);
  const websiteUrl = getSafeExternalUrl(detail.listing.website_url);
  const twitterUrl = getSafeExternalUrl(detail.listing.twitter_url);
  const websiteHost = (() => {
    try {
      return new URL(websiteUrl).hostname.replace(/^www\./, "");
    } catch {
      return "website";
    }
  })();

  return (
    <main className="page-main">
      <div className="container">
        <div className="listing-page-head">
          <div className="listing-page-title">
            <ListingAvatar name={detail.listing.name} logoUrl={detail.listing.logo_url} />
            <div>
              <h1 className="display">{detail.listing.name}</h1>
              <p>{detail.listing.displayCategory ?? detail.listing.category} <span aria-hidden="true">·</span> {websiteUrl !== "#" ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer">{websiteHost} <ExternalLink size={11} style={{ verticalAlign: "-2px" }} /></a> : <span>{websiteHost}</span>}</p>
            </div>
          </div>
          <Link className="button button-quiet button-small" href="/categories">Browse leaderboard <ArrowUpRight size={14} /></Link>
        </div>

        {query.created === "1" && <p className="form-success" role="status">Your listing is live on the leaderboard.</p>}

        <div className="listing-detail-grid">
          <section className="panel detail-panel">
            <h2>About this product</h2>
            <p className="detail-description">{detail.listing.description}</p>
            <div className="detail-links">
              {websiteUrl !== "#" ? <a className="button button-quiet button-small" href={websiteUrl} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink size={13} /></a> : null}
              {twitterUrl !== "#" && detail.listing.twitter_url ? <a className="button button-quiet button-small" href={twitterUrl} target="_blank" rel="noopener noreferrer">X / Twitter <ExternalLink size={13} /></a> : null}
            </div>
            <div className="detail-meta"><Trophy size={14} /><span>Current position</span><strong>#{currentRank}</strong></div>
            {isCurrentLeader && <p className="form-success" role="status">This listing is currently #1.</p>}
          </section>

          <aside className="panel climb-panel">
            <div className="rank-card">
              <div className="rank-card-label">Current rank value</div>
              <div className="rank-card-value"><strong className="mono">₹{detail.listing.rank_value.toLocaleString("en-IN")}</strong><span>TEST rank value</span></div>
            </div>
            <div className="next-target"><span>Current #1 value</span><strong className="mono">₹{(currentLeader?.rank_value ?? 0).toLocaleString("en-IN")}</strong></div>
            <div className="next-target">
              <span>{isCurrentLeader ? "Next required value" : "Minimum to claim #1"}</span>
              <strong className="mono">{isCurrentLeader ? "Already #1" : `₹${requiredAmount.toLocaleString("en-IN")}`}</strong>
            </div>
            {isCurrentLeader ? (
              <p className="climb-note">This listing is already #1. A climb is not needed.</p>
            ) : detail.demo ? (
              <div className="demo-callout">Preview listing. Connect Supabase and submit a listing to try a Razorpay TEST climb.</div>
            ) : isOwner ? (
              <ClimbModal listingId={detail.listing.id} requiredAmount={requiredAmount} />
            ) : (
              <p className="climb-note">
                Only the listing owner can climb it.{" "}
                {!user && <Link href="/login">Sign in</Link>}
              </p>
            )}
            <p className="climb-note">Razorpay TEST payments only. Rank changes require server verification.</p>
          </aside>
        </div>

        <div className="section-heading">
          <div><h2 className="display">The board right now</h2><p>Rankings update after payment verification.</p></div>
        </div>
        <Leaderboard feed={{ listings: sorted, source: detail.demo ? "demo" : "database" }} compact />
      </div>
    </main>
  );
}