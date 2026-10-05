import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { getSupabaseServerClient } from "@/lib/supabase";

export default async function Navbar() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link className="brand" href="/" aria-label="Toplier home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          TOPLIER
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/#leaderboard">Leaderboard</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/about">About</Link>
          {user ? (
            <>
              <span className="field-hint">{user.email}</span>
              <form action={signOutAction}>
                <button className="button button-quiet button-small" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link className="button button-quiet button-small" href="/login">Sign in</Link>
              <Link className="button button-quiet button-small" href="/signup">Sign up</Link>
              <Link className="button button-small" href="/submit">Submit a product <ArrowUpRight size={14} /></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}