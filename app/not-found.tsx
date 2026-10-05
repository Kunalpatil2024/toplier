import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container error-page">
      <div className="eyebrow" style={{ justifyContent: "center" }}>404 · Listing not found</div>
      <h1 className="display">Nothing on this spot.</h1>
      <p>This listing may have moved, or its link may be incomplete.</p>
      <Link className="button" href="/categories">Back to the leaderboard</Link>
    </main>
  );
}