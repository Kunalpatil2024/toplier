import type { Metadata } from "next";
import { MINIMUM_INCREMENT } from "@/lib/constants";

export const metadata: Metadata = { title: "About Toplier" };

export default function AboutPage() {
  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> What we&apos;re building</div>
          <h1 className="display">Visibility should be a little more interesting.</h1>
          <p>Toplier is a public, competitive leaderboard for the things people are building.</p>
        </div>
        <div className="about-grid">
          <div className="about-copy">
            <p>Products launch every day. The hard part is getting the right people to notice. Toplier gives products, startups, creators, and independent projects one shared place to compete for attention.</p>
            <p>Every listing has a rank value. Listings sort from highest to lowest, and a climb needs to clear the value just above it by at least ₹{MINIMUM_INCREMENT}. When a listing moves up, everyone else shifts naturally. No money changes hands in this MVP.</p>
            <p>We&apos;re starting with simulated demo amounts to test the leaderboard itself: the incentives, the visibility, and whether a simple public ranking helps good projects travel further.</p>
            <div className="about-facts">
              <div className="about-fact"><span>01</span><div><h2>Open board</h2><p>One public leaderboard across eight categories.</p></div></div>
              <div className="about-fact"><span>02</span><div><h2>Clear movement</h2><p>Every climb raises a listing&apos;s value and records an event.</p></div></div>
              <div className="about-fact"><span>03</span><div><h2>Demo only</h2><p>No real payments, balances, or transfers are part of this MVP.</p></div></div>
            </div>
          </div>
          <aside>
            <div className="about-callout">Submit your product.<br />Climb the leaderboard.<br />Get noticed.</div>
            <p className="muted" style={{ fontSize: 11, marginTop: 15 }}>Razorpay and any real-money features are intentionally out of scope for now.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}