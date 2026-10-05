import type { Metadata } from "next";
import Link from "next/link";
import SignInForm from "@/components/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Secure account access</div>
          <h1 className="display">Sign in to Toplier.</h1>
          <p>Use the email on your existing account. We&apos;ll send you a secure, one-time sign-in link.</p>
        </div>
        <div className="form-layout">
          <div>
            {error === "sign-in" && <p className="form-error" role="alert">That sign-in link could not be verified. Request a new one and try again.</p>}
            <SignInForm />
            <p className="field-hint" style={{ marginTop: 14 }}>
              Need an account? <Link href="/signup">Sign up</Link>. <Link href="/">Back to the leaderboard</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
