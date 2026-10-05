"use client";

import { RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container error-page">
      <div className="eyebrow" style={{ justifyContent: "center" }}>Something went wrong</div>
      <h1 className="display">That didn&apos;t go to plan.</h1>
      <p>The page could not be loaded. Your listings and rank values have not been changed by this error.</p>
      <button className="button" type="button" onClick={reset}><RefreshCw size={14} /> Try again</button>
    </main>
  );
}