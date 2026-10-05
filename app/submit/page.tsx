import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import SubmitForm from "@/components/SubmitForm";
import { getSupabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = { title: "Submit your product" };

export default async function SubmitPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Your place on the board</div>
          <h1 className="display">Make your first move.</h1>
          <p>Tell the board what you&apos;re building. Starting rank values are simulated demo amounts, not payments.</p>
        </div>
        <div className="form-layout">
          {user ? (
            <SubmitForm />
          ) : (
            <div className="panel form-panel">
              <p>Sign in to submit a listing and manage its simulated climbs.</p>
              <Link className="button" href="/login">Sign in to continue <Check size={14} /></Link>
            </div>
          )}
          <aside className="panel form-aside">
            <h2>Before you submit</h2>
            <p>Listings are public. Keep your description clear, use a working website, and choose the closest category.</p>
            <ul>
              <li><Check size={14} /> Starting value from ₹99</li>
              <li><Check size={14} /> Changes rank on the public board</li>
              <li><ShieldCheck size={14} /> No payment details collected</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}