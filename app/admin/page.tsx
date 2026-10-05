import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Database } from "lucide-react";
import { DEMO_LISTINGS } from "@/lib/demo-data";
import { getAdminData } from "@/lib/data";
import { sortListings } from "@/lib/ranking";

export const metadata: Metadata = { title: "Development admin" };

export default async function AdminPage() {
  const data = await getAdminData();
  const liveListings = data.status === "database" ? data.listings : [];
  const leaderboard = sortListings(liveListings);
  const recent = data.status === "database"
    ? [...liveListings].sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 8)
    : DEMO_LISTINGS;
  const totalValue = liveListings.reduce((sum, listing) => sum + listing.rank_value, 0);
  const statusText = data.status === "database"
    ? "Connected to Supabase. These are live development metrics."
    : data.status === "unconfigured"
      ? "Supabase is not configured. Demo rows below are previews, not saved listings."
      : "Supabase could not be reached. Live metrics are unavailable; demo rows are previews.";

  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Internal tools</div>
          <h1 className="display">Development admin</h1>
          <p>A lightweight view of Toplier&apos;s listing activity.</p>
        </div>
        <div className="admin-banner"><AlertTriangle size={16} /> Development-only page. No authentication is enabled; do not expose this route as a production admin console.</div>
        <p className="data-note"><Database size={13} />{statusText}</p>
        <div className="stat-grid">
          <div className="stat-card"><span>Total listings</span><strong>{data.status === "database" ? liveListings.length.toLocaleString("en-IN") : "—"}</strong></div>
          <div className="stat-card"><span>Total simulated rank value</span><strong>{data.status === "database" ? `₹${totalValue.toLocaleString("en-IN")}` : "—"}</strong></div>
          <div className="stat-card"><span>Top listing</span><strong>{leaderboard[0]?.name ?? "—"}</strong></div>
        </div>
        <section className="admin-recent">
          <h2 className="display">Recent listings</h2>
          {!recent.length ? <div className="leaderboard-empty panel">No listings have been submitted yet.</div> : (
            <div className="panel">
              {recent.map((listing) => (
                <Link className="admin-row" href={`/listing/${listing.id}`} key={listing.id}>
                  <span>{listing.name}<span className="muted"> · {data.status === "database" ? "Live" : "Preview"}</span></span>
                  <span className="muted">{new Date(listing.created_at).toLocaleDateString("en-IN")}</span>
                  <span>₹{listing.rank_value.toLocaleString("en-IN")} <ArrowUpRight size={12} style={{ verticalAlign: "-2px" }} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}