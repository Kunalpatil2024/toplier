import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            TOPLIER
          </Link>
          <small>Pay to climb. Get noticed.</small>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
          <Link href="/admin">Development admin <ArrowUpRight size={12} /></Link>
          <span>Demo amounts only</span>
        </nav>
      </div>
    </footer>
  );
}