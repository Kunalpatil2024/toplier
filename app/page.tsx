import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Sparkles, Trophy } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import Leaderboard from "@/components/Leaderboard";
import { MINIMUM_INCREMENT } from "@/lib/constants";
import { getListingFeed } from "@/lib/data";

export default async function Home() {
  const feed = await getListingFeed();

  return (
    <main className="home-main">
      <div className="container">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> The public board for what&apos;s next</div>
            <h1 className="display">Get seen.<br /><span>Climb higher.</span></h1>
            <p className="hero-description">People compete for visibility by climbing a public leaderboard built for products, startups, creators, and projects.</p>
            <span className="hero-tagline">Pay to climb. Get noticed.</span>
            <div className="hero-actions">
              <Link className="button" href="/submit">Submit Your Product <ArrowUpRight size={16} /></Link>
              <Link className="button button-quiet" href="#leaderboard">View Leaderboard <ArrowRight size={15} /></Link>
            </div>
            <div className="hero-meta">
              <strong>One board</strong><span className="separator" />
              <span>Every kind of builder</span><span className="separator" />
              <span>Demo amounts only</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Sample leaderboard preview">
            <div className="visual-top">
              <div className="visual-title"><BarChart3 size={16} /> The climb, at a glance</div>
              <span className="live-label"><i /> SAMPLE BOARD</span>
            </div>
            <div className="visual-chart">
              <div className="chart-grid" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="podium podium-two">
                <div className="podium-top"><span>#2</span></div>
                <div className="podium-bar" />
                <span className="podium-name">AgentX</span>
                <span className="podium-value mono">₹9,500</span>
              </div>
              <div className="podium podium-one">
                <div className="podium-top"><Trophy size={13} /><span>#1</span></div>
                <div className="podium-bar" />
                <span className="podium-name">SuperAI</span>
                <span className="podium-value mono">₹12,505</span>
              </div>
              <div className="podium podium-three">
                <div className="podium-top"><span>#3</span></div>
                <div className="podium-bar" />
                <span className="podium-name">FlowAI</span>
                <span className="podium-value mono">₹7,000</span>
              </div>
            </div>
            <div className="visual-foot"><span><Sparkles size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Every climb reshuffles the board</span><strong>+₹{MINIMUM_INCREMENT} minimum</strong></div>
          </div>
        </section>

        <hr className="hero-rule" />

        <section id="leaderboard" aria-labelledby="leaderboard-title">
          <div className="home-intro">
            <div>
              <div className="eyebrow">The public board</div>
              <h2 className="display" id="leaderboard-title">Who&apos;s climbing?</h2>
              <p>Ranked by current value. One move can change the whole board.</p>
            </div>
            <Link className="button button-small" href="/submit">Add your product <ArrowUpRight size={14} /></Link>
          </div>
          <CategoryFilter />
          <div style={{ marginTop: 15 }}>
            <Leaderboard feed={feed} compact />
          </div>
        </section>

        <section className="how-strip" aria-label="How Toplier works">
          <div className="how-step"><span className="step-number">01</span><div><h3>Put your product on the board</h3><p>Share a clear listing in the right category.</p></div></div>
          <div className="how-step"><span className="step-number">02</span><div><h3>Climb past the next spot</h3><p>Set a higher demo value to move up.</p></div></div>
          <div className="how-step"><span className="step-number">03</span><div><h3>Get noticed</h3><p>Your new position is public and easy to share.</p></div></div>
        </section>
      </div>
    </main>
  );
}
